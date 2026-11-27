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

    # Security Headers Middleware
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    # Strict CORS Middleware: explicitly authorize Render production domain,
    # Vercel deployment domain, and local development hosts only.
    allowed_origins = {
        "https://descript-ffch.onrender.com",
        "https://trydescript.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        *settings.cors_origin_list,
    }
    # Clean up empty strings or accidental wildcards for strict security
    sanitized_origins = [o for o in allowed_origins if o and o != "*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=sanitized_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "Accept",
            "X-Descript-Agent-Id",
            "X-Descript-Signature",
            "X-Descript-Timestamp",
            "X-Descript-Challenge",
        ],
        expose_headers=[
            "WWW-Authenticate",
            "X-Descript-Challenge",
        ],
        max_age=600,
    )

    @app.get("/", tags=["Root"], include_in_schema=False)
    @app.head("/", tags=["Root"], include_in_schema=False)
    async def root():
        return {
            "service": "descript-api",
            "status": "online",
            "docs": "/docs",
            "health": "/health",
        }

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
    app.include_router(auth.router)  # Fallback for unversioned /auth/signup & /auth/login
    app.include_router(networks.router, prefix=settings.api_prefix)
    app.include_router(agents.router, prefix=settings.api_prefix)
    app.include_router(verify.router, prefix=settings.api_prefix)
    app.include_router(api_keys.router, prefix=settings.api_prefix)
    app.include_router(platform_auth.router, prefix=settings.api_prefix)
    app.include_router(netprints.router, prefix=settings.api_prefix)
    app.include_router(messages.router, prefix=settings.api_prefix)

    return app


app = create_app()
