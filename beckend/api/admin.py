from django.contrib import admin
from .models import Document, DocumentChunk

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_text_preview', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['markdown']
    date_hierarchy = 'created_at'

    def full_text_preview(self, obj):
        return obj.markdown[:100] + "..." if len(obj.markdown) > 100 else obj.markdown
    full_text_preview.short_description = 'Full Text'

@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ['id', 'document', 'chunk_index', 'chunk_text_preview']
    list_filter = ['document__created_at', 'chunk_index']  # Use related field
    search_fields = ['chunk_text']
    list_select_related = ['document']  # Optimize queries

    def chunk_text_preview(self, obj):
        return obj.chunk_text[:100] + "..." if len(obj.chunk_text) > 100 else obj.chunk_text
    chunk_text_preview.short_description = 'Chunk Text'