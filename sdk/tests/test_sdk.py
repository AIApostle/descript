from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from descript import (
    AsyncDescriptClient,
    AuthenticationError,
    ConflictError,
    CryptographicError,
    DescriptClient,
    KeyPair,
    NotFoundError,
    verify_bytecript_signature,
    verify_signature,
)


def test_keypair_generation_signing_and_serialization(tmp_path: Path):
    kp = KeyPair.generate()
    assert len(kp.public_key_bytes) == 32
    assert len(kp.fingerprint) == 64

    sig_b64 = kp.sign("hello descript", encoding="base64")
    sig_hex = kp.sign("hello descript", encoding="hex")

    assert verify_signature(kp.public_key_b64, "hello descript", sig_b64) is True
    assert verify_signature(kp.public_key_pem, "hello descript", sig_hex) is True
    assert verify_signature(kp.public_key_openssh, "hello descript", sig_b64) is True
    assert verify_signature(kp.public_key_b64, "tampered", sig_b64) is False

    pem_file = tmp_path / "agent.pem"
    kp.save_pem(pem_file)
    reloaded = KeyPair.from_file(pem_file)
    assert reloaded.fingerprint == kp.fingerprint
    assert reloaded.sign("test") == kp.sign("test")

    with pytest.raises(CryptographicError):
        KeyPair.from_base64("not-valid-key")


def test_sync_client_mock_transport_and_errors():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/health":
            return httpx.Response(
                200,
                json={
                    "status": "ok",
                    "service": "descript-api",
                    "version": "0.1.0",
                    "environment": "development",
                    "database": "postgres",
                    "databaseConnected": True,
                    "latencyMs": 4.2,
                    "timestamp": "2026-11-26T14:00:00Z",
                    "detail": None,
                },
            )
        if request.url.path == "/api/v1/networks":
            return httpx.Response(
                200,
                json=[
                    {
                        "slug": "kiroween",
                        "name": "Kiroween Network",
                        "residenceDomain": "kiroween-residence",
                        "description": "Primary",
                        "issuer": "Descript",
                        "policySummary": "Ed25519",
                        "isPublic": True,
                    }
                ],
            )
        if request.url.path == "/api/v1/agents/missing":
            return httpx.Response(
                404,
                json={"detail": {"error": "AGENT_NOT_FOUND", "message": "Agent not found"}},
            )
        return httpx.Response(500, text="Unexpected")

    http = httpx.Client(base_url="http://testserver", transport=httpx.MockTransport(handler))
    with DescriptClient(base_url="http://testserver", api_key="dsc_test", http_client=http) as client:
        health = client.health()
        assert health.status == "ok"
        assert health.database == "postgres"
        assert health.databaseConnected is True

        nets = client.networks.list()
        assert len(nets) == 1
        assert nets[0].slug == "kiroween"

        with pytest.raises(NotFoundError):
            client.agents.get("missing")


async def test_async_sdk_against_fastapi_backend(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    import sys

    backend_src = Path(__file__).resolve().parents[2] / "backend" / "src"
    sys.path.insert(0, str(backend_src))

    from backend.config import reset_settings_cache
    from backend.database import init_db, reset_database_engine
    from backend.main import create_app

    db_file = tmp_path / "sdk_e2e.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_file}")
    monkeypatch.setenv("JWT_SECRET", "sdk-e2e-secret-key-at-least-32-characters")
    reset_settings_cache()
    reset_database_engine(f"sqlite+aiosqlite:///{db_file}")
    await init_db()

    app = create_app()
    transport = httpx.ASGITransport(app=app)
    async with (
        httpx.AsyncClient(transport=transport, base_url="http://testserver") as http,
        AsyncDescriptClient(base_url="http://testserver", http_client=http) as client,
    ):
        health = await client.health()
        assert health.status == "ok"
        assert health.databaseConnected is True

        session = await client.auth.signup("sdk@example.com", "SuperSecurePass123!", name="SDK User")
        assert session.user.email == "sdk@example.com"

        # Create API key and switch client to API key auth
        api_key = await client.api_keys.create("CI Runner")
        assert api_key.secret is not None
        client.set_token(None)
        client.set_api_key(api_key.secret)

        # Register agent with locally generated keypair
        agent, kp1 = await client.agents.create_with_generated_key(
            name="SDK Bot",
            description="Created from Python SDK",
            byte_network="kiroween",
            capabilities=["sign", "verify"],
        )
        assert agent.id.startswith("agent_")
        assert agent.bytecript is not None
        assert verify_bytecript_signature(agent.bytecript) is True
        assert json.loads(agent.bytecript.model_dump_json())["agentId"] == agent.id

        # Duplicate error mapped cleanly to ConflictError
        with pytest.raises(ConflictError):
            await client.agents.create(name="SDK Bot", public_key=kp1.public_key_b64)

        # Full challenge-response auth
        auth_res = await client.verify.authenticate_with_keypair(agent.id, kp1, audience="bytebank")
        assert auth_res.verified is True

        # Rotate key
        cred2, kp2 = await client.credentials.rotate_with_generated_key(agent.id)
        assert cred2.status == "active"

        # Old key rejected, new key verified
        assert (await client.verify.authenticate_with_keypair(agent.id, kp1)).verified is False
        assert (await client.verify.authenticate_with_keypair(agent.id, kp2)).verified is True

        # Online Bytecript verification
        bc_res = await client.verify.verify_bytecript(agent.bytecript)
        assert bc_res.verified is True
        assert bc_res.liveStatus == "active"

        # Suspend & verify blocked
        await client.agents.suspend(agent.id, reason="Maintenance")
        with pytest.raises(AuthenticationError):
            await client.verify.authenticate_with_keypair(agent.id, kp2)
        assert (
            await client.verify.verify_message(agent.id, message="ping", signature=kp2.sign("ping"))
        ).verified is False

        # Reactivate agent and test Platform Auth OTP code flow
        await client.agents.reactivate(agent.id)

        # 1. External platform requests OTP code
        platform_session = await client.platform_auth.request_code(
            platform_name="Bytebank",
            platform_domain="bytebank.finance",
            scopes=["settlement:execute"],
            agent_id=agent.id,
        )
        assert platform_session.user_code.startswith("DSC-")

        # 2. Agent receives code from network stream/pending list
        pending = await client.platform_auth.list_pending(agent_id=agent.id)
        assert any(p.user_code == platform_session.user_code for p in pending)

        # 3. Agent claims and signs code
        claim = await client.platform_auth.claim_code(
            user_code=platform_session.user_code,
            agent_id=agent.id,
            keypair=kp2,
        )
        assert claim.claimed is True

        # 4. Platform exchanges code for agent access token
        ex = await client.platform_auth.exchange_code(
            auth_session_id=platform_session.auth_session_id,
            user_code=platform_session.user_code,
        )
        assert ex.status == "approved"
        assert ex.access_token is not None
        assert ex.agent.id == agent.id

        # 5. Platform verifies incoming token
        v = await client.platform_auth.verify_token(ex.access_token)
        assert v["valid"] is True
        assert v["agent"]["id"] == agent.id
