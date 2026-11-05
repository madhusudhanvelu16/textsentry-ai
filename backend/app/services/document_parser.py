"""Document Parser for TextSentry AI.

Extracts plain text from uploaded TXT and DOCX files with strict 5MB safety limits.
"""

from __future__ import annotations
import io
from fastapi import HTTPException, UploadFile
import docx


MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def extract_text_from_upload(file: UploadFile) -> str:
    """Safely extract plain text from an uploaded TXT or DOCX file."""
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of 5 MB (received {len(content) / (1024*1024):.2f} MB)."
        )

    filename = file.filename or "unknown.txt"
    lower_name = filename.lower()

    if lower_name.endswith(".docx"):
        try:
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs]
            return "\n".join(paragraphs)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse DOCX file: {str(e)}"
            )
    elif lower_name.endswith(".txt") or file.content_type in ["text/plain", "application/octet-stream"]:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return content.decode("latin-1")
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unable to decode text file: {str(e)}"
                )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{filename}'. Please upload a .txt or .docx file."
        )

