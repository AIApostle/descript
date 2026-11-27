from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, AsyncIterator, Iterator, Self

import httpx

from .crypto import KeyPair
from .exceptions import (
    AuthenticationError,
    ConflictError,
    DescriptError,
    NotFoundError,
    ValidationError,
)
from .models import (
    Agent,
    AgentClaimResult,
    AgentStatus,
    ApiKey,
    AuditEvent,
    AuthSession,
    AuthenticatedAgent,
    Bytecript,
    BytecriptVerifyResult,
    ByteNetwork,
    Challenge,
    Credential,
    HealthStatus,
    IssuerInfo,
    PlatformCodeSession,
    PlatformPendingSession,
    PlatformTokenExchange,
    User,
    VerificationResult,
)


def _raise_for_error(response: httpx.Response) -> None:
    if response.is_success:
        return
    status_code = response.status_code
    code: str | None = None
    message = response.reason_phrase or f"HTTP {status_code}"
    details: dict[str, Any] = {}

    try:
        body = response.json()
        detail = body.get("detail", body)
        if isinstance(detail, dict):
            code = detail.get("error") or detail.get("code")
            message = detail.get("message") or message
            details = detail.get("details") or {}
        elif isinstance(detail, str):
            message = detail
        elif isinstance(detail, list):
            message = "; ".join(str(item.get("msg", item)) for item in detail)
            details = {"errors": detail}
    except (ValueError, KeyError, TypeError):
        if response.text:
            message = response.text

    if status_code in (401, 403):
        raise AuthenticationError(message, status_code=status_code, code=code, details=details)
    if status_code == 404:
        raise NotFoundError(message, status_code=status_code, code=code, details=details)
    if status_code == 409:
        raise ConflictError(message, status_code=status_code, code=code, details=details)
    if status_code in (400, 422):
        raise ValidationError(message, status_code=status_code, code=code, details=details)
    raise DescriptError(message, status_code=status_code, code=code, details=details)


class _BaseClient:
    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        *,
        api_key: str | None = None,
        token: str | None = None,
        api_prefix: str = "/api/v1",
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_prefix = "/" + api_prefix.strip("/")
        self._api_key = api_key
        self._token = token

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        elif self._api_key:
            headers["X-API-Key"] = self._api_key
        return headers

    def _url(self, path: str) -> str:
        cleaned = path if path.startswith("/") else f"/{path}"
        return f"{self.api_prefix}{cleaned}"

    def set_token(self, token: str | None) -> None:
        self._token = token

    def set_api_key(self, api_key: str | None) -> None:
        self._api_key = api_key


# ---------------------------------------------------------------------------
# Synchronous Resources & Client
# ---------------------------------------------------------------------------


class _SyncAuthResource:
    def __init__(self, client: DescriptClient) -> None:
        self._c = client

    def signup(
        self,
        email: str,
        password: str,
        *,
        name: str | None = None,
        organization: str | None = None,
    ) -> AuthSession:
        data = self._c._request(
            "POST",
            "/auth/signup",
            json={"email": email, "password": password, "name": name, "organization": organization},
        )
        session = AuthSession.model_validate(data)
        self._c.set_token(session.token)
        return session

    def login(self, email: str, password: str) -> AuthSession:
        data = self._c._request("POST", "/auth/login", json={"email": email, "password": password})
        session = AuthSession.model_validate(data)
        self._c.set_token(session.token)
        return session

    def me(self) -> User:
        return User.model_validate(self._c._request("GET", "/auth/me"))


class _SyncNetworksResource:
    def __init__(self, client: DescriptClient) -> None:
        self._c = client

    def list(self) -> list[ByteNetwork]:
        rows = self._c._request("GET", "/networks")
        return [ByteNetwork.model_validate(row) for row in rows]

    def get(self, slug: str) -> ByteNetwork:
        return ByteNetwork.model_validate(self._c._request("GET", f"/networks/{slug}"))


