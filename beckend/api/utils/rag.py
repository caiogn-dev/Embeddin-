# beckend/api/utils/rag.py
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain.chains import RetrievalQA
import requests
from typing import List, Optional

class XAIChat(BaseChatModel):
    xai_api_key: str
    model: str
    base_url: str

    def __init__(self, xai_api_key: str, model: str = "grok-beta", base_url: str = "https://api.x.ai/v1"):
        super().__init__(xai_api_key=xai_api_key, model=model, base_url=base_url)
        self.xai_api_key = xai_api_key
        self.model = model
        self.base_url = base_url

    def _generate(self, messages: List[HumanMessage | AIMessage], stop: Optional[List[str]] = None) -> ChatResult:
        """
        Gera uma resposta a partir de uma lista de mensagens (estilo chat).
        Utiliza a API da X.AI para obter a resposta do modelo.

        Parâmetros:
            messages (List[HumanMessage | AIMessage]): Lista de mensagens trocadas no chat.
            stop (Optional[List[str]]): Tokens de parada, se aplicável (não utilizado neste caso).

        Retorna:
            ChatResult: Objeto contendo a resposta gerada pelo modelo.
        """
        headers = {
            "Authorization": f"Bearer {self.xai_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user" if isinstance(msg, HumanMessage) else "assistant",
                    "content": msg.content
                }
                for msg in messages
            ],
        }

        response = requests.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()

        message = AIMessage(content=result["choices"][0]["message"]["content"])
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
    xai_api_key="xai-KpZZyU6MIarnkWHwteAirawTVHo2PyLp65MJrQVVQGlW3AvXPqcrnPabMc4zoi1pUDi21DCg3jnggntL"
)
retriever = CustomRetriever()
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever
)
