from __future__ import annotations

import hashlib
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(raw_url: str) -> str:
    """Normalize PostgreSQL/Neon connection URLs for SQLAlchemy + psycopg."""
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://") and "+psycopg" not in url and "+asyncpg" not in url:
        url = "postgresql+psycopg://" + url[len("postgresql://") :]

    # Ensure sslmode=require for Neon hosts when not already present
    parsed = urlsplit(url)
    if "neon.tech" in (parsed.hostname or "") and parsed.scheme.startswith("postgresql"):
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        if "sslmode" not in query:
            query["sslmode"] = "require"
        url = urlunsplit(
            (parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment)
        )
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.local", "../.env.local", ".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Descript Identity Platform API"
    app_version: str = "0.1.0"
    environment: str = Field(default="development")
    api_prefix: str = "/api/v1"

    # Neon PostgreSQL connection string (pooled by default for app runtime)
    database_url: str = Field(
        default="sqlite+aiosqlite:///./descript_dev.db",
        alias="DATABASE_URL",
    )
    # Direct unpooled connection string for DDL / migrations
    database_url_unpooled: str | None = Field(
        default=None,
        alias="DATABASE_URL_UNPOOLED",
    )

    # Neon Auth & branch metadata
    neon_auth_base_url: str | None = Field(default=None, alias="NEON_AUTH_BASE_URL")
    neon_auth_jwks_url: str | None = Field(default=None, alias="NEON_AUTH_JWKS_URL")
    neon_branch: str | None = Field(default=None, alias="NEON_BRANCH")
    neon_branch_id: str | None = Field(default=None, alias="NEON_BRANCH_ID")

    jwt_secret: str = Field(
        default="dev-descript-jwt-secret-change-in-production-32bytes",
        alias="JWT_SECRET",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # Optional hex/base64 32-byte Ed25519 seed or PKCS8 PEM for signing Bytecripts.
    # If not provided, deterministically derived from jwt_secret in dev so signatures stay stable.
    issuer_private_key: str | None = Field(default=None, alias="DESCRIPT_ISSUER_PRIVATE_KEY")

    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://localhost:3000",
        alias="CORS_ORIGINS",
    )

    @property
    def normalized_database_url(self) -> str:
        return normalize_database_url(self.database_url)

    @property
    def normalized_database_url_unpooled(self) -> str:
        if self.database_url_unpooled:
            return normalize_database_url(self.database_url_unpooled)
        return self.normalized_database_url

    @property
    def is_postgres(self) -> bool:
        return self.normalized_database_url.startswith("postgresql")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def resolved_issuer_seed(self) -> bytes:
        if self.issuer_private_key:
            raw = self.issuer_private_key.strip()
            # Support 64-char hex seed
            if len(raw) == 64:
                try:
                    return bytes.fromhex(raw)
                except ValueError:
                    pass
        # Deterministic 32-byte dev seed from JWT secret
        return hashlib.sha256(f"descript-issuer:{self.jwt_secret}".encode()).digest()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def reset_settings_cache() -> None:
    get_settings.cache_clear()