class _SyncAgentsResource:
    def __init__(self, client: DescriptClient) -> None:
        self._c = client

    def list(
        self,
        *,
        status: AgentStatus | None = None,
        byte_network: str | None = None,
        search: str | None = None,
    ) -> list[Agent]:
        params = {
            k: v
            for k, v in {"status": status, "byteNetwork": byte_network, "search": search}.items()
            if v is not None
        }
        rows = self._c._request("GET", "/agents", params=params)
        return [Agent.model_validate(row) for row in rows]

    def get(self, agent_id: str) -> Agent:
        return Agent.model_validate(self._c._request("GET", f"/agents/{agent_id}"))

    def get_public(self, agent_id: str) -> Agent:
        return Agent.model_validate(self._c._request("GET", f"/public/agents/{agent_id}"))

    def create(
        self,
        *,
        name: str,
        public_key: str,
        byte_network: str = "kiroween",
        description: str | None = None,
        agent_type: str | None = None,
        framework: str | None = None,
        capabilities: list[str] | None = None,
        public_metadata: dict[str, Any] | None = None,
        credential_label: str | None = "Primary Key",
    ) -> Agent:
        payload = {
            "name": name,
            "description": description,
            "byteNetwork": byte_network,
            "publicKey": public_key,
            "algorithm": "ed25519",
            "agentType": agent_type,
            "framework": framework,
            "capabilities": capabilities or [],
            "publicMetadata": public_metadata or {},
            "credentialLabel": credential_label,
        }
        return Agent.model_validate(self._c._request("POST", "/agents", json=payload))

    def create_with_generated_key(
        self,
        *,
        name: str,
        byte_network: str = "kiroween",
        description: str | None = None,
        agent_type: str | None = None,
        framework: str | None = None,
        capabilities: list[str] | None = None,
        public_metadata: dict[str, Any] | None = None,
    ) -> tuple[Agent, KeyPair]:
        keypair = KeyPair.generate()
        agent = self.create(
            name=name,
            public_key=keypair.public_key_b64,
            byte_network=byte_network,
            description=description,
            agent_type=agent_type,
            framework=framework,
            capabilities=capabilities,
            public_metadata=public_metadata,
        )
        return agent, keypair

    def update(
        self,
        agent_id: str,
        *,
        name: str | None = None,
        description: str | None = None,
        agent_type: str | None = None,
        framework: str | None = None,
        capabilities: list[str] | None = None,
        public_metadata: dict[str, Any] | None = None,
    ) -> Agent:
        payload = {
            k: v
            for k, v in {
                "name": name,
                "description": description,
                "agentType": agent_type,
                "framework": framework,
                "capabilities": capabilities,
                "publicMetadata": public_metadata,
            }.items()
            if v is not None
        }
        return Agent.model_validate(self._c._request("PATCH", f"/agents/{agent_id}", json=payload))

    def set_status(self, agent_id: str, status: AgentStatus, *, reason: str | None = None) -> Agent:
        return Agent.model_validate(
            self._c._request("PATCH", f"/agents/{agent_id}/status", json={"status": status, "reason": reason})
        )

    def suspend(self, agent_id: str, *, reason: str | None = None) -> Agent:
        return self.set_status(agent_id, "suspended", reason=reason)

    def reactivate(self, agent_id: str, *, reason: str | None = None) -> Agent:
        return self.set_status(agent_id, "active", reason=reason)

    def revoke(self, agent_id: str, *, reason: str | None = None) -> Agent:
        return self.set_status(agent_id, "revoked", reason=reason)

    def delete(self, agent_id: str) -> None:
        self._c._request("DELETE", f"/agents/{agent_id}")

    def get_bytecript(self, agent_id: str) -> Bytecript:
        return Bytecript.model_validate(self._c._request("GET", f"/agents/{agent_id}/bytecript"))

    def get_audit(self, agent_id: str) -> list[AuditEvent]:
        rows = self._c._request("GET", f"/agents/{agent_id}/audit")
        return [AuditEvent.model_validate(row) for row in rows]


