import re


class HybridRetriever:
    def __init__(self, store, embedder):
        self.store = store
        self.embedder = embedder

    def search(self, question: str, n_results: int = 5):
        query_embedding = self.embedder.encode([question])[0]

        # Retrieve a larger candidate set first.
        candidate_count = max(n_results * 4, 20)

        results = self.store.search(
            query_embedding,
            candidate_count,
        )

        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        # Extract useful exact identifiers from the question.
        equipment_tags = re.findall(
            r"\b[A-Z]{2}-\d{3,6}\b",
            question.upper(),
        )

        document_ids = re.findall(
            r"\bDOC-\d{4,6}\b",
            question.upper(),
        )

        reference_codes = re.findall(
            r"\bREF-\d{4,6}-\d{4,6}\b",
            question.upper(),
        )

        ranked = []

        for document, metadata, distance in zip(
            documents,
            metadatas,
            distances,
        ):
            score = float(distance)

            equipment_tag = str(
                metadata.get("equipment_tag", "")
            ).upper()

            document_id = str(
                metadata.get("document_id", "")
            ).upper()

            reference_code = str(
                metadata.get("reference_code", "")
            ).upper()

            # Lower cosine distance is better.
            # Apply strong bonuses for exact identifier matches.
            if equipment_tag in equipment_tags:
                score -= 0.50

            if document_id in document_ids:
                score -= 0.50

            if reference_code in reference_codes:
                score -= 0.50

            ranked.append(
                (
                    score,
                    document,
                    metadata,
                    distance,
                )
            )

        ranked.sort(key=lambda item: item[0])

        ranked = ranked[:n_results]

        return {
            "documents": [[item[1] for item in ranked]],
            "metadatas": [[item[2] for item in ranked]],
            "distances": [[item[3] for item in ranked]],
        }
