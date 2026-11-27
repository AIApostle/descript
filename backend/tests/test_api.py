from __future__ import annotations

import base64
import hashlib
from pathlib import Path

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from httpx import ASGITransport, AsyncClient

from backend.config import normalize_database_url, reset_settings_cache
from backend.database import init_db, reset_database_engine
from backend.main import create_app


def _make_ed25519_pair() -> tuple[Ed25519PrivateKey, str, str, str]:
    priv = Ed25519PrivateKey.generate()
    raw_pub = priv.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    pem_pub = priv.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("ascii")
    ssh_pub = priv.public_key().public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH,
    ).decode("ascii")
    b64_pub = base64.b64encode(raw_pub).decode("ascii")
    return priv, b64_pub, pem_pub, ssh_pub


@pytest.fixture
async def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "test_descript.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_file}")
    monkeypatch.setenv("JWT_SECRET", "test-secret-for-descript-suite-32-chars-min")
    reset_settings_cache()
    reset_database_engine(f"sqlite+aiosqlite:///{db_file}")
    await init_db()

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


def test_neon_url_normalization():
    raw = "postgres://user:pass@ep-cool-123.us-east-2.aws.neon.tech/neondb"
    normalized = normalize_database_url(raw)
    assert normalized.startswith("postgresql+psycopg://")
    assert "sslmode=require" in normalized

    with_params = "postgresql://user:pass@ep-cool-123.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    normalized2 = normalize_database_url(with_params)
    assert normalized2.startswith("postgresql+psycopg://")
    assert "channel_binding=require" in normalized2


async def test_health_endpoints(client: AsyncClient):
    for path in ("/health", "/healthz", "/livez", "/readyz", "/api/v1/health", "/api/v1/healthz"):
        resp = await client.get(path)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["status"] == "ok"
        assert body["service"] == "descript-api"
        assert body["database"] == "sqlite"
        assert body["databaseConnected"] is True
        assert body["latencyMs"] >= 0
        assert "timestamp" in body


async def test_full_agent_lifecycle_and_verification(client: AsyncClient):
    # 1. Signup and login
    signup_resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "builder@example.com", "password": "StrongPassword123!", "name": "Maya Lin"},
    )
    assert signup_resp.status_code == 201, signup_resp.text
    auth_data = signup_resp.json()
    token = auth_data["token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "builder@example.com"

    # 2. Byte Networks seeded
    nets_resp = await client.get("/api/v1/networks")
    assert nets_resp.status_code == 200
    slugs = [n["slug"] for n in nets_resp.json()]
    assert "kiroween" in slugs
    assert "partner-network" in slugs

    # 3. Register agent with PEM public key
    priv1, b64_pub1, pem_pub1, _ = _make_ed25519_pair()
    reg_resp = await client.post(
        "/api/v1/agents",
        headers=headers,
        json={
            "name": "Ledger Sentinel",
            "description": "Autonomous reconciliation agent",
            "byteNetwork": "kiroween",
            "publicKey": pem_pub1,
            "agentType": "workflow",
            "framework": "langgraph",
            "capabilities": ["reconcile", "sign"],
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text
    agent = reg_resp.json()
    agent_id = agent["id"]
    assert agent_id.startswith("agent_")
    assert agent["status"] == "active"
    assert agent["residence"] == "kiroween-residence"
    assert agent["credentials"][0]["publicKey"] == b64_pub1
    expected_fp = hashlib.sha256(base64.b64decode(b64_pub1)).hexdigest()
    assert agent["credentials"][0]["fingerprint"] == expected_fp

    # Duplicate name blocked
    dup_resp = await client.post(
        "/api/v1/agents",
        headers=headers,
        json={"name": "Ledger Sentinel", "byteNetwork": "kiroween", "publicKey": b64_pub1},
    )
    assert dup_resp.status_code == 409

    # 4. Bytecript verification (valid & tampered)
    bc = agent["bytecript"]
    verify_bc = await client.post("/api/v1/verify/bytecript", json={"bytecript": bc})
    assert verify_bc.status_code == 200
    assert verify_bc.json()["verified"] is True
    assert verify_bc.json()["signatureValid"] is True
    assert verify_bc.json()["liveStatus"] == "active"

    tampered = dict(bc)
    tampered["agentName"] = "Evil Agent"
    verify_tampered = await client.post("/api/v1/verify/bytecript", json={"bytecript": tampered})
    assert verify_tampered.status_code == 200
    assert verify_tampered.json()["verified"] is False
    assert verify_tampered.json()["signatureValid"] is False

    # 5. Challenge-response authentication (Bytebank flow)
    chg_resp = await client.post(
        "/api/v1/challenges",
        json={"agentId": agent_id, "audience": "bytebank"},
    )
    assert chg_resp.status_code == 201
    chg = chg_resp.json()
    sig_hex = priv1.sign(chg["nonce"].encode("utf-8")).hex()

    ver_resp = await client.post(
        "/api/v1/challenges/verify",
        json={"challengeId": chg["challengeId"], "agentId": agent_id, "signature": sig_hex},
    )
    assert ver_resp.status_code == 200
    assert ver_resp.json()["verified"] is True

    # Replay must fail
    replay_resp = await client.post(
        "/api/v1/challenges/verify",
        json={"challengeId": chg["challengeId"], "agentId": agent_id, "signature": sig_hex},
    )
    assert replay_resp.status_code == 200
    assert replay_resp.json()["verified"] is False

    # 6. Rotate credential with OpenSSH key, revoke old key
    priv2, _b64_pub2, _pem2, ssh_pub2 = _make_ed25519_pair()
    rot_resp = await client.post(
        f"/api/v1/agents/{agent_id}/credentials",
        headers=headers,
        json={"publicKey": ssh_pub2, "label": "Rotated Key", "deactivateExisting": True},
    )
    assert rot_resp.status_code == 201
    cred2 = rot_resp.json()
    assert cred2["status"] == "active"

    # Old key no longer verifies stateless message
    msg = "Transfer $0.00 test"
    old_sig = base64.b64encode(priv1.sign(msg.encode())).decode()
    new_sig = base64.b64encode(priv2.sign(msg.encode())).decode()
    assert (
        await client.post("/api/v1/verify", json={"agentId": agent_id, "message": msg, "signature": old_sig})
    ).json()["verified"] is False
    assert (
        await client.post("/api/v1/verify", json={"agentId": agent_id, "message": msg, "signature": new_sig})
    ).json()["verified"] is True

    # 7. Suspend and reactivate
    sus_resp = await client.patch(
        f"/api/v1/agents/{agent_id}/status",
        headers=headers,
        json={"status": "suspended", "reason": "Routine key audit"},
    )
    assert sus_resp.status_code == 200
    assert sus_resp.json()["status"] == "suspended"

    assert (
        await client.post("/api/v1/verify", json={"agentId": agent_id, "message": msg, "signature": new_sig})
    ).json()["verified"] is False

    react_resp = await client.patch(
        f"/api/v1/agents/{agent_id}/status",
        headers=headers,
        json={"status": "active", "reason": "Audit cleared"},
    )
    assert react_resp.status_code == 200
    assert react_resp.json()["status"] == "active"

    # 8. API Key creation and Python SDK auth via X-API-Key
    key_resp = await client.post(
        "/api/v1/api-keys",
        headers=headers,
        json={"name": "Python SDK Key"},
    )
    assert key_resp.status_code == 201
    api_secret = key_resp.json()["secret"]
    assert api_secret.startswith("dsc_live_")

    sdk_agents = await client.get("/api/v1/agents", headers={"X-API-Key": api_secret})
    assert sdk_agents.status_code == 200
    assert len(sdk_agents.json()) == 1

    # 9. Audit trail recorded everything
    audit_resp = await client.get(f"/api/v1/agents/{agent_id}/audit", headers=headers)
    assert audit_resp.status_code == 200
    event_types = {e["eventType"] for e in audit_resp.json()}
    assert {"agent.registered", "credential.added", "credential.rotated", "challenge.verified", "agent.suspended", "agent.active"} <= event_types
