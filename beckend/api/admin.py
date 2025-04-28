from django.contrib import admin
from .models import Document, Chunk

# Registra o modelo Document no Django Admin
@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')  # Campos exibidos na lista
    search_fields = ('name', 'content')  # Campos para busca
    list_filter = ('created_at',)  # Filtros laterais

# Registra o modelo Chunk no Django Admin
@admin.register(Chunk)
class ChunkAdmin(admin.ModelAdmin):
    list_display = ('id', 'document', 'display_embedding', 'created_at')  # Campos exibidos na lista
    search_fields = ('content',)  # Campos para busca
    list_filter = ('created_at',)  # Filtros laterais
    
    def display_embedding(self, obj):
        """Custom display for embedding field to avoid ValueError."""
        embedding = getattr(obj, 'embedding', None)
        if embedding is not None:
            try:
                return f"Vector ({len(embedding)} dimensions)"
            except Exception:
                return "Vector (unknown dimensions)"
        return "No embedding"
    display_embedding.short_description = 'Embedding'
