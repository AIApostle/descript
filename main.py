"""
Entry point for Render / Uvicorn when root directory is repository root
"""
import sys
from pathlib import Path

backend_src_path = str(Path(__file__).resolve().parent / "backend" / "src")
if backend_src_path not in sys.path:
    sys.path.insert(0, backend_src_path)

from backend.main import app, create_app  # noqa: F401
