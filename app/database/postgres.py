import json
import os

from sqlalchemy import create_engine, text


DATABASE_URL = os.getenv(
    "SOVEREIGN_DATABASE_URL",
    "postgresql+psycopg://postgres:password@127.0.0.1:5433/local_rag_db",
)

engine = create_engine(
    DATABASE_URL,
    echo=False,
)


class PostgreSQLVectorStore:
    """Synchronous PostgreSQL + pgvector VectorStore adapter."""

    def initialize(self) -> None:
        with engine.begin() as conn:
            conn.execute(
                text("CREATE EXTENSION IF NOT EXISTS vector")
            )

            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS documents (
                        id SERIAL PRIMARY KEY,
                        filename TEXT NOT NULL,
                        file_path TEXT,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    )
                    """
                )
            )

            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id SERIAL PRIMARY KEY,
                        document_id INTEGER NOT NULL
                            REFERENCES documents(id)
                            ON DELETE CASCADE,
                        page INTEGER NOT NULL,
                        chunk_index INTEGER NOT NULL,
                        content TEXT NOT NULL,
                        embedding vector(384),
                        metadata JSONB DEFAULT '{}'::jsonb,
                        UNIQUE(document_id, page, chunk_index)
                    )
                    """
                )
            )

    def healthcheck(self) -> dict:
        with engine.connect() as conn:
            row = conn.execute(
                text(
                    """
                    SELECT
                        current_database() AS database,
                        EXISTS (
                            SELECT 1
                            FROM pg_extension
                            WHERE extname = 'vector'
                        ) AS pgvector
                    """
                )
            ).mappings().one()

        return {
            "database": row["database"],
            "pgvector": bool(row["pgvector"]),
        }

    def add_documents(
        self,
        ids: list[str],
        texts: list[str],
        embeddings,
        metadatas: list[dict],
    ) -> None:
        if not (
            len(ids)
            == len(texts)
            == len(embeddings)
            == len(metadatas)
        ):
            raise ValueError(
                "ids, texts, embeddings, and metadatas "
                "must have the same length"
            )

        with engine.begin() as conn:
            document_cache = {}

            for index, (
                item_id,
                content,
                embedding,
                metadata,
            ) in enumerate(
                zip(
                    ids,
                    texts,
                    embeddings,
                    metadatas,
                )
            ):
                metadata = dict(metadata or {})

                source = str(
                    metadata.get("source", item_id)
                )

                if source not in document_cache:
                    result = conn.execute(
                        text(
                            """
                            SELECT id
                            FROM documents
                            WHERE filename = :filename
                            ORDER BY id
                            LIMIT 1
                            """
                        ),
                        {"filename": source},
                    )

                    document_id = result.scalar()

                    if document_id is None:
                        result = conn.execute(
                            text(
                                """
                                INSERT INTO documents
                                    (filename, file_path)
                                VALUES
                                    (:filename, :file_path)
                                RETURNING id
                                """
                            ),
                            {
                                "filename": source,
                                "file_path": source,
                            },
                        )

                        document_id = result.scalar_one()

                    document_cache[source] = document_id

                document_id = document_cache[source]

                chunk_index = int(
                    metadata.get("chunk_id", index)
                )

                page = int(
                    metadata.get("page", 1)
                )

                vector = "[" + ",".join(
                    str(float(value))
                    for value in embedding
                ) + "]"

                conn.execute(
                    text(
                        """
                        INSERT INTO document_chunks
                            (
                                document_id,
                                page,
                                chunk_index,
                                content,
                                embedding,
                                metadata
                            )
                        VALUES
                            (
                                :document_id,
                                :page,
                                :chunk_index,
                                :content,
                                CAST(:embedding AS vector),
                                CAST(:metadata AS jsonb)
                            )
                        ON CONFLICT (
                            document_id,
                            page,
                            chunk_index
                        )
                        DO UPDATE SET
                            content = EXCLUDED.content,
                            embedding = EXCLUDED.embedding,
                            metadata = EXCLUDED.metadata
                        """
                    ),
                    {
                        "document_id": document_id,
                        "page": page,
                        "chunk_index": chunk_index,
                        "content": content,
                        "embedding": vector,
                        "metadata": json.dumps(metadata),
                    },
                )

    def search(
        self,
        embedding,
        n_results: int = 5,
        source: str | None = None,
    ) -> dict:
        vector = "[" + ",".join(
            str(float(value))
            for value in embedding
        ) + "]"

        with engine.connect() as conn:
            if source:
                result = conn.execute(
                    text(
                        """
                        SELECT
                            dc.content,
                            dc.metadata,
                            dc.embedding <=> CAST(
                                :embedding AS vector
                            ) AS distance
                        FROM document_chunks dc
                        JOIN documents d
                            ON d.id = dc.document_id
                        WHERE d.filename = :source
                        ORDER BY distance
                        LIMIT :limit
                        """
                    ),
                    {
                        "embedding": vector,
                        "source": source,
                        "limit": n_results,
                    },
                )
            else:
                result = conn.execute(
                    text(
                        """
                        SELECT
                            dc.content,
                            dc.metadata,
                            dc.embedding <=> CAST(
                                :embedding AS vector
                            ) AS distance
                        FROM document_chunks dc
                        ORDER BY distance
                        LIMIT :limit
                        """
                    ),
                    {
                        "embedding": vector,
                        "limit": n_results,
                    },
                )

            rows = result.mappings().all()

        return {
            "documents": [
                [row["content"] for row in rows]
            ],
            "metadatas": [
                [
                    dict(row["metadata"] or {})
                    for row in rows
                ]
            ],
            "distances": [
                [float(row["distance"]) for row in rows]
            ],
        }

    def get_by_metadata(
        self,
        field: str,
        values: list[str],
    ) -> list[dict]:
        allowed_fields = {
            "equipment_tag",
            "document_id",
            "reference_code",
        }

        if field not in allowed_fields:
            raise ValueError(
                f"Unsupported metadata field: {field}"
            )

        results = []

        with engine.connect() as conn:
            result = conn.execute(
                text(
                    """
                    SELECT
                        content,
                        metadata
                    FROM document_chunks
                    WHERE metadata ->> :field = ANY(:values)
                    """
                ),
                {
                    "field": field,
                    "values": values,
                },
            )

            for row in result.mappings():
                results.append(
                    {
                        "document": row["content"],
                        "metadata": dict(
                            row["metadata"] or {}
                        ),
                        "distance": 0.0,
                    }
                )

        return results

    def get_by_source(
        self,
        source: str,
    ) -> list[dict]:
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    """
                    SELECT
                        dc.content,
                        dc.metadata
                    FROM document_chunks dc
                    JOIN documents d
                        ON d.id = dc.document_id
                    WHERE d.filename = :source
                    ORDER BY dc.chunk_index
                    """
                ),
                {"source": source},
            )

            rows = result.mappings().all()

        return [
            {
                "text": row["content"],
                "metadata": dict(
                    row["metadata"] or {}
                ),
                "distance": 0.0,
            }
            for row in rows
        ]

    def count(self) -> int:
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "SELECT COUNT(*) FROM document_chunks"
                )
            )

            return int(result.scalar_one())

    def close(self) -> None:
        engine.dispose()
