from django.db import models
from pgvector.django import VectorField

class Document(models.Model):
    id = models.BigAutoField(primary_key=True)  # Explicitly define the id field
    name = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Chunk(models.Model):
    document = models.ForeignKey(Document, related_name="chunks", on_delete=models.CASCADE)
    content = models.TextField()
    embedding = VectorField(models.FloatField(), dimensions=768)
    created_at = models.DateTimeField(auto_now_add=True)