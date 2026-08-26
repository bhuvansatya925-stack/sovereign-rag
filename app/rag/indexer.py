from pathlib import Path

from app.chunking.chunker import chunk_text
from app.embeddings.model import EmbeddingModel
from app.ingestion.loader import load_document
from app.vectorstore.store import VectorStore


class RAGIndexer:
    def __init__(self) -> None:
        self.embedder = EmbeddingModel()
        self.vector_store = VectorStore()

    def index_document(self, path: Path) -> int:
        """Extract, chunk, embed, and store a document."""

        text = load_document(path)

        if not text:
            return 0

        chunks = chunk_text(text)

        if not chunks:
            return 0

        texts = [chunk.text for chunk in chunks]
        embeddings = self.embedder.encode(texts)

        document_name = path.name

        ids = [
            f"{document_name}:{chunk.chunk_id}"
            for chunk in chunks
        ]

        metadatas = [
            {
                "source": document_name,
                "chunk_id": chunk.chunk_id,
            }
            for chunk in chunks
        ]

        self.vector_store.add_documents(
            ids=ids,
            texts=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        return len(chunks)
