from django.urls import path
from .views import EmbeddingFormView, UploadPDFView, ListDocumentsAPIView, SearchAPIView

urlpatterns = [
    path('embedding-form/', EmbeddingFormView.as_view(), name='embedding-form'),
    path('upload/', UploadPDFView.as_view(), name='upload-pdf'),
    path('list-documents/', ListDocumentsAPIView.as_view(), name='list-documents'),
    path('search/', SearchAPIView.as_view(), name='search'),
]
