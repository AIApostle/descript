import json
from pathlib import Path
import pytest
import httpx
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route

from descript import (
    A2AHandshakeHello,
    A2AHandshakeResponse,
    AgentClaims,
    AuthenticationError,
    DescriptA2A,
    DescriptAgentAuth,
    DescriptSecurity,
    KeyPair,
)


@pytest.mark.asyncio
async def test_programmatic_platform_security_and_agent_auth_flow(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
):
    import sys

    backend_src = Path(__file__).resolve().parents[2] / "backend" / "src"
    sys.path.insert(0, str(backend_src))

    from backend.config import reset_settings_cache
    from backend.database import init_db, reset_database_engine
    from backend.main import create_app
    from descript import AsyncDescriptClient

    db_file = tmp_path / "sdk_security_e2e.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_file}")
    monkeypatch.setenv("JWT_SECRET", "sdk-security-e2e-secret-key-32-chars-min")
    reset_settings_cache()
    reset_database_engine(f"sqlite+aiosqlite:///{db_file}")
    await init_db()

    backend_app = create_app()
    backend_transport = httpx.ASGITransport(app=backend_app)

    async with (
        httpx.AsyncClient(transport=backend_transport, base_url="http://descript.internal") as descript_http,
        AsyncDescriptClient(base_url="http://descript.internal", http_client=descript_http) as descript_client,
    ):
        # 1. Setup user & register an agent
        await descript_client.auth.signup("controller@platform.com", "Password1234!", name="Platform Controller")
        api_key = await descript_client.api_keys.create("Platform Key")
        descript_client.set_token(None)
        descript_client.set_api_key(api_key.secret)

        agent, agent_kp = await descript_client.agents.create_with_generated_key(
            name="WorkerBot",
            byte_network="kiroween",
            capabilities=["tools:execute"],
        )

        # 2. Setup Third-Party Platform with DescriptSecurity
        platform_security = DescriptSecurity(
            platform_domain="tools.platform.io",
            network="kiroween",
            descript_base_url="http://descript.internal",
            async_http_client=descript_http,
        )

        # Store active challenge nonces for our endpoints
        active_challenges: dict[str, str] = {}

        async def get_challenge_endpoint(request: Request):
            ch = platform_security.create_challenge(required_scopes=["tools:database:read"])
            active_challenges[ch.challenge] = ch.platform_domain
            return JSONResponse(ch.to_dict())

        async def protected_tool_endpoint(request: Request):
            # Check if agent presented credentials
            headers = dict(request.headers)
            expected_challenge = headers.get("x-descript-challenge")
            if not expected_challenge or expected_challenge not in active_challenges:
                # Issue 401 challenge
                ch = platform_security.create_challenge(required_scopes=["tools:database:read"])
                active_challenges[ch.challenge] = ch.platform_domain
                return Response(
                    status_code=401,
                    headers={"WWW-Authenticate": ch.to_header()},
                    content=json.dumps({"error": "DESCRIPT_CHALLENGE_REQUIRED", "challenge": ch.to_dict()}),
                    media_type="application/json",
                )

            # Programmatically verify agent's request
            claims: AgentClaims = await platform_security.verify_agent_request_async(
                headers=headers,
                expected_challenge=expected_challenge,
                method=request.method,
                path=request.url.path,
                required_scopes=["tools:database:read"],
            )
            return JSONResponse({
                "status": "success",
                "message": f"Hello {claims.name} ({claims.id})",
                "network": claims.byte_network,
            })

        platform_app = Starlette(
            routes=[
                Route("/auth/challenge", get_challenge_endpoint, methods=["GET", "POST"]),
                Route("/tools/database/query", protected_tool_endpoint, methods=["POST"]),
            ]
        )
        platform_transport = httpx.ASGITransport(app=platform_app)

        # 3. Agent calls protected endpoint using DescriptAgentAuth
        # The agent client automatically catches the 401 challenge, signs it, and retries!
        agent_auth = DescriptAgentAuth(
            agent_id=agent.id,
            keypair=agent_kp,
        )

        async with httpx.AsyncClient(
            transport=platform_transport,
            base_url="http://tools.platform.io",
            auth=agent_auth,
        ) as agent_http:
            resp = await agent_http.post("/tools/database/query", json={"query": "SELECT * FROM tasks"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "success"
            assert data["network"] == "kiroween"
            assert agent.id in data["message"]

        # 4. Agent-to-Agent (A2A) Mutual Identification Test
        # Create second agent
        peer_agent, peer_kp = await descript_client.agents.create_with_generated_key(
            name="SupervisorBot",
            byte_network="kiroween",
            capabilities=["supervise"],
        )

        # For synchronous A2A testing with the FastAPI backend in-process, supply async_http_client
        a2a_agent1 = DescriptA2A(
            agent_id=agent.id,
            keypair=agent_kp,
            network="kiroween",
            descript_base_url="http://descript.internal",
        )
        a2a_agent1.security._async_http = descript_http

        a2a_agent2 = DescriptA2A(
            agent_id=peer_agent.id,
            keypair=peer_kp,
            network="kiroween",
            descript_base_url="http://descript.internal",
        )
        a2a_agent2.security._async_http = descript_http

        # Step 1: Agent 1 creates Hello
        hello = a2a_agent1.create_hello()
        assert hello.agent_id == agent.id
        assert hello.network == "kiroween"

        # Step 2: Agent 2 receives and verifies Agent 1
        claims1 = await a2a_agent2.verify_peer_hello_async(hello)
        assert claims1.id == agent.id
        assert claims1.byte_network == "kiroween"

        # Step 3: Agent 2 responds with mutual signed challenge
        reply = a2a_agent2.respond_to_hello(hello)
        assert reply.responder_agent_id == peer_agent.id
        assert reply.peer_agent_id == agent.id

        # Step 4: Agent 1 verifies Agent 2's response
        claims2 = await a2a_agent1.verify_peer_response_async(hello, reply)
        assert claims2.id == peer_agent.id
        assert claims2.byte_network == "kiroween"
