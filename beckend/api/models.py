from django.db import models
from pgvector.django import VectorField

class Document(models.Model):
    markdown = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    token_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Document {self.id}"

class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_text = models.TextField()
    embedding = VectorField(dimensions=768)  # Adjust dimensions based on Ollama model
    chunk_index = models.IntegerField()

    class Meta:
        ordering = ['document', 'chunk_index']
        unique_together = ['document', 'chunk_index']

    def __str__(self):
        return f"Chunk {self.chunk_index} of Document {self.document_id}"