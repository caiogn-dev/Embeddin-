import re
import numpy as np
from typing import List
from django.conf import settings
import requests

OLLAMA_API_URL = "http://localhost:11434/api/embeddings"

def generate_embedding(text):
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": "nomic-embed-text:v1.5", "prompt": text}
        )
        response.raise_for_status()
        data = response.json()
        if "embedding" not in data:
            raise RuntimeError(f"Embedding not found in Ollama response: {data}")
        return data["embedding"]
    except requests.RequestException as e:
        raise RuntimeError(f"Failed to generate embedding: {e}")

        
def count_tokens(text):
    """Estimate tokens by counting words."""
    words = re.split(r'\s+', text.strip())
    return len(words)

def cosine_similarity(a: List[float], b: List[float]) -> float:
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))