from pathlib import Path

from app.embeddings.model import EmbeddingModel
from app.generation.gemini import GeminiGenerator
from app.interfaces.embedding import EmbeddingProvider
from app.interfaces.generator import Generator
from app.rag.indexer import RAGIndexer
from app.rag.pipeline import RAGPipeline
from app.retrieval.hybrid import HybridRetriever
from app.vectorstore.store import VectorStore


class RAGService:
    """Public service interface for the Sovereign RAG system."""

    def __init__(
        self,
        vector_store_path=None,
        collection_name="sovereign_rag",
        embedder: EmbeddingProvider | None = None,
        generator: Generator | None = None,
        vector_store: VectorStore | None = None,
    ) -> None:
        self.embedder = embedder or EmbeddingModel()

        self.vector_store = vector_store or VectorStore(
            path=vector_store_path,
            collection_name=collection_name,
        )

        self.indexer = RAGIndexer(
            embedder=self.embedder,
            vector_store=self.vector_store,
        )

        self.retriever = HybridRetriever(
            self.vector_store,
            self.embedder,
        )

        self.generator = generator or GeminiGenerator()

        self.pipeline = RAGPipeline(
            self.retriever,
            self.generator,
        )

    def ingest(self, path: Path) -> dict:
        """Ingest a document and return ingestion information."""

        path = Path(path)

        if not path.exists():
            raise FileNotFoundError(
                f"File not found: {path}"
            )

        chunks = self.indexer.index_document(path)

        return {
            "filename": path.name,
            "chunks_indexed": chunks,
            "vectors_stored": self.vector_store.count(),
        }

    def ask(
        self,
        question: str,
        n_results: int = 3,
        source: str | None = None,
    ) -> dict:
        """Ask a question against the indexed documents."""

        return self.pipeline.ask(
            question,
            n_results=n_results,
            source=source,
        )

    def count(self) -> int:
        """Return the number of stored vectors."""

        return self.vector_store.count()