class _SyncCredentialsResource:
    def __init__(self, client: DescriptClient) -> None:
        self._c = client

    def list(self, agent_id: str) -> list[Credential]:
        rows = self._c._request("GET", f"/agents/{agent_id}/credentials")
        return [Credential.model_validate(row) for row in rows]

    def add(
        self,
        agent_id: str,
        *,
        public_key: str,
        label: str | None = None,
        deactivate_existing: bool = False,
    ) -> Credential:
        data = self._c._request(
            "POST",
            f"/agents/{agent_id}/credentials",
            json={
                "publicKey": public_key,
                "algorithm": "ed25519",
                "label": label,
                "deactivateExisting": deactivate_existing,
            },
        )
        return Credential.model_validate(data)

    def rotate(self, agent_id: str, *, new_public_key: str, label: str | None = "Rotated Key") -> Credential:
        return self.add(agent_id, public_key=new_public_key, label=label, deactivate_existing=True)

    def rotate_with_generated_key(
        self, agent_id: str, *, label: str | None = "Rotated Key"
    ) -> tuple[Credential, KeyPair]:
        kp = KeyPair.generate()
        cred = self.rotate(agent_id, new_public_key=kp.public_key_b64, label=label)
        return cred, kp

    def set_status(self, agent_id: str, credential_id: str, status: str) -> Credential:
        data = self._c._request(
            "PATCH",
            f"/agents/{agent_id}/credentials/{credential_id}",
            json={"status": status},
        )
        return Credential.model_validate(data)

    def revoke(self, agent_id: str, credential_id: str, *, reason: str | None = None) -> Credential:
        data = self._c._request(
            "POST",
            f"/agents/{agent_id}/credentials/{credential_id}/revoke",
            json={"reason": reason},
        )
        return Credential.model_validate(data)


class _SyncVerifyResource:
    def __init__(self, client: DescriptClient) -> None:
        self._c = client

    def get_issuer(self) -> IssuerInfo:
        return IssuerInfo.model_validate(self._c._request("GET", "/issuer"))

    def create_challenge(self, agent_id: str, *, audience: str | None = "external-service") -> Challenge:
        data = self._c._request("POST", "/challenges", json={"agentId": agent_id, "audience": audience})
        return Challenge.model_validate(data)

    def verify_challenge(
        self,
        *,
        agent_id: str,
        signature: str,
        challenge_id: str | None = None,
        nonce: str | None = None,
    ) -> VerificationResult:
        data = self._c._request(
            "POST",
            "/challenges/verify",
            json={
                "agentId": agent_id,
                "challengeId": challenge_id,
                "nonce": nonce,
                "signature": signature,
            },
        )
        return VerificationResult.model_validate(data)

    def authenticate_with_keypair(
        self,
        agent_id: str,
        keypair: KeyPair,
        *,
        audience: str | None = "external-service",
    ) -> VerificationResult:
        challenge = self.create_challenge(agent_id, audience=audience)
        signature = keypair.sign(challenge.nonce)
        return self.verify_challenge(agent_id=agent_id, challenge_id=challenge.challengeId, signature=signature)

    def verify_message(self, agent_id: str, *, message: str, signature: str) -> VerificationResult:
        data = self._c._request(
            "POST",
            "/verify",
            json={"agentId": agent_id, "message": message, "signature": signature},
        )
        return VerificationResult.model_validate(data)

    def verify_bytecript(
        self, bytecript: Bytecript | dict[str, Any], *, check_live_status: bool = True
    ) -> BytecriptVerifyResult:
        doc = bytecript.model_dump(mode="json") if isinstance(bytecript, Bytecript) else bytecript
        data = self._c._request(
            "POST",
            "/verify/bytecript",
            json={"bytecript": doc, "checkLiveStatus": check_live_status},
        )
        return BytecriptVerifyResult.model_validate(data)


class _SyncApiKeysResource:
    def __init__(self, client: DescriptClient) -> None:
        self._c = client

    def list(self) -> list[ApiKey]:
        rows = self._c._request("GET", "/api-keys")
        return [ApiKey.model_validate(row) for row in rows]

    def create(self, name: str, *, scopes: list[str] | None = None) -> ApiKey:
        payload: dict[str, Any] = {"name": name}
        if scopes is not None:
            payload["scopes"] = scopes
        return ApiKey.model_validate(self._c._request("POST", "/api-keys", json=payload))

    def revoke(self, key_id: str) -> None:
        self._c._request("DELETE", f"/api-keys/{key_id}")


class _SyncPlatformAuthResource:
    def __init__(self, client: DescriptClient) -> None:
        self._c = client

    def request_code(
        self,
        platform_name: str,
        platform_domain: str,
        *,
        scopes: list[str] | None = None,
        agent_id: str | None = None,
        expires_in_seconds: int = 900,
    ) -> PlatformCodeSession:
        """Called by third-party platforms to issue an OTP verification code for an agent."""
        data = self._c._request(
            "POST",
            "/auth/platform/code/request",
            json={
                "platformName": platform_name,
                "platformDomain": platform_domain,
                "requestedScopes": scopes or [],
                "agentId": agent_id,
                "expiresInSeconds": expires_in_seconds,
            },
        )
        return PlatformCodeSession.model_validate(data)

    def get_code_info(self, user_code: str) -> dict[str, Any]:
        """Inspect a verification code."""
        return self._c._request("GET", f"/auth/platform/code/{user_code}")

    def claim_code(
        self,
        user_code: str,
        agent_id: str,
        keypair: KeyPair,
    ) -> AgentClaimResult:
        """Called by an agent (or controller) to sign and claim an OTP verification code."""
        sig = keypair.sign(user_code)
        data = self._c._request(
            "POST",
            "/auth/platform/code/claim",
            json={
                "userCode": user_code,
                "agentId": agent_id,
                "signature": sig,
            },
        )
        return AgentClaimResult.model_validate(data)

    def exchange_code(
        self,
        auth_session_id: str,
        user_code: str,
    ) -> PlatformTokenExchange:
        """Called by third-party platforms to exchange claimed code for the verified agent token."""
        data = self._c._request(
            "POST",
            "/auth/platform/code/exchange",
            json={
                "authSessionId": auth_session_id,
                "userCode": user_code,
            },
        )
        return PlatformTokenExchange.model_validate(data)

    def list_pending(
        self,
        *,
        agent_id: str | None = None,
        byte_network: str | None = None,
    ) -> list[PlatformPendingSession]:
        """List active pending authentication requests for this agent or network."""
        params: dict[str, str] = {}
        if agent_id:
            params["agent_id"] = agent_id
        if byte_network:
            params["byte_network"] = byte_network
        data = self._c._request("GET", "/auth/platform/pending", params=params)
        return [PlatformPendingSession.model_validate(item) for item in data]

    def verify_token(self, token: str) -> dict[str, Any]:
        """Called by third-party platforms to verify an incoming Descript Agent Token."""
        return self._c._request("POST", "/auth/platform/token/verify", params={"token": token})


