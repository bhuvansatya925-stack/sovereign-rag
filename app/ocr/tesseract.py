from pathlib import Path
import subprocess


def ocr_image(
    path: Path,
    language: str = "eng",
) -> str:
    """Extract text from an image using Tesseract."""

    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path}")

    result = subprocess.run(
        [
            "tesseract",
            str(path),
            "stdout",
            "-l",
            language,
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    return result.stdout.strip()
