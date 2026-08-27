import chromadb

from app.config import CHROMA_DIR


class VectorStore:
    def __init__(self, path=None, collection_name="sovereign_rag") -> None:
        db_path = path if path is not None else CHROMA_DIR
        self.client = chromadb.PersistentClient(path=str(db_path))

        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def add_documents(
        self,
        ids: list[str],
        texts: list[str],
        embeddings,
        metadatas: list[dict],
    ) -> None:
        self.collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings.tolist(),
            metadatas=metadatas,
        )

    def search(self, embedding, n_results: int = 5):
        return self.collection.query(
            query_embeddings=[embedding.tolist()],
            n_results=n_results,
        )

    def get_by_metadata(
        self,
        field: str,
        values: list[str],
    ):
        results = []

        for value in values:
            matches = self.collection.get(
                where={field: value},
                include=[
                    "documents",
                    "metadatas",
                ],
            )

            documents = matches.get("documents", [])
            metadatas = matches.get("metadatas", [])

            for document, metadata in zip(
                documents,
                metadatas,
            ):
                results.append(
                    {
                        "document": document,
                        "metadata": metadata,
                        "distance": 0.0,
                    }
                )

        return results

    def count(self) -> int:
        return self.collection.count()