class DescriptClient(_BaseClient):
    """Synchronous client for the Descript AI Agent Identity Platform."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        *,
        api_key: str | None = None,
        token: str | None = None,
        api_prefix: str = "/api/v1",
        timeout: float = 15.0,
        http_client: httpx.Client | None = None,
    ) -> None:
        super().__init__(base_url, api_key=api_key, token=token, api_prefix=api_prefix)
        self._owns_http = http_client is None
        self._http = http_client or httpx.Client(base_url=self.base_url, timeout=timeout)
        self.auth = _SyncAuthResource(self)
        self.networks = _SyncNetworksResource(self)
        self.agents = _SyncAgentsResource(self)
        self.credentials = _SyncCredentialsResource(self)
        self.verify = _SyncVerifyResource(self)
        self.api_keys = _SyncApiKeysResource(self)
        self.platform_auth = _SyncPlatformAuthResource(self)

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        headers = self._headers()
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))
        response = self._http.request(method, self._url(path), headers=headers, **kwargs)
        _raise_for_error(response)
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    def health(self) -> HealthStatus:
        """Check Descript API and database connectivity."""
        return HealthStatus.model_validate(self._request("GET", "/health"))

    def close(self) -> None:
        if self._owns_http:
            self._http.close()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_args: object) -> None:
        self.close()


# ---------------------------------------------------------------------------
# Asynchronous Resources & Client
# ---------------------------------------------------------------------------


class _AsyncAuthResource:
    def __init__(self, client: AsyncDescriptClient) -> None:
        self._c = client

    async def signup(
        self,
        email: str,
        password: str,
        *,
        name: str | None = None,
        organization: str | None = None,
    ) -> AuthSession:
        data = await self._c._request(
            "POST",
            "/auth/signup",
            json={"email": email, "password": password, "name": name, "organization": organization},
        )
        session = AuthSession.model_validate(data)
        self._c.set_token(session.token)
        return session

    async def login(self, email: str, password: str) -> AuthSession:
        data = await self._c._request("POST", "/auth/login", json={"email": email, "password": password})
        session = AuthSession.model_validate(data)
        self._c.set_token(session.token)
        return session

    async def me(self) -> User:
        return User.model_validate(await self._c._request("GET", "/auth/me"))


class _AsyncNetworksResource:
    def __init__(self, client: AsyncDescriptClient) -> None:
        self._c = client

    async def list(self) -> list[ByteNetwork]:
        rows = await self._c._request("GET", "/networks")
        return [ByteNetwork.model_validate(row) for row in rows]

    async def get(self, slug: str) -> ByteNetwork:
        return ByteNetwork.model_validate(await self._c._request("GET", f"/networks/{slug}"))


class _AsyncAgentsResource:
    def __init__(self, client: AsyncDescriptClient) -> None:
        self._c = client

    async def list(
        self,
        *,
        status: AgentStatus | None = None,
        byte_network: str | None = None,
        search: str | None = None,
    ) -> list[Agent]:
        params = {
            k: v
            for k, v in {"status": status, "byteNetwork": byte_network, "search": search}.items()
            if v is not None
        }
        rows = await self._c._request("GET", "/agents", params=params)
        return [Agent.model_validate(row) for row in rows]

    async def get(self, agent_id: str) -> Agent:
        return Agent.model_validate(await self._c._request("GET", f"/agents/{agent_id}"))

    async def get_public(self, agent_id: str) -> Agent:
        return Agent.model_validate(await self._c._request("GET", f"/public/agents/{agent_id}"))

    async def create(
        self,
        *,
        name: str,
        public_key: str,
        byte_network: str = "kiroween",
        description: str | None = None,
        agent_type: str | None = None,
        framework: str | None = None,
        capabilities: list[str] | None = None,
        public_metadata: dict[str, Any] | None = None,
        credential_label: str | None = "Primary Key",
    ) -> Agent:
        payload = {
            "name": name,
            "description": description,
            "byteNetwork": byte_network,
            "publicKey": public_key,
            "algorithm": "ed25519",
            "agentType": agent_type,
            "framework": framework,
            "capabilities": capabilities or [],
            "publicMetadata": public_metadata or {},
            "credentialLabel": credential_label,
        }
        return Agent.model_validate(await self._c._request("POST", "/agents", json=payload))

    async def create_with_generated_key(
        self,
        *,
        name: str,
        byte_network: str = "kiroween",
        description: str | None = None,
        agent_type: str | None = None,
        framework: str | None = None,
        capabilities: list[str] | None = None,
        public_metadata: dict[str, Any] | None = None,
    ) -> tuple[Agent, KeyPair]:
        keypair = KeyPair.generate()
        agent = await self.create(
            name=name,
            public_key=keypair.public_key_b64,
            byte_network=byte_network,
            description=description,
            agent_type=agent_type,
            framework=framework,
            capabilities=capabilities,
            public_metadata=public_metadata,
        )
        return agent, keypair

    async def update(
        self,
        agent_id: str,
        *,
        name: str | None = None,
        description: str | None = None,
        agent_type: str | None = None,
        framework: str | None = None,
        capabilities: list[str] | None = None,
        public_metadata: dict[str, Any] | None = None,
    ) -> Agent:
        payload = {
            k: v
            for k, v in {
                "name": name,
                "description": description,
                "agentType": agent_type,
                "framework": framework,
                "capabilities": capabilities,
                "publicMetadata": public_metadata,
            }.items()
            if v is not None
        }
        return Agent.model_validate(await self._c._request("PATCH", f"/agents/{agent_id}", json=payload))

    async def set_status(self, agent_id: str, status: AgentStatus, *, reason: str | None = None) -> Agent:
        return Agent.model_validate(
            await self._c._request(
                "PATCH", f"/agents/{agent_id}/status", json={"status": status, "reason": reason}
            )
        )

    async def suspend(self, agent_id: str, *, reason: str | None = None) -> Agent:
        return await self.set_status(agent_id, "suspended", reason=reason)

    async def reactivate(self, agent_id: str, *, reason: str | None = None) -> Agent:
        return await self.set_status(agent_id, "active", reason=reason)

    async def revoke(self, agent_id: str, *, reason: str | None = None) -> Agent:
        return await self.set_status(agent_id, "revoked", reason=reason)

    async def delete(self, agent_id: str) -> None:
        await self._c._request("DELETE", f"/agents/{agent_id}")

    async def get_bytecript(self, agent_id: str) -> Bytecript:
        return Bytecript.model_validate(await self._c._request("GET", f"/agents/{agent_id}/bytecript"))

    async def get_audit(self, agent_id: str) -> list[AuditEvent]:
        rows = await self._c._request("GET", f"/agents/{agent_id}/audit")
        return [AuditEvent.model_validate(row) for row in rows]


class _AsyncCredentialsResource:
    def __init__(self, client: AsyncDescriptClient) -> None:
        self._c = client

    async def list(self, agent_id: str) -> list[Credential]:
        rows = await self._c._request("GET", f"/agents/{agent_id}/credentials")
        return [Credential.model_validate(row) for row in rows]

    async def add(
        self,
        agent_id: str,
        *,
        public_key: str,
        label: str | None = None,
        deactivate_existing: bool = False,
    ) -> Credential:
        data = await self._c._request(
            "POST",
            f"/agents/{agent_id}/credentials",
            json={
                "publicKey": public_key,
                "algorithm": "ed25519",
                "label": label,
                "deactivateExisting": deactivate_existing,
            },
        )
        return Credential.model_validate(data)

    async def rotate(self, agent_id: str, *, new_public_key: str, label: str | None = "Rotated Key") -> Credential:
        return await self.add(agent_id, public_key=new_public_key, label=label, deactivate_existing=True)

    async def rotate_with_generated_key(
        self, agent_id: str, *, label: str | None = "Rotated Key"
    ) -> tuple[Credential, KeyPair]:
        kp = KeyPair.generate()
        cred = await self.rotate(agent_id, new_public_key=kp.public_key_b64, label=label)
        return cred, kp

    async def set_status(self, agent_id: str, credential_id: str, status: str) -> Credential:
        data = await self._c._request(
            "PATCH",
            f"/agents/{agent_id}/credentials/{credential_id}",
            json={"status": status},
        )
        return Credential.model_validate(data)

    async def revoke(self, agent_id: str, credential_id: str, *, reason: str | None = None) -> Credential:
        data = await self._c._request(
            "POST",
            f"/agents/{agent_id}/credentials/{credential_id}/revoke",
            json={"reason": reason},
        )
        return Credential.model_validate(data)


class _AsyncVerifyResource:
    def __init__(self, client: AsyncDescriptClient) -> None:
        self._c = client

    async def get_issuer(self) -> IssuerInfo:
        return IssuerInfo.model_validate(await self._c._request("GET", "/issuer"))

    async def create_challenge(self, agent_id: str, *, audience: str | None = "external-service") -> Challenge:
        data = await self._c._request("POST", "/challenges", json={"agentId": agent_id, "audience": audience})
        return Challenge.model_validate(data)

    async def verify_challenge(
        self,
        *,
        agent_id: str,
        signature: str,
        challenge_id: str | None = None,
        nonce: str | None = None,
    ) -> VerificationResult:
        data = await self._c._request(
            "POST",
            "/challenges/verify",
            json={
                "agentId": agent_id,
                "challengeId": challenge_id,
                "nonce": nonce,
                "signature": signature,
            },
        )
        return VerificationResult.model_validate(data)

    async def authenticate_with_keypair(
        self,
        agent_id: str,
        keypair: KeyPair,
        *,
        audience: str | None = "external-service",
    ) -> VerificationResult:
        challenge = await self.create_challenge(agent_id, audience=audience)
        signature = keypair.sign(challenge.nonce)
        return await self.verify_challenge(
            agent_id=agent_id, challenge_id=challenge.challengeId, signature=signature
        )

    async def verify_message(self, agent_id: str, *, message: str, signature: str) -> VerificationResult:
        data = await self._c._request(
            "POST",
            "/verify",
            json={"agentId": agent_id, "message": message, "signature": signature},
        )
        return VerificationResult.model_validate(data)

    async def verify_bytecript(
        self, bytecript: Bytecript | dict[str, Any], *, check_live_status: bool = True
    ) -> BytecriptVerifyResult:
        doc = bytecript.model_dump(mode="json") if isinstance(bytecript, Bytecript) else bytecript
        data = await self._c._request(
            "POST",
            "/verify/bytecript",
            json={"bytecript": doc, "checkLiveStatus": check_live_status},
        )
        return BytecriptVerifyResult.model_validate(data)


class _AsyncApiKeysResource:
    def __init__(self, client: AsyncDescriptClient) -> None:
        self._c = client

    async def list(self) -> list[ApiKey]:
        rows = await self._c._request("GET", "/api-keys")
        return [ApiKey.model_validate(row) for row in rows]

    async def create(self, name: str, *, scopes: list[str] | None = None) -> ApiKey:
        payload: dict[str, Any] = {"name": name}
        if scopes is not None:
            payload["scopes"] = scopes
        return ApiKey.model_validate(await self._c._request("POST", "/api-keys", json=payload))

    async def revoke(self, key_id: str) -> None:
        await self._c._request("DELETE", f"/api-keys/{key_id}")


class _AsyncPlatformAuthResource:
    def __init__(self, client: AsyncDescriptClient) -> None:
        self._c = client

    async def request_code(
        self,
        platform_name: str,
        platform_domain: str,
        *,
        scopes: list[str] | None = None,
        agent_id: str | None = None,
        expires_in_seconds: int = 900,
    ) -> PlatformCodeSession:
        """Called by third-party platforms to issue an OTP verification code for an agent."""
        data = await self._c._request(
            "POST",
            "/auth/platform/code/request",
            json={
                "platformName": platform_name,
                "platformDomain": platform_domain,
                "requestedScopes": scopes or [],
                "agentId": agent_id,
                "expiresInSeconds": expires_in_seconds,
            },
        )
        return PlatformCodeSession.model_validate(data)

    async def get_code_info(self, user_code: str) -> dict[str, Any]:
        """Inspect a verification code."""
        return await self._c._request("GET", f"/auth/platform/code/{user_code}")

    async def claim_code(
        self,
        user_code: str,
        agent_id: str,
        keypair: KeyPair,
    ) -> AgentClaimResult:
        """Called by an agent (or controller) to sign and claim an OTP verification code."""
        sig = keypair.sign(user_code)
        data = await self._c._request(
            "POST",
            "/auth/platform/code/claim",
            json={
                "userCode": user_code,
                "agentId": agent_id,
                "signature": sig,
            },
        )
        return AgentClaimResult.model_validate(data)

    async def exchange_code(
        self,
        auth_session_id: str,
        user_code: str,
    ) -> PlatformTokenExchange:
        """Called by third-party platforms to exchange claimed code for the verified agent token."""
        data = await self._c._request(
            "POST",
            "/auth/platform/code/exchange",
            json={
                "authSessionId": auth_session_id,
                "userCode": user_code,
            },
        )
        return PlatformTokenExchange.model_validate(data)

    async def list_pending(
        self,
        *,
        agent_id: str | None = None,
        byte_network: str | None = None,
    ) -> list[PlatformPendingSession]:
        """List active pending authentication requests for this agent or network."""
        params: dict[str, str] = {}
        if agent_id:
            params["agent_id"] = agent_id
        if byte_network:
            params["byte_network"] = byte_network
        data = await self._c._request("GET", "/auth/platform/pending", params=params)
        return [PlatformPendingSession.model_validate(item) for item in data]

    async def stream_requests(
        self,
        *,
        agent_id: str | None = None,
        byte_network: str | None = None,
    ) -> AsyncIterator[PlatformPendingSession]:
        """Asynchronously stream incoming authentication requests in real time from the network."""
        import json
        params: dict[str, str] = {}
        if agent_id:
            params["agent_id"] = agent_id
        if byte_network:
            params["byte_network"] = byte_network

        async with self._c._http.stream("GET", f"{self._c.api_prefix}/auth/platform/stream", params=params, headers=self._c._headers()) as response:
            _raise_for_error(response)
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    raw = json.loads(line[6:].strip())
                    yield PlatformPendingSession(
                        authSessionId=raw["authSessionId"],
                        userCode=raw["userCode"],
                        platformName=raw["platformName"],
                        platformDomain=raw["platformDomain"],
                        requestedScopes=raw.get("requestedScopes", []),
                        byteNetwork=raw.get("byteNetwork"),
                        agentId=raw.get("agentId"),
                        status="pending",
                        expiresAt=datetime.fromisoformat(raw["expiresAt"]),
                        createdAt=datetime.now(UTC),
                    )

    async def verify_token(self, token: str) -> dict[str, Any]:
        """Called by third-party platforms to verify an incoming Descript Agent Token."""
        return await self._c._request("POST", "/auth/platform/token/verify", params={"token": token})


class AsyncDescriptClient(_BaseClient):
    """Asynchronous client for the Descript AI Agent Identity Platform."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        *,
        api_key: str | None = None,
        token: str | None = None,
        api_prefix: str = "/api/v1",
        timeout: float = 15.0,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__(base_url, api_key=api_key, token=token, api_prefix=api_prefix)
        self._owns_http = http_client is None
        self._http = http_client or httpx.AsyncClient(base_url=self.base_url, timeout=timeout)
        self.auth = _AsyncAuthResource(self)
        self.networks = _AsyncNetworksResource(self)
        self.agents = _AsyncAgentsResource(self)
        self.credentials = _AsyncCredentialsResource(self)
        self.verify = _AsyncVerifyResource(self)
        self.api_keys = _AsyncApiKeysResource(self)
        self.platform_auth = _AsyncPlatformAuthResource(self)

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        headers = self._headers()
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))
        response = await self._http.request(method, self._url(path), headers=headers, **kwargs)
        _raise_for_error(response)
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    async def health(self) -> HealthStatus:
        """Check Descript API and database connectivity."""
        return HealthStatus.model_validate(await self._request("GET", "/health"))

    async def aclose(self) -> None:
        if self._owns_http:
            await self._http.aclose()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_args: object) -> None:
        await self.aclose()
