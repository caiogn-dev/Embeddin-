from django.shortcuts import render
import logging
import asyncio
from django.db.models import Sum, Count
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
import requests
from rest_framework.permissions import AllowAny
from .utils.embeddings import generate_embedding
from rest_framework.views import APIView, View
from rest_framework.response import Response
from rest_framework import status
from .serializers import DocumentSerializer
from .models import Document, DocumentChunk
from .utils.chunking import chunk_text
from .utils.embeddings import generate_embedding
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
import logging
import os
from pgvector.django import CosineDistance
from .utils.rag import qa_chain
from .utils.llm import generate_response

logger = logging.getLogger(__name__)


@api_view(['POST'])
def rag_search(request):
    query = request.data.get('query')
    if not query:
        logger.error("No query provided in request")
        return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Generate response with RAG chain
        response = qa_chain.invoke(query)
        # Handle different response formats from LangChain
        if hasattr(response, 'generations') and response.generations:
            synthesized_response = response.generations[0].message.content
        elif hasattr(response, 'content'):
            synthesized_response = response.content
        elif isinstance(response, dict):
            synthesized_response = str(response)
        else:
            synthesized_response = response if isinstance(response, str) else str(response)
        
        # Fetch search results from SearchAPIView
        search_response = requests.post("http://127.0.0.1:8000/api/documents/search/", json={"query": query})
        search_response.raise_for_status()
        search_results = search_response.json().get("results", [])
        
        return Response({
            "synthesized_response": synthesized_response,
            "results": search_results
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error in rag_search: {str(e)}")
        return Response({"error": f"Failed to process request: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class DocumentUploadView(APIView):
    def post(self, request, *args, **kwargs):
        logger.debug(f"Received request data: {request.data}")

        # Check if markdown is provided
        if 'markdown' not in request.data:
            logger.error("No markdown provided in request")
            return Response(
                {"errors": "No markdown provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Initialize serializer
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            document = serializer.save()
            try:
                markdown = request.data['markdown']
                chunks = chunk_text(markdown, chunk_size=500, overlap=50)
                token_count = sum(len(chunk.split()) for chunk in chunks)

                # Generate and save embeddings for each chunk
                for index, chunk in enumerate(chunks):
                    embedding = generate_embedding(chunk)
                    DocumentChunk.objects.create(
                        document=document,
                        chunk_text=chunk,
                        embedding=embedding,
                        chunk_index=index
                    )

                # Update token_count in the document
                document.token_count = token_count
                document.save()

                logger.info(f"Document {document.id} uploaded successfully with {len(chunks)} chunks")
                return Response(
                    {"document_id": document.id},
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                logger.error(f"Failed to process chunks for document {document.id}: {str(e)}")
                document.delete()
                return Response(
                    {"errors": f"Failed to process chunks: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )


class ListDocumentsAPIView(APIView):
    def get(self, request):
        documents = Document.objects.prefetch_related('chunks').all()
        data = [
            {
                "id": doc.id,
                "markdown": doc.markdown[:200],  # Truncate for brevity
                "created_at": doc.created_at.isoformat(),
                "updated_at": doc.updated_at.isoformat(),
                "chunks": [
                    {
                        "id": chunk.id,
                        "chunk_text": chunk.chunk_text,
                        "chunk_index": chunk.chunk_index,
                    }
                    for chunk in doc.chunks.all()
                ],
                "token_count": sum(len(chunk.chunk_text.split()) for chunk in doc.chunks.all()),
            }
            for doc in documents
        ]
        return Response(data)

class SearchAPIView(APIView):
    def post(self, request):
        query = request.data.get('query')
        if not query:
            logger.error("No query provided in request")
            return Response({"error": "No query provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Generate embedding for the search query
            query_embedding = generate_embedding(query)
            if not query_embedding:
                logger.error("Failed to generate query embedding")
                return Response({"error": "Failed to generate query embedding"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Perform similarity search using pgvector's cosine distance
            chunks = DocumentChunk.objects.annotate(
                similarity=1 - CosineDistance('embedding', query_embedding)
            ).filter(
                similarity__gt=0.4
            ).select_related('document').order_by('-similarity')[:15]

            results = [
                {
                    "document_id": chunk.document.id,
                    "document_name": f"Document {chunk.document.id}",
                    "chunk_id": chunk.id,
                    "chunk_text": chunk.chunk_text,
                    "similarity": float(chunk.similarity),
                }
                for chunk in chunks
            ]

            # Enhance results with LLM if available
            if results:
                try:
                    top_chunks = sorted(results[:5], key=lambda x: len(x["chunk_text"]), reverse=True)[:3]
                    context = "\n\n".join([chunk["chunk_text"] for chunk in top_chunks])
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    synthesized_response = loop.run_until_complete(generate_response(query, context))
                    loop.close()
                    return Response({
                        "results": results,
                        "synthesized_response": synthesized_response
                    }, status=status.HTTP_200_OK)
                except Exception as llm_error:
                    logger.error(f"LLM enhancement error: {str(llm_error)}")
                    return Response({
                        "results": results,
                        "warning": "Could not generate synthesized response"
                    }, status=status.HTTP_200_OK)
            else:
                return Response({"results": results}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
