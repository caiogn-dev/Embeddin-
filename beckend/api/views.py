from django.shortcuts import render
from django.http import JsonResponse
from .models import Document
from .utils.embeddings import generate_embedding
from rest_framework.views import APIView, View
from rest_framework.response import Response
from .models import Document, Chunk
from .utils.pdf_to_md import pdf_to_md
from .utils.chunking import chunk_text
from .utils.embeddings import generate_embedding
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
import logging
import os


logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class UploadPDFView(View):
    def post(self, request):
        pdf_file = request.FILES.get("file")
        if not pdf_file:
            return JsonResponse({"error": "No file provided"}, status=400)

        try:
            # Save PDF temporarily
            pdf_path = f"/tmp/{pdf_file.name}"
            with open(pdf_path, "wb") as f:
                f.write(pdf_file.read())

            # Convert PDF to Markdown
            md_path = pdf_to_md(pdf_path, "/tmp")

            # Read Markdown content
            with open(md_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Save document
            document = Document.objects.create(name=pdf_file.name, content=content)

            # Chunk and generate embeddings
            chunks = chunk_text(content)
            for chunk in chunks:
                embedding = generate_embedding(chunk)
                Chunk.objects.create(document=document, content=chunk, embedding=embedding)

            return JsonResponse({"message": "PDF processed successfully", "document_id": document.id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


class EmbeddingFormView(APIView):
    template_name = "embedding_form.html"
    def get(self, request):
        # Renderiza o template HTML para o formulário
        return render(request, self.template_name)
    def post(self, request):
        logger.debug("Received POST request with data: %s", request.POST)
        text = request.POST.get('text')
        if not text:
            logger.error("No text provided in the request")
            return JsonResponse({"error": "No text provided"}, status=400)

        try:
            embedding = generate_embedding(text)
            document = Document.objects.create(name="Generated Embedding", content=text, embedding=embedding)
            logger.info("Embedding saved successfully with document ID: %s", document.id)
            return JsonResponse({"message": "Embedding saved successfully", "document_id": document.id})
        except Exception as e:
            logger.exception("Error while generating embedding")
            return JsonResponse({"error": str(e)}, status=500)


class ListDocumentsAPIView(APIView):
    def get(self, request):
        documents = Document.objects.all()
        data = [
            {
                "id": doc.id,
                "name": doc.name,
                "created_at": doc.created_at.isoformat(),
                "chunks": [
                    {
                        "id": chunk.id,
                        "content": chunk.content,
                        "embedding": chunk.embedding,
                    }
                    for chunk in doc.chunks.all()
                ],
                "tokens": sum(len(chunk.content.split()) for chunk in doc.chunks.all()),
            }
            for doc in documents
        ]
        return Response(data)


@method_decorator(csrf_exempt, name='dispatch')
class SearchAPIView(APIView):
    def post(self, request):
        query = request.data.get('query')
        if not query:
            return Response({"error": "No query provided"}, status=400)

        try:
            # Generate embedding for the search query
            query_embedding = generate_embedding(query)
            
            # Perform similarity search against stored chunks with manual cosine similarity
            chunks = Chunk.objects.all()
            results = []
            for chunk in chunks:
                # Calculate cosine similarity manually
                similarity = sum(a * b for a, b in zip(query_embedding, chunk.embedding)) / (
                    (sum(a * a for a in query_embedding) ** 0.5) * (sum(b * b for b in chunk.embedding) ** 0.5)
                )
                if similarity > 0.4:  # Lowered threshold for relevance
                    results.append({
                        "document_id": chunk.document.id,
                        "document_name": chunk.document.name,
                        "chunk_id": chunk.id,
                        "content": chunk.content,
                        "similarity": similarity
                    })
            
            # Sort results by similarity in descending order
            results.sort(key=lambda x: x["similarity"], reverse=True)
            
            # Limit to top 15 results for broader coverage
            results = results[:15]
            
            # Enhance results with LLM if available
            if results:
                try:
                    from .utils.llm import generate_response
                    import asyncio
                    
                    # Combine content of top results as context for LLM, prioritizing longer chunks for better context
                    top_chunks = sorted(results[:5], key=lambda x: len(x["content"]), reverse=True)[:3]
                    context = "\n\n".join([chunk["content"] for chunk in top_chunks])
                    # Use LLM to generate a synthesized response
                    # Ensure asyncio runs in a new event loop if needed to avoid thread issues
                    synthesized_response = asyncio.new_event_loop().run_until_complete(generate_response(query, context))
                    
                    return Response({
                        "results": results,
                        "synthesized_response": synthesized_response
                    })
                except Exception as llm_error:
                    logger.error(f"LLM enhancement error: {str(llm_error)}")
                    return Response({"results": results, "warning": "Could not generate synthesized response"})
            else:
                return Response({"results": results})
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return Response({"error": str(e)}, status=500)
