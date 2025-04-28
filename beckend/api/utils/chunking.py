import re

def chunk_text(text, chunk_size=500, overlap=50):
    words = re.split(r'\s+', text)
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks