from __future__ import annotations

import base64
import json
import secrets
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Callable

import httpx

from .crypto import KeyPair, verify_signature
from .exceptions import AuthenticationError, DescriptError, ValidationError
from .models import AuthenticatedAgent, VerificationResult


@dataclass
class AgentClaims:
    """Verified identity claims for an agent accessing a platform or peer."""

    id: str
    name: str | None = None
    byte_network: str | None = None
    residence: str | None = None
    status: str = "active"
    scopes: list[str] = field(default_factory=list)
    controller_org: str | None = None
    fingerprint: str | None = None
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class ChallengeDetails:
    challenge: str
    platform_domain: str
    required_scopes: list[str]
    byte_network: str | None
    issued_at: int
    expires_at: int

    def to_header(self) -> str:
        """Format as WWW-Authenticate header challenge parameters."""
        scopes_str = " ".join(self.required_scopes)
        net_part = f', network="{self.byte_network}"' if self.byte_network else ""
        return (
            f'Descript realm="{self.platform_domain}", '
            f'challenge="{self.challenge}", '
            f'scopes="{scopes_str}", '
            f'issued_at={self.issued_at}, '
            f'expires_at={self.expires_at}{net_part}'
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "challenge": self.challenge,
            "platformDomain": self.platform_domain,
            "requiredScopes": self.required_scopes,
            "byteNetwork": self.byte_network,
            "issuedAt": self.issued_at,
            "expiresAt": self.expires_at,
        }


def format_challenge_payload(
    challenge: str,
    domain: str,
    method: str = "POST",
    path: str = "/",
    timestamp: int | None = None,
) -> str:
    """Canonical string representation that the agent must sign with Ed25519."""
    ts = timestamp if timestamp is not None else int(time.time())
    return f"descript-auth-v1:{domain}:{method.upper()}:{path}:{challenge}:{ts}"


class DescriptSecurity:
    """
    Platform security guard that protects API endpoints and handles programmatic
    agent identity verification, challenge generation, and scope enforcement.
    """

    def __init__(
        self,
        *,
        platform_domain: str = "api.platform.internal",
        network: str | None = None,
        descript_base_url: str = "https://descript-ffch.onrender.com",
        challenge_ttl_seconds: int = 120,
        verify_online: bool = True,
        http_client: httpx.Client | None = None,
        async_http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.platform_domain = platform_domain
        self.network = network
        self.descript_base_url = descript_base_url.rstrip("/")
        self.challenge_ttl_seconds = challenge_ttl_seconds
        self.verify_online = verify_online
        self._http = http_client or httpx.Client(timeout=10.0)
        self._async_http = async_http_client

    def create_challenge(
        self,
        *,
        required_scopes: list[str] | None = None,
        custom_domain: str | None = None,
    ) -> ChallengeDetails:
        """Create a fresh cryptographically random challenge for an incoming agent."""
        now = int(time.time())
        token = secrets.token_urlsafe(32)
        return ChallengeDetails(
            challenge=token,
            platform_domain=custom_domain or self.platform_domain,
            required_scopes=required_scopes or [],
            byte_network=self.network,
            issued_at=now,
            expires_at=now + self.challenge_ttl_seconds,
        )

    def verify_agent_request(
        self,
        headers: dict[str, str],
        *,
        expected_challenge: str,
        method: str = "POST",
        path: str = "/",
        required_scopes: list[str] | None = None,
    ) -> AgentClaims:
        """
        Synchronously verify an incoming agent request from its headers:
          - X-Descript-Agent-Id
          - X-Descript-Signature
          - X-Descript-Timestamp
          - (Optional) Authorization: Bearer <dat_token>
        """
        agent_id = headers.get("X-Descript-Agent-Id") or headers.get("x-descript-agent-id")
        signature = headers.get("X-Descript-Signature") or headers.get("x-descript-signature")
        ts_str = headers.get("X-Descript-Timestamp") or headers.get("x-descript-timestamp")
        auth_bearer = headers.get("Authorization") or headers.get("authorization")

        # 1. Bearer Token path (if platform already exchanged OTP code for dat_ token)
        if auth_bearer and auth_bearer.startswith("Bearer dat_"):
            token = auth_bearer.split(" ", 1)[1]
            return self._verify_bearer_token_sync(token, required_scopes=required_scopes)

        if not agent_id or not signature or not ts_str:
            challenge = self.create_challenge(required_scopes=required_scopes)
            raise AuthenticationError(
                "Missing Descript authentication headers. See challenge details.",
                code="DESCRIPT_CHALLENGE_REQUIRED",
                details={
                    "wwwAuthenticate": challenge.to_header(),
                    "challenge": challenge.to_dict(),
                },
            )

        # 2. Check timestamp expiry
        try:
            ts = int(ts_str)
        except ValueError:
            raise AuthenticationError("Invalid timestamp in X-Descript-Timestamp header")

        now = int(time.time())
        if abs(now - ts) > self.challenge_ttl_seconds:
            raise AuthenticationError("Descript challenge signature has expired or timestamp skewed")

        # Canonical message
        canonical_msg = format_challenge_payload(
            challenge=expected_challenge,
            domain=self.platform_domain,
            method=method,
            path=path,
            timestamp=ts,
        )

        # 3. Verify against Descript API
        return self._verify_with_descript_sync(
            agent_id=agent_id,
            canonical_message=canonical_msg,
            signature=signature,
            required_scopes=required_scopes,
        )

    async def verify_agent_request_async(
        self,
        headers: dict[str, str],
        *,
        expected_challenge: str,
        method: str = "POST",
        path: str = "/",
        required_scopes: list[str] | None = None,
    ) -> AgentClaims:
        """Asynchronous version of verify_agent_request."""
        agent_id = headers.get("X-Descript-Agent-Id") or headers.get("x-descript-agent-id")
        signature = headers.get("X-Descript-Signature") or headers.get("x-descript-signature")
        ts_str = headers.get("X-Descript-Timestamp") or headers.get("x-descript-timestamp")
        auth_bearer = headers.get("Authorization") or headers.get("authorization")

        if auth_bearer and auth_bearer.startswith("Bearer dat_"):
            token = auth_bearer.split(" ", 1)[1]
            return await self._verify_bearer_token_async(token, required_scopes=required_scopes)

        if not agent_id or not signature or not ts_str:
            challenge = self.create_challenge(required_scopes=required_scopes)
            raise AuthenticationError(
                "Missing Descript authentication headers. See challenge details.",
                code="DESCRIPT_CHALLENGE_REQUIRED",
                details={
                    "wwwAuthenticate": challenge.to_header(),
                    "challenge": challenge.to_dict(),
                },
            )

        try:
            ts = int(ts_str)
        except ValueError:
            raise AuthenticationError("Invalid timestamp in X-Descript-Timestamp header")

        now = int(time.time())
        if abs(now - ts) > self.challenge_ttl_seconds:
            raise AuthenticationError("Descript challenge signature has expired or timestamp skewed")

        canonical_msg = format_challenge_payload(
            challenge=expected_challenge,
            domain=self.platform_domain,
            method=method,
            path=path,
            timestamp=ts,
        )

        return await self._verify_with_descript_async(
            agent_id=agent_id,
            canonical_message=canonical_msg,
            signature=signature,
            required_scopes=required_scopes,
        )

    def _verify_with_descript_sync(
        self,
        agent_id: str,
        canonical_message: str,
        signature: str,
        required_scopes: list[str] | None,
    ) -> AgentClaims:
        res = self._http.post(
            f"{self.descript_base_url}/api/v1/verify",
            json={
                "agentId": agent_id,
                "message": canonical_message,
                "signature": signature,
            },
        )
        if not res.is_success:
            raise AuthenticationError(f"Descript verification call failed: {res.text}")

        data = res.json()
        if not data.get("verified"):
            raise AuthenticationError(
                f"Agent cryptographic signature verification failed: {data.get('details', {}).get('reason', 'invalid')}"
            )

        # Inspect network
        agent_net = data.get("byteNetwork")
        if self.network and agent_net and agent_net != self.network:
            raise AuthenticationError(
                f"Agent network mismatch: required '{self.network}', found '{agent_net}'"
            )

        return AgentClaims(
            id=agent_id,
            name=data.get("agentName"),
            byte_network=agent_net,
            status="active",
            scopes=required_scopes or [],
            fingerprint=data.get("fingerprint"),
            extra=data,
        )

    async def _verify_with_descript_async(
        self,
        agent_id: str,
        canonical_message: str,
        signature: str,
        required_scopes: list[str] | None,
    ) -> AgentClaims:
        client = self._async_http or httpx.AsyncClient(timeout=10.0)
        close_client = self._async_http is None
        try:
            res = await client.post(
                f"{self.descript_base_url}/api/v1/verify",
                json={
                    "agentId": agent_id,
                    "message": canonical_message,
                    "signature": signature,
                },
            )
            if not res.is_success:
                raise AuthenticationError(f"Descript verification call failed: {res.text}")

            data = res.json()
            if not data.get("verified"):
                raise AuthenticationError(
                    f"Agent cryptographic signature verification failed: {data.get('details', {}).get('reason', 'invalid')}"
                )

            agent_net = data.get("byteNetwork")
            if self.network and agent_net and agent_net != self.network:
                raise AuthenticationError(
                    f"Agent network mismatch: required '{self.network}', found '{agent_net}'"
                )

            return AgentClaims(
                id=agent_id,
                name=data.get("agentName"),
                byte_network=agent_net,
                status="active",
                scopes=required_scopes or [],
                fingerprint=data.get("fingerprint"),
                extra=data,
            )
        finally:
            if close_client:
                await client.aclose()

    def _verify_bearer_token_sync(
        self,
        token: str,
        required_scopes: list[str] | None,
    ) -> AgentClaims:
        res = self._http.post(
            f"{self.descript_base_url}/api/v1/auth/platform/token/verify",
            params={"token": token},
        )
        if not res.is_success:
            raise AuthenticationError(f"Invalid Descript Agent Token: {res.text}")

        data = res.json()
        agent_data = data.get("agent", {})
        granted_scopes = set(data.get("scopes", []))
        if required_scopes:
            for scope in required_scopes:
                if scope not in granted_scopes:
                    raise AuthenticationError(f"Missing required scope: '{scope}'")

        return AgentClaims(
            id=agent_data.get("id"),
            name=agent_data.get("name"),
            byte_network=agent_data.get("byteNetwork"),
            status=agent_data.get("status", "active"),
            scopes=list(granted_scopes),
            controller_org=agent_data.get("controller"),
            extra=data,
        )

    async def _verify_bearer_token_async(
        self,
        token: str,
        required_scopes: list[str] | None,
    ) -> AgentClaims:
        client = self._async_http or httpx.AsyncClient(timeout=10.0)
        close_client = self._async_http is None
        try:
            res = await client.post(
                f"{self.descript_base_url}/api/v1/auth/platform/token/verify",
                params={"token": token},
            )
            if not res.is_success:
                raise AuthenticationError(f"Invalid Descript Agent Token: {res.text}")

            data = res.json()
            agent_data = data.get("agent", {})
            granted_scopes = set(data.get("scopes", []))
            if required_scopes:
                for scope in required_scopes:
                    if scope not in granted_scopes:
                        raise AuthenticationError(f"Missing required scope: '{scope}'")

            return AgentClaims(
                id=agent_data.get("id"),
                name=agent_data.get("name"),
                byte_network=agent_data.get("byteNetwork"),
                status=agent_data.get("status", "active"),
                scopes=list(granted_scopes),
                controller_org=agent_data.get("controller"),
                extra=data,
            )
        finally:
            if close_client:
                await client.aclose()
