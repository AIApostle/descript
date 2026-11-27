from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings


class Base(DeclarativeBase):
    pass


_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def create_engine_and_session(database_url: str | None = None) -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    settings = get_settings()
    url = database_url or settings.normalized_database_url
    is_pg = url.startswith("postgresql")

    engine_kwargs: dict = {
        "echo": False,
        "future": True,
    }
    if is_pg:
        # Neon Serverless PostgreSQL pool tuning
        engine_kwargs.update(
            {
                "pool_pre_ping": True,
                "pool_recycle": 300,
                "pool_size": 5,
                "max_overflow": 10,
            }
        )

    engine = create_async_engine(url, **engine_kwargs)
    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    return engine, session_factory


def get_engine() -> AsyncEngine:
    global _engine, _session_factory
    if _engine is None:
        _engine, _session_factory = create_engine_and_session()
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _engine, _session_factory
    if _session_factory is None:
        _engine, _session_factory = create_engine_and_session()
    return _session_factory


def reset_database_engine(database_url: str | None = None) -> None:
    global _engine, _session_factory
    _engine, _session_factory = create_engine_and_session(database_url)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


DEFAULT_NETWORKS = [
    {
        "slug": "kiroween",
        "name": "Kiroween Network",
        "residence_domain": "kiroween-residence",
        "description": "Primary production identity namespace for autonomous AI agents and service integrations.",
        "issuer": "Descript Root Authority",
        "policy_summary": "Ed25519 asymmetric credentials required. Instant revocation and challenge-response verification.",
        "is_public": True,
    },
    {
        "slug": "partner-network",
        "name": "Partner Network",
        "residence_domain": "partner-residence",
        "description": "Federated namespace for B2B service integrators, financial tools, and verified partner runtimes.",
        "issuer": "Descript Partner Authority",
        "policy_summary": "Controller verification required; supports multi-credential rotation and strict audit logging.",
        "is_public": True,
    },
    {
        "slug": "open-agent-grid",
        "name": "Open Agent Grid",
        "residence_domain": "open-grid-residence",
        "description": "Open sandbox and experimental namespace for developer agents, testing, and multi-agent workflows.",
        "issuer": "Descript Community Authority",
        "policy_summary": "Open registration with standard Ed25519 key binding and public Bytecript resolution.",
        "is_public": True,
    },
]


async def seed_default_networks(session: AsyncSession) -> None:
    from .models import ByteNetwork

    existing = (await session.execute(select(ByteNetwork.slug))).scalars().all()
    existing_set = set(existing)
    added = False
    for net in DEFAULT_NETWORKS:
        if net["slug"] not in existing_set:
            session.add(ByteNetwork(**net))
            added = True
    if added:
        await session.commit()


async def init_db() -> None:
    from pathlib import Path
    from sqlalchemy import text
    from . import models  # noqa: F401

    settings = get_settings()
    db_dir = Path(__file__).resolve().parents[3] / "db"
    if settings.is_postgres and db_dir.is_dir():
        # Execute modular SQL scripts from db/ using unpooled direct connection
        unpooled_engine, _ = create_engine_and_session(settings.normalized_database_url_unpooled)
        try:
            async with unpooled_engine.begin() as conn:
                for sql_file in sorted(db_dir.glob("*.sql")):
                    content = sql_file.read_text(encoding="utf-8")
                    await conn.execute(text(content))
        finally:
            await unpooled_engine.dispose()
    else:
        engine = get_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    session_factory = get_session_factory()
    async with session_factory() as session:
        await seed_default_networks(session)


def new_prefixed_id(prefix: str) -> str:
    """Generate a compact, sortable-ish URL-safe prefixed identifier."""
    ts_hex = f"{int(datetime.now(UTC).timestamp() * 1000):012x}"
    rand_hex = uuid.uuid4().hex[:20]
    return f"{prefix}_{ts_hex}{rand_hex}"
