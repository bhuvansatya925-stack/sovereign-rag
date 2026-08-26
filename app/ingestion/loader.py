from pathlib import Path

from docx import Document
from pypdf import PdfReader


def load_pdf(path: Path) -> str:
    """Extract text from a PDF file."""
    reader = PdfReader(str(path))
    pages = []

    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)

    return "\n\n".join(pages).strip()


def load_docx(path: Path) -> str:
    """Extract text from a DOCX file."""
    document = Document(str(path))
    return "\n".join(
        paragraph.text
        for paragraph in document.paragraphs
        if paragraph.text.strip()
    ).strip()


def load_txt(path: Path) -> str:
    """Read a plain-text file."""
    return path.read_text(encoding="utf-8", errors="ignore").strip()


def load_document(path: Path) -> str:
    """Load a supported document and return its text."""
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return load_pdf(path)

    if suffix == ".docx":
        return load_docx(path)

    if suffix in {".txt", ".md"}:
        return load_txt(path)

    raise ValueError(f"Unsupported file type: {suffix}")
