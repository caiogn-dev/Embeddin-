import os
from openai import OpenAI
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain.chains import RetrievalQA
import requests
from typing import List, Optional

# Inicializa o client X.AI (OpenAI compatible)
client = OpenAI(
    api_key=os.environ.get("XAI_API_KEY"),
    base_url="https://api.x.ai/v1",
)

class XAIChat(BaseChatModel):
    model: str

    def __init__(self, model: str = "grok-3"):
        super().__init__(model=model)
        self.model = model

    def _generate(self, messages: List[HumanMessage | AIMessage], stop: Optional[List[str]] = None) -> ChatResult:
        # Converte mensagens para o formato esperado pelo client
        api_messages = [
            {"role": "user" if isinstance(msg, HumanMessage) else "assistant", "content": msg.content}
            for msg in messages
        ]
        # Exemplo: pode adicionar uma mensagem system se desejar
        # api_messages.insert(0, {"role": "system", "content": "You are a PhD-level mathematician."})
        response = client.chat.completions.create(
            model=self.model,
            messages=api_messages,
        )
        content = response.choices[0].message.content
        message = AIMessage(content=content)
        generation = ChatGeneration(message=message)
        return ChatResult(generations=[generation])

    @property
    def _llm_type(self) -> str:
        return "xai-chat"

class CustomRetriever(BaseRetriever):
    def _get_relevant_documents(self, query: str) -> list[Document]:
        try:
            response = requests.post("http://127.0.0.1:8000/api/documents/search/", json={"query": query})
            response.raise_for_status()
            results = response.json().get("results", [])
            documents = [
                Document(
                    page_content=result["chunk_text"],
                    metadata={"document_id": result["document_id"], "chunk_id": result["chunk_id"]}
                )
                for result in results
            ]
            return documents
        except Exception as e:
            print(f"Error in CustomRetriever: {str(e)}")
            return []

# Initialize LLM and QA chain
llm = XAIChat(
    model="grok-3"
)
retriever = CustomRetriever()
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever
)
