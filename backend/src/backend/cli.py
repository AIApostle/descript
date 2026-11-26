from __future__ import annotations

import asyncio

from .database import init_db


def migrate_main() -> None:
    """Create tables (if missing) and seed default Byte Networks in the configured database."""
    asyncio.run(init_db())
    print("Descript database initialized and Byte Networks seeded.")
