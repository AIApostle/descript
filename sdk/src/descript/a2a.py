from __future__ import annotations

import secrets
import time
from dataclasses import dataclass
from typing import Any

from .crypto import KeyPair
from .exceptions import AuthenticationError
from .security import AgentClaims, DescriptSecurity


@dataclass
class A2AHandshakeHello:
    """Initial greeting sent from Agent A to Agent B."""

    agent_id: str
    network: str | None
    nonce: str
    timestamp: int
    signature: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "agentId": self.agent_id,
            "network": self.network,
            "nonce": self.nonce,
            "timestamp": self.timestamp,
            "signature": self.signature,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> A2AHandshakeHello:
        return cls(
            agent_id=data["agentId"],
            network=data.get("network"),
            nonce=data["nonce"],
            timestamp=int(data["timestamp"]),
            signature=data["signature"],
        )


@dataclass
class A2AHandshakeResponse:
    """Mutual identification response sent back from Agent B to Agent A."""

    responder_agent_id: str
    peer_agent_id: str
    nonce: str
    timestamp: int
    signature: str
    status: str = "verified"

    def to_dict(self) -> dict[str, Any]:
        return {
            "responderAgentId": self.responder_agent_id,
            "peerAgentId": self.peer_agent_id,
            "nonce": self.nonce,
            "timestamp": self.timestamp,
            "signature": self.signature,
            "status": self.status,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> A2AHandshakeResponse:
        return cls(
            responder_agent_id=data["responderAgentId"],
            peer_agent_id=data["peerAgentId"],
            nonce=data["nonce"],
            timestamp=int(data["timestamp"]),
            signature=data["signature"],
            status=data.get("status", "verified"),
        )


class DescriptA2A:
    """
    Agent-to-Agent (A2A) Identification Protocol.
    Allows two autonomous agents to mutually prove identity, network membership,
    and active status over arbitrary communication channels (HTTP, WebSockets, gRPC, P2P).
    """

    def __init__(
        self,
        agent_id: str,
        keypair: KeyPair,
        network: str | None = None,
        *,
        descript_base_url: str = "https://descript-ffch.onrender.com",
    ) -> None:
        self.agent_id = agent_id
        self.keypair = keypair
        self.network = network
        self.security = DescriptSecurity(
            platform_domain=f"a2a:{agent_id}",
            network=network,
            descript_base_url=descript_base_url,
        )

    def create_hello(self) -> A2AHandshakeHello:
        """Create a cryptographically signed Hello payload to introduce this agent to a peer."""
        now = int(time.time())
        nonce = secrets.token_hex(16)
        payload = f"descript-a2a-hello:{self.agent_id}:{self.network or ''}:{nonce}:{now}"
        sig = self.keypair.sign(payload)
        return A2AHandshakeHello(
            agent_id=self.agent_id,
            network=self.network,
            nonce=nonce,
            timestamp=now,
            signature=sig,
        )

    def verify_peer_hello(
        self,
        hello: A2AHandshakeHello | dict[str, Any],
        *,
        max_age_seconds: int = 60,
    ) -> AgentClaims:
        """Agent B receives and verifies Agent A's Hello message."""
        if isinstance(hello, dict):
            hello = A2AHandshakeHello.from_dict(hello)

        now = int(time.time())
        if abs(now - hello.timestamp) > max_age_seconds:
            raise AuthenticationError("Peer A2A hello message has expired or timestamp skewed")

        if self.network and hello.network and hello.network != self.network:
            raise AuthenticationError(
                f"Peer agent belongs to network '{hello.network}', expected '{self.network}'"
            )

        payload = f"descript-a2a-hello:{hello.agent_id}:{hello.network or ''}:{hello.nonce}:{hello.timestamp}"
        return self.security._verify_with_descript_sync(
            agent_id=hello.agent_id,
            canonical_message=payload,
            signature=hello.signature,
            required_scopes=None,
        )

    async def verify_peer_hello_async(
        self,
        hello: A2AHandshakeHello | dict[str, Any],
        *,
        max_age_seconds: int = 60,
    ) -> AgentClaims:
        """Asynchronously verify Agent A's Hello message."""
        if isinstance(hello, dict):
            hello = A2AHandshakeHello.from_dict(hello)

        now = int(time.time())
        if abs(now - hello.timestamp) > max_age_seconds:
            raise AuthenticationError("Peer A2A hello message has expired or timestamp skewed")

        if self.network and hello.network and hello.network != self.network:
            raise AuthenticationError(
                f"Peer agent belongs to network '{hello.network}', expected '{self.network}'"
            )

        payload = f"descript-a2a-hello:{hello.agent_id}:{hello.network or ''}:{hello.nonce}:{hello.timestamp}"
        return await self.security._verify_with_descript_async(
            agent_id=hello.agent_id,
            canonical_message=payload,
            signature=hello.signature,
            required_scopes=None,
        )

    def respond_to_hello(self, hello: A2AHandshakeHello) -> A2AHandshakeResponse:
        """Agent B produces a mutual signed proof back to Agent A."""
        now = int(time.time())
        nonce = secrets.token_hex(16)
        # Binds B's signature to A's nonce and identity
        payload = f"descript-a2a-reply:{self.agent_id}:{hello.agent_id}:{hello.nonce}:{nonce}:{now}"
        sig = self.keypair.sign(payload)
        return A2AHandshakeResponse(
            responder_agent_id=self.agent_id,
            peer_agent_id=hello.agent_id,
            nonce=nonce,
            timestamp=now,
            signature=sig,
        )

    def verify_peer_response(
        self,
        original_hello: A2AHandshakeHello,
        response: A2AHandshakeResponse | dict[str, Any],
        *,
        max_age_seconds: int = 60,
    ) -> AgentClaims:
        """Agent A verifies Agent B's reply, completing mutual identity verification."""
        if isinstance(response, dict):
            response = A2AHandshakeResponse.from_dict(response)

        now = int(time.time())
        if abs(now - response.timestamp) > max_age_seconds:
            raise AuthenticationError("Peer A2A response has expired or timestamp skewed")

        if response.peer_agent_id != self.agent_id:
            raise AuthenticationError(
                f"Peer response bound to wrong agent: '{response.peer_agent_id}'"
            )

        payload = f"descript-a2a-reply:{response.responder_agent_id}:{self.agent_id}:{original_hello.nonce}:{response.nonce}:{response.timestamp}"
        return self.security._verify_with_descript_sync(
            agent_id=response.responder_agent_id,
            canonical_message=payload,
            signature=response.signature,
            required_scopes=None,
        )

    async def verify_peer_response_async(
        self,
        original_hello: A2AHandshakeHello,
        response: A2AHandshakeResponse | dict[str, Any],
        *,
        max_age_seconds: int = 60,
    ) -> AgentClaims:
        """Asynchronously verify Agent B's reply, completing mutual identity verification."""
        if isinstance(response, dict):
            response = A2AHandshakeResponse.from_dict(response)

        now = int(time.time())
        if abs(now - response.timestamp) > max_age_seconds:
            raise AuthenticationError("Peer A2A response has expired or timestamp skewed")

        if response.peer_agent_id != self.agent_id:
            raise AuthenticationError(
                f"Peer response bound to wrong agent: '{response.peer_agent_id}'"
            )

        payload = f"descript-a2a-reply:{response.responder_agent_id}:{self.agent_id}:{original_hello.nonce}:{response.nonce}:{response.timestamp}"
        return await self.security._verify_with_descript_async(
            agent_id=response.responder_agent_id,
            canonical_message=payload,
            signature=response.signature,
            required_scopes=None,
        )
