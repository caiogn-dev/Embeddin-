from .embeddings import generate_embedding
from ..models import Document, DocumentChunk, ProcessingStatus
import asyncio

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    text_length = len(text)
    while start < text_length:
        end = min(start + chunk_size, text_length)
        if end < text_length:
            while end > start and text[end] != ' ':
                end -= 1
        chunks.append(text[start:end].strip())
        start = end - overlap
    return chunks

async def process_document(document: Document, content: str):
    try:
        # Update status to "processing"
        status = ProcessingStatus.objects.get(document=document)
        status.status = "processing"
        status.progress = 10
        status.save()

        # Split the document into chunks
        chunks = chunk_text(content)
        status.progress = 30
        status.save()

        # Generate embeddings for each chunk
        chunk_objects = []
        for i, chunk in enumerate(chunks):
            embedding = await generate_embedding(chunk)
            chunk_obj = DocumentChunk(
                document=document,
                content=chunk,
                embedding=embedding,
                chunk_index=i
            )
            chunk_objects.append(chunk_obj)
            status.progress = 30 + (50 * (i + 1) // len(chunks))
            status.save()

        # Save chunks and update the document
        DocumentChunk.objects.bulk_create(chunk_objects)
        document.content = content
        document.embedding = await generate_embedding(content)
        document.save()

        # Update status to "completed"
        status.status = "completed"
        status.progress = 100
        status.save()
    except Exception as e:
        status.status = "error"
        status.error_message = str(e)
        status.save()
        raise