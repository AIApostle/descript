from __future__ import annotations

import re
import time
from typing import Generator, AsyncGenerator

import httpx

from .crypto import KeyPair
from .security import format_challenge_payload


def _parse_www_authenticate(header_val: str) -> dict[str, str]:
    """Parse key="value" and key=value pairs out of WWW-Authenticate: Descript ..."""
    params: dict[str, str] = {}
    pattern = re.compile(r'([a-zA-Z_]+)=(?:"([^"]*)"|([^,\s]+))')
    for match in pattern.finditer(header_val):
        key = match.group(1)
        val = match.group(2) if match.group(2) is not None else match.group(3)
        params[key] = val
    return params


class DescriptAgentAuth(httpx.Auth):
    """
    HTTPX authentication handler for AI Agents.

    Automatically handles HTTP 401 Descript challenges:
    1. Intercepts 401 Unauthorized containing `WWW-Authenticate: Descript ...`
    2. Parses realm (platform domain), challenge nonce, and parameters
    3. Signs the canonical request with the Agent's Ed25519 KeyPair
    4. Automatically replays the request with `X-Descript-Agent-Id`, `X-Descript-Signature`,
       and `X-Descript-Timestamp` headers.
    """

    requires_request_body = True
    requires_response_body = True

    def __init__(
        self,
        agent_id: str,
        keypair: KeyPair,
        *,
        default_challenge: str | None = None,
        default_platform_domain: str | None = None,
    ) -> None:
        self.agent_id = agent_id
        self.keypair = keypair
        self.default_challenge = default_challenge
        self.default_platform_domain = default_platform_domain

    def _build_auth_headers(
        self,
        request: httpx.Request,
        challenge: str,
        platform_domain: str,
    ) -> dict[str, str]:
        now = int(time.time())
        canonical_msg = format_challenge_payload(
            challenge=challenge,
            domain=platform_domain,
            method=request.method,
            path=request.url.path,
            timestamp=now,
        )
        sig = self.keypair.sign(canonical_msg)
        return {
            "X-Descript-Agent-Id": self.agent_id,
            "X-Descript-Signature": sig,
            "X-Descript-Timestamp": str(now),
            "X-Descript-Challenge": challenge,
        }

    def sync_auth_flow(
        self, request: httpx.Request
    ) -> Generator[httpx.Request, httpx.Response, None]:
        # Pre-emptively sign if default challenge provided
        if self.default_challenge and self.default_platform_domain:
            headers = self._build_auth_headers(
                request, self.default_challenge, self.default_platform_domain
            )
            for k, v in headers.items():
                request.headers[k] = v

        response = yield request

        # If challenged with 401 Descript, sign and replay once
        if response.status_code == 401:
            www_auth = response.headers.get("www-authenticate", "")
            if "Descript" in www_auth:
                params = _parse_www_authenticate(www_auth)
                challenge = params.get("challenge")
                domain = params.get("realm") or request.url.host

                if challenge:
                    auth_headers = self._build_auth_headers(request, challenge, domain)
                    for k, v in auth_headers.items():
                        request.headers[k] = v
                    yield request

    async def async_auth_flow(
        self, request: httpx.Request
    ) -> AsyncGenerator[httpx.Request, httpx.Response]:
        if self.default_challenge and self.default_platform_domain:
            headers = self._build_auth_headers(
                request, self.default_challenge, self.default_platform_domain
            )
            for k, v in headers.items():
                request.headers[k] = v

        response = yield request

        if response.status_code == 401:
            www_auth = response.headers.get("www-authenticate", "")
            if "Descript" in www_auth:
                params = _parse_www_authenticate(www_auth)
                challenge = params.get("challenge")
                domain = params.get("realm") or request.url.host

                if challenge:
                    auth_headers = self._build_auth_headers(request, challenge, domain)
                    for k, v in auth_headers.items():
                        request.headers[k] = v
                    yield request
