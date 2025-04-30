from django.urls import path
from .views import  rag_search, ListDocumentsAPIView, SearchAPIView, DocumentUploadView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='upload'),
    path('list-documents/', ListDocumentsAPIView.as_view(), name='list-documents'),
    path('search/', SearchAPIView.as_view(), name='search'),
    path('rag_search/', rag_search, name='rag-search'),  # Added for rag_search view
]
