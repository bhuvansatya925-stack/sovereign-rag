import unittest

from sqlalchemy import text

from app.database.postgres import PostgreSQLVectorStore, engine


class PostgreSQLVectorStoreTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.store = PostgreSQLVectorStore()
        cls.store.initialize()

    @classmethod
    def tearDownClass(cls):
        cls.store.close()

    def tearDown(self):
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    DELETE FROM documents
                    WHERE filename LIKE 'test-postgres-%'
                    """
                )
            )

    def test_page_chunk_identity_does_not_collide(self):
        self.store.add_documents(
            ids=[
                "test-postgres-page-1-chunk-0",
                "test-postgres-page-2-chunk-0",
            ],
            texts=[
                "Page one content.",
                "Page two content.",
            ],
            embeddings=[
                [0.0] * 383 + [1.0],
                [1.0] + [0.0] * 383,
            ],
            metadatas=[
                {
                    "source": "test-postgres-document.pdf",
                    "page": 1,
                    "chunk_id": 0,
                },
                {
                    "source": "test-postgres-document.pdf",
                    "page": 2,
                    "chunk_id": 0,
                },
            ],
        )

        results = self.store.get_by_source(
            "test-postgres-document.pdf"
        )

        self.assertEqual(len(results), 2)

        pages = sorted(
            item["metadata"]["page"]
            for item in results
        )

        self.assertEqual(pages, [1, 2])


if __name__ == "__main__":
    unittest.main()
