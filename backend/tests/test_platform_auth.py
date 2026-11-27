from __future__ import annotations

import time
import base64
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from httpx import ASGITransport, AsyncClient

from backend.main import create_app


@pytest.mark.asyncio
async def test_platform_otp_auth_flow():
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        ts = int(time.time())
        email = f"platform_controller_{ts}@descript.id"
        # 1. Controller signs up and registers an agent
        signup = await client.post(
            "/api/v1/auth/signup",
            json={
                "email": email,
                "password": "Password123!Secure",
                "name": "Platform Controller",
                "organization": "SaaS Integrator",
            },
        )
        assert signup.status_code == 201
        token = signup.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Generate agent keypair
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
                "name": "Bytebank Settlement Worker",
                "description": "Agent connecting to Bytebank via OTP",
                "byteNetwork": "kiroween",
                "publicKey": pub_b64,
                "capabilities": ["settlement", "transfers"],
            },
        )
        assert agent_resp.status_code == 201
        agent_id = agent_resp.json()["id"]

        # 2. Third-Party Platform (e.g. Bytebank) initiates Descript Auth
        code_req = await client.post(
            "/api/v1/auth/platform/code/request",
            json={
                "platformName": "Bytebank Finance",
                "platformDomain": "bytebank.finance",
                "requestedScopes": ["settlement:write", "balance:read"],
                "byteNetwork": "kiroween",
                "expiresInSeconds": 600,
            },
        )
        assert code_req.status_code == 201
        code_data = code_req.json()
        user_code = code_data["userCode"]
        auth_session_id = code_data["authSessionId"]
        assert user_code.startswith("DSC-")
        assert code_data["platformName"] == "Bytebank Finance"

        # 3. Code inspection (like Gmail / Google TV OAuth code verification screen)
        inspect_resp = await client.get(f"/api/v1/auth/platform/code/{user_code}")
        assert inspect_resp.status_code == 200
        assert inspect_resp.json()["status"] == "pending"

        # 3b. Agent or Dashboard queries pending requests stream / list from the network
        pending_resp = await client.get(
            "/api/v1/auth/platform/pending",
            params={"byte_network": "kiroween"},
        )
        assert pending_resp.status_code == 200
        pending_list = pending_resp.json()
        assert any(item["userCode"] == user_code for item in pending_list)

        # 4. Agent signs the OTP code with its private key to prove identity
        sig_bytes = priv.sign(user_code.encode("utf-8"))
        sig_b64 = base64.b64encode(sig_bytes).decode()

        claim_resp = await client.post(
            "/api/v1/auth/platform/code/claim",
            json={
                "userCode": user_code,
                "agentId": agent_id,
                "signature": sig_b64,
            },
        )
        assert claim_resp.status_code == 200
        claim_data = claim_resp.json()
        assert claim_data["claimed"] is True
        assert claim_data["status"] == "approved"

        # 5. Platform exchanges code for verified agent access token
        exchange_resp = await client.post(
            "/api/v1/auth/platform/code/exchange",
            json={
                "authSessionId": auth_session_id,
                "userCode": user_code,
            },
        )
        assert exchange_resp.status_code == 200
        ex_data = exchange_resp.json()
        assert ex_data["status"] == "approved"
        assert ex_data["agent"]["id"] == agent_id
        assert ex_data["agent"]["name"] == "Bytebank Settlement Worker"
        assert ex_data["accessToken"].startswith("dat_")
        assert "settlement:write" in ex_data["grantedScopes"]

        # 6. Platform verifies the access token on subsequent requests
        verify_resp = await client.post(
            "/api/v1/auth/platform/token/verify",
            params={"token": ex_data["accessToken"]},
        )
        assert verify_resp.status_code == 200
        v_data = verify_resp.json()
        assert v_data["valid"] is True
        assert v_data["agent"]["id"] == agent_id
        assert v_data["platformDomain"] == "bytebank.finance"
