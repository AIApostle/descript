import json
from pathlib import Path
import pytest
import httpx

from descript import (
    AsyncDescriptClient,
    DescriptClient,
    KeyPair,
)


@pytest.mark.asyncio
async def test_netprints_and_agent_messaging_e2e(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    import sys

    backend_src = Path(__file__).resolve().parents[2] / "backend" / "src"
    sys.path.insert(0, str(backend_src))

    from backend.config import reset_settings_cache
    from backend.database import init_db, reset_database_engine
    from backend.main import create_app

    db_file = tmp_path / "sdk_netprints_msg_e2e.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_file}")
    monkeypatch.setenv("JWT_SECRET", "sdk-netprints-test-key-32-chars-minimum")
    reset_settings_cache()
    reset_database_engine(f"sqlite+aiosqlite:///{db_file}")
    await init_db()

    app = create_app()
    transport = httpx.ASGITransport(app=app)

    async with (
        httpx.AsyncClient(transport=transport, base_url="http://testserver") as http,
        AsyncDescriptClient(base_url="http://testserver", http_client=http) as client,
    ):
        # 1. Signup human developer and create API key
        user_sess = await client.auth.signup("dev@enterprise.ai", "Password123!", name="Enterprise Dev")
        api_key = await client.api_keys.create("Production Deployment Key")
        client.set_token(None)
        client.set_api_key(api_key.secret)

        # 2. Register two agents under the developer
        agent_alpha, kp_alpha = await client.agents.create_with_generated_key(
            name="Agent Alpha",
            byte_network="kiroween",
            capabilities=["analysis", "comms"],
        )
        assert agent_alpha.id.startswith("agent_")

        agent_beta, kp_beta = await client.agents.create_with_generated_key(
            name="Agent Beta",
            byte_network="kiroween",
            capabilities=["execution", "comms"],
        )
        assert agent_beta.id.startswith("agent_")

        # 3. Test Netprints (Agent internet/platform footprint recording)
        footprint1 = await client.netprints.record(
            agent_id=agent_alpha.id,
            platform_name="HuggingFace Hub",
            platform_domain="huggingface.co",
            action="model.download",
            resource="models/meta-llama/Llama-3-8B",
            status="success",
            security_level="cryptographic",
            payload={"tokens_processed": 50000},
            keypair=kp_alpha,
        )
        assert footprint1.id.startswith("netp_")
        assert footprint1.platform_domain == "huggingface.co"

        footprint2 = await client.netprints.record(
            agent_id=agent_alpha.id,
            platform_name="GitHub",
            platform_domain="github.com",
            action="repo.push",
            resource="descript/autonomous-worker",
            status="success",
            payload={"commit": "abc1234"},
        )
        assert footprint2.id.startswith("netp_")

        # Developer / dashboard queries agent's netprints
        client.set_api_key(None)
        client.set_token(user_sess.token)

        prints = await client.netprints.list(agent_id=agent_alpha.id)
        assert len(prints) == 2
        assert prints[0].platform_name in ("HuggingFace Hub", "GitHub")

        # 4. Test Agent-to-Agent direct messaging
        msg = await client.messages.send(
            sender_agent_id=agent_alpha.id,
            recipient_agent_id=agent_beta.id,
            subject="Task Delegation",
            content="Execute dataset analysis on batch #42",
            keypair=kp_alpha,
            metadata={"priority": "high", "jobId": "job_9918"},
        )
        assert msg.id.startswith("msg_")
        assert msg.sender_agent_id == agent_alpha.id
        assert msg.recipient_agent_id == agent_beta.id
        assert msg.status == "unread"

        # Agent Beta receives messages in its inbox
        inbox = await client.messages.list(agent_beta.id, box="inbox")
        assert len(inbox) == 1
        assert inbox[0].id == msg.id
        assert inbox[0].content == "Execute dataset analysis on batch #42"

        # Agent Beta marks message as read
        read_msg = await client.messages.mark_read(msg.id)
        assert read_msg.status == "read"
        assert read_msg.readAt is not None
