from app.generation.gemini import GeminiGenerator


class RAGPipeline:
    """End-to-end retrieval-augmented generation pipeline."""

    def __init__(
        self,
        retriever,
        generator: GeminiGenerator,
    ) -> None:
        self.retriever = retriever
        self.generator = generator

    def retrieve(
        self,
        question: str,
        n_results: int = 5,
        source: str | None = None,
    ) -> list[dict]:
        """Retrieve relevant document contexts."""

        if not question or not question.strip():
            return []

        results = self.retriever.search(
            question.strip(),
            n_results,
            source=source,
        )

        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        contexts = []

        for document, metadata, distance in zip(
            documents,
            metadatas,
            distances,
        ):
            contexts.append(
                {
                    "text": document,
                    "metadata": metadata,
                    "distance": distance,
                }
            )

        return contexts

    def ask(
        self,
        question: str,
        n_results: int = 3,
        source: str | None = None,
    ) -> dict:
        """Retrieve relevant context and generate an answer."""

        question = question.strip()

        if not question:
            return {
                "answer": "Please enter a question.",
                "sources": [],
                "contexts": [],
            }

        contexts = self.retrieve(
            question,
            n_results,
            source=source,
        )

        if not contexts:
            return {
                "answer": (
                    "I don't have enough information "
                    "in the provided documents."
                ),
                "sources": [],
                "contexts": [],
            }

        answer = self.generator.generate(
            question,
            contexts,
        )

        sources = []

        answer_lower = answer.lower()

        not_found_phrases = [
            "i don't have enough information",
            "i do not have enough information",
            "not enough information",
            "cannot answer",
            "can't answer",
        ]

        answer_is_grounded = not any(
            phrase in answer_lower
            for phrase in not_found_phrases
        )

        if answer_is_grounded:
            for context in contexts:
                source = context["metadata"].get("source")

                if source and source not in sources:
                    sources.append(source)

        return {
            "answer": answer,
            "sources": sources,
            "contexts": contexts,
        }
