# Descript Python SDK

Official Python SDK for the **Descript** AI Agent Identity & Bytecript Platform.

## Installation

```bash
pip install descript
# or with uv
uv add descript
```

## Quick Start

```python
from descript import DescriptClient, KeyPair

# 1. Generate an Ed25519 keypair locally (private key never leaves your environment)
keypair = KeyPair.generate()

# 2. Register an agent on the Descript platform
with DescriptClient(base_url="http://localhost:8000", api_key="dsc_live_...") as client:
    agent = client.agents.create(
        name="Ledger Sentinel",
        description="Autonomous invoice reconciliation agent",
        byte_network="kiroween",
        public_key=keypair.public_key_b64,
        capabilities=["reconcile", "sign"],
    )
    print("Agent ID:", agent.id)
    print("Fingerprint:", agent.credentials[0].formatted_fingerprint)

    # 3. Authenticate to an external service via challenge-response
    result = client.verify.authenticate_with_keypair(
        agent_id=agent.id,
        keypair=keypair,
        audience="bytebank",
    )
    print("Verified:", result.verified)
```

## Async Client

```python
from descript import AsyncDescriptClient

async with AsyncDescriptClient(base_url="http://localhost:8000", api_key="dsc_live_...") as client:
    agent, keypair = await client.agents.create_with_generated_key(
        name="Async Worker",
        byte_network="kiroween",
    )
    verified = await client.verify.verify_bytecript(agent.bytecript)
    print(verified.verified)
```

## CLI Helpers

```bash
descript keygen --out agent.pem
descript lookup agent_01... --base-url http://localhost:8000
```
