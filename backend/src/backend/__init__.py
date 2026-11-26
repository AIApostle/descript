from __future__ import annotations

import uvicorn

from .main import app, create_app


def main() -> None:
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)


__all__ = ["app", "create_app", "main"]
