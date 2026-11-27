from __future__ import annotations

import time
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .config import get_settings
from .database import get_session_factory, init_db
from .routers import agents, api_keys, auth, messages, networks, netprints, platform_auth, verify
from .schemas import HealthOut


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Cryptographic identity infrastructure and Bytecript registry for AI agents.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthOut, tags=["Health"], summary="Service and database health check")
    @app.get("/healthz", response_model=HealthOut, tags=["Health"], include_in_schema=False)
    @app.get("/livez", response_model=HealthOut, tags=["Health"], include_in_schema=False)
    @app.get("/readyz", response_model=HealthOut, tags=["Health"], include_in_schema=False)
    @app.get(f"{settings.api_prefix}/health", response_model=HealthOut, tags=["Health"], summary="Versioned health check")
    @app.get(f"{settings.api_prefix}/healthz", response_model=HealthOut, tags=["Health"], include_in_schema=False)
    async def health() -> JSONResponse:
        start = time.perf_counter()
        db_connected = False
        detail: str | None = None
        try:
            session_factory = get_session_factory()
            async with session_factory() as session:
                await session.execute(text("SELECT 1"))
            db_connected = True
        except (SQLAlchemyError, OSError) as exc:
            detail = f"Database connectivity check failed: {exc.__class__.__name__}"

        latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
        payload = HealthOut(
            status="ok" if db_connected else "degraded",
            service="descript-api",
            version=settings.app_version,
            environment=settings.environment,
            database="postgres" if settings.is_postgres else "sqlite",
            databaseConnected=db_connected,
            latencyMs=latency_ms,
            timestamp=datetime.now(UTC),
            detail=detail,
        )
        status_code = 200 if db_connected else 503
        return JSONResponse(status_code=status_code, content=payload.model_dump(mode="json"))

    app.include_router(auth.router, prefix=settings.api_prefix)
    app.include_router(networks.router, prefix=settings.api_prefix)
    app.include_router(agents.router, prefix=settings.api_prefix)
    app.include_router(verify.router, prefix=settings.api_prefix)
    app.include_router(api_keys.router, prefix=settings.api_prefix)
    app.include_router(platform_auth.router, prefix=settings.api_prefix)
    app.include_router(netprints.router, prefix=settings.api_prefix)
    app.include_router(messages.router, prefix=settings.api_prefix)

    return app


app = create_app()
