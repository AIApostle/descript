from __future__ import annotations

from typing import Any


class DescriptError(Exception):
    """Base exception for all Descript SDK errors."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}


class AuthenticationError(DescriptError):
    """Raised when JWT or API key authentication fails (401/403)."""


class NotFoundError(DescriptError):
    """Raised when a requested agent, network, or credential does not exist (404)."""


class ConflictError(DescriptError):
    """Raised on duplicate agent names or conflicting resources (409)."""


class ValidationError(DescriptError):
    """Raised when request validation fails (400/422)."""


class CryptographicError(DescriptError):
    """Raised when key parsing, signing, or verification fails locally."""
