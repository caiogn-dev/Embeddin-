import httpx
import os
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

XAI_API_KEY = os.getenv('XAI_API_KEY')
XAI_API_URL = 'https://api.x.ai/v1/chat/completions'

async def generate_response(query: str, context: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            XAI_API_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {XAI_API_KEY}'
            },
            json={
                'messages': [
                    {
                        'role': 'system',
                        'content': f'You are a helpful AI assistant that answers questions based on the provided context. Context: {context}'
                    },
                    {
                        'role': 'user',
                        'content': query
                    }
                ],
                'model': 'grok-2-latest',
                'stream': False,
                'temperature': 0.1,
                'max_tokens': 1000
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to generate response: {response.text}")
            
        data = response.json()
        return data['choices'][0]['message']['content']