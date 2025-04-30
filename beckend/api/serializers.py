from rest_framework import serializers
from .models import Document, DocumentChunk

        
class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = ['chunk_text', 'embedding', 'chunk_index']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'markdown', 'created_at', 'updated_at', 'token_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'token_count']