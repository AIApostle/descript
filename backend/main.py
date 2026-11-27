"""
Entry point for Render / Uvicorn when root directory is set to 'backend'
"""
import sys
from pathlib import Path

src_path = str(Path(__file__).resolve().parent / "src")
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from backend.main import app, create_app  # noqa: F401
