from __future__ import annotations

import base64
from datetime import UTC, datetime

import httpx
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from backend.config import get_settings
from backend.database import get_engine
from backend.main import create_app


@pytest.mark.asyncio
async def test_live_neon_postgres_and_auth():
    settings = get_settings()
    host = settings.normalized_database_url.split("@")[-1]
    print(f"\n[NEON LIVE E2E] Host: {host}")
    print(f"[NEON LIVE E2E] Auth Base URL: {settings.neon_auth_base_url}")
    print(f"[NEON LIVE E2E] Branch: {settings.neon_branch} ({settings.neon_branch_id})")

    # 1. Test Neon Auth JWKS Endpoint
    if settings.neon_auth_jwks_url:
        async with httpx.AsyncClient() as http_client:
            jwks_resp = await http_client.get(settings.neon_auth_jwks_url)
            assert jwks_resp.status_code == 200, "Neon Auth JWKS endpoint unreachable"
            keys = jwks_resp.json().get("keys", [])
            print(f"  ✓ Neon Auth JWKS returned {len(keys)} active key(s)")

    # 2. Test FastAPI against Neon PostgreSQL
    app = create_app()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Health check
        h_resp = await client.get("/api/v1/health")
        assert h_resp.status_code == 200
        h_data = h_resp.json()
        assert h_data["status"] == "ok"
        assert h_data["databaseConnected"] is True
        print(f"  ✓ Neon Health Check OK (Database: {h_data['database']}, Latency: {h_data['latencyMs']}ms)")

        # Controller Registration
        ts = int(datetime.now(UTC).timestamp())
        email = f"neon_pilot_{ts}@descript.id"
        signup_resp = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": email,
                "password": "Password123!SecureNeon",
                "name": "Neon Pilot Controller",
                "organization": "Neon AI Fleet",
            },
        )
        assert signup_resp.status_code == 201
        auth_data = signup_resp.json()
        token = auth_data["token"]
        user_id = auth_data["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"  ✓ User {email} registered in Neon PostgreSQL (ID: {user_id})")

        # Agent Registration with Ed25519 Keypair
        priv = Ed25519PrivateKey.generate()
        pub_bytes = priv.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )
        pub_b64 = base64.b64encode(pub_bytes).decode()

        agent_resp = await client.post(
            "/api/v1/agents",
            headers=headers,
            json={
                "name": "Neon Sentinel Agent",
                "description": "Autonomous settlement worker backed by Neon",
                "byteNetwork": "kiroween",
                "publicKey": pub_b64,
                "algorithm": "ed25519",
                "capabilities": ["settle", "reconcile"],
            },
        )
        assert agent_resp.status_code == 201
        agent_data = agent_resp.json()
        agent_id = agent_data["id"]
        print(f"  ✓ Agent {agent_data['name']} registered with UUIDv7 ID: {agent_id}")

        # Challenge-Response Authentication
        chal_resp = await client.post(
            "/api/v1/challenges",
            headers=headers,
            json={"agentId": agent_id, "audience": "bytebank"},
        )
        assert chal_resp.status_code == 201
        chal_data = chal_resp.json()
        nonce = chal_data["nonce"]
        sig_bytes = priv.sign(nonce.encode("utf-8"))
        sig_b64 = base64.b64encode(sig_bytes).decode()

        solve_resp = await client.post(
            "/api/v1/challenges/verify",
            headers=headers,
            json={
                "agentId": agent_id,
                "challengeId": chal_data["challengeId"],
                "signature": sig_b64,
            },
        )
        assert solve_resp.status_code == 200
        assert solve_resp.json()["verified"] is True
        print("  ✓ Nonce challenge signed & verified successfully against Neon credential")

        # Verify Bytecript Manifest
        verify_resp = await client.post(
            "/api/v1/verify/bytecript",
            json={
                "bytecript": agent_data["bytecript"],
                "checkDirectory": True,
            },
        )
        assert verify_resp.status_code == 200
        assert verify_resp.json()["verified"] is True
        print("  ✓ Bytecript passport verified against active Neon database state")

    engine = get_engine()
    await engine.dispose()
