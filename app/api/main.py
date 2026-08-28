from fastapi import FastAPI

from app.api.routes import router


app = FastAPI(
    title="Sovereign RAG API",
    version="1.0.0",
    description=(
        "Document ingestion, OCR, retrieval and "
        "grounded question answering API."
    ),
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "Sovereign RAG",
        "status": "running",
    }
