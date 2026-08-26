# Sovereign RAG

A local-first Retrieval-Augmented Generation (RAG) pipeline for querying enterprise documents using hybrid retrieval and grounded Gemini generation.

## Features

- Document ingestion
- Text chunking with overlap
- Metadata extraction
- Sentence-transformer embeddings
- ChromaDB vector storage
- Hybrid retrieval
- Gemini answer generation
- Source attribution
- Retrieval and scaling benchmarks

## Setup

Create and activate a virtual environment:

    python -m venv .venv
    source .venv/bin/activate

Install dependencies:

    pip install -r requirements.txt

Configure Gemini:

    cp .env.example .env

Edit .env and add your own Gemini API key:

    GEMINI_API_KEY=your_gemini_api_key_here

Never commit .env.

## Run

    PYTHONPATH=. python app/cli.py

For locally cached embedding models:

    HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 PYTHONPATH=. python app/cli.py

## Retrieval Benchmark

- Top-1 accuracy: 100%
- Top-3 accuracy: 100%
- Top-5 accuracy: 100%
- Average query latency: approximately 59 ms

## Scaling Benchmark

1,000-document indexing benchmark:

- Documents: 1,000
- Chunks: 1,000
- Stored vectors: 1,000
- Indexing time: approximately 126.56 seconds
- Throughput: approximately 7.9 documents/second

## Security

The following are excluded from Git:

- .env
- .venv/
- ChromaDB databases
- Uploaded documents
- Generated scaling documents

## Project Structure

    app/
    ├── chunking/
    ├── embeddings/
    ├── generation/
    ├── ingestion/
    ├── metadata/
    ├── ocr/
    ├── rag/
    ├── retrieval/
    └── vectorstore/

    data/
    ├── benchmark/
    └── scaling/

    .env.example
    .gitignore
    README.md
    requirements.txt

## Status

Active development.
