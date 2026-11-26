# Descript — AI Agent Identity Platform & Python SDK

**"Identity for AI agents, like Gmail is identity for humans — universal, portable, and standards-based."**

**Descript** is both a web identity platform and a Python SDK for autonomous AI agents. Instead of each service inventing fragile, siloed agent records or shared API secrets, Descript gives every agent:

- A **globally unique, persistent Agent ID** (`agent_...`) that survives model swaps, deployments, and key rotations
- **Zero-custody Ed25519 credentials** (private keys are generated locally in Python or in the browser and never stored on Descript servers)
- A signed **Bytecript** digital identity card containing the agent's network residence, public key fingerprints (`SHA-256`), status, and Descript issuer signature
- **Full credential lifecycle & auditability** (add keys, rotate keys with transition overlap, suspend, reactivate, or permanently revoke)
- **Challenge-response authentication** so external services (such as Bytebank, marketplaces, or partner APIs) can verify an agent's identity in real time

---

## How Descript Works

```
┌────────────────────────────┐         ┌──────────────────────────────────────┐
│   Descript Web Platform    │         │       Descript Backend API           │
│  (React 19 + TypeScript)   │◄──REST─►│   (FastAPI + SQLAlchemy + Alembic)   │
│                            │         │                  │                   │
│ • Register Agents          │         │                  ▼                   │
│ • Client-side Ed25519      │         │     Neon Serverless PostgreSQL       │
│ • Bytecript Card & QR      │         │  (users, agents, credentials,        │
│ • Key Rotation & Audit Log │         │   byte_networks, api_keys,           │
│ • Public Agent Resolver    │         │   audit_events, auth_challenges)     │
└────────────────────────────┘         └──────────────────▲───────────────────┘
                                                          │
                     ┌────────────────────────────────────┴───────────────────┐
                     │                                                        │
        ┌────────────▼──────────────┐                            ┌────────────▼──────────────┐
        │   Developer / Agent App   │                            │  External Service         │
        │  (Descript Python SDK)    │◄──Challenge & Signature───►│  (e.g. Bytebank API)      │
        │                           │                            │                           │
        │ • KeyPair.generate()      │                            │ • Resolve /public/agents  │
        │ • Register & Rotate Keys  │                            │ • Verify Bytecript Card   │
        │ • Sign Challenges Locally │                            │ • Issue & Verify Nonces   │
        └───────────────────────────┘                            └───────────────────────────┘
```

### End-to-End Lifecycle

1. **Register & Bind Key:** A developer (via the Web UI or Python SDK) registers an agent inside a **Byte Network** (e.g. `kiroween`, `partner-network`, `open-agent-grid`) and submits only its Ed25519 **public key**.
2. **Issue Bytecript:** Descript assigns a permanent `agent_...` ID, records the SHA-256 fingerprint, signs a deterministic **Bytecript** verifiable card using the platform's Ed25519 issuer key, and logs the event.
3. **Authenticate to External Services:** When the agent connects to a service like **Bytebank**, the service fetches the agent's public profile (`GET /api/v1/public/agents/{agent_id}`), verifies its status is `active` and its Bytecript signature is valid, issues a single-use challenge nonce (`POST /api/v1/challenges`), and verifies the agent's Ed25519 signature (`POST /api/v1/challenges/verify`).
4. **Rotate or Revoke Anytime:** Keys can be rotated seamlessly (`deactivateExisting=true`) or immediately revoked; suspended/revoked agents fail all subsequent authentication checks.

---

## Repository Structure

| Directory | Description |
| :--- | :--- |
| `backend/` | FastAPI + SQLAlchemy 2.0 (async) + Alembic REST API backed by **Neon PostgreSQL** (`psycopg[binary,pool]`) |
| `sdk/` | Official **Python SDK** (`descript`) with `DescriptClient`, `AsyncDescriptClient`, `KeyPair`, offline/online verification, and `descript` CLI |
| `public/app/` | React 19 + TypeScript + Vite + Tailwind CSS v4 frontend platform |

---

## Can Developers Download the Python SDK Into Their Applications?

**Yes.** The Python SDK lives in `sdk/` as a standard PEP 621 / `uv_build` package named **`descript`**. Depending on where you host the repository, developers can install it into any Python 3.11+ application in three ways:

### Option A: Build & Install Locally (Available Immediately)
Build the `.whl` / `.tar.gz` package from `sdk/` and install it into any other Python app or virtual environment:

```bash
# 1. Build distributable wheel & source archive inside sdk/
cd sdk
uv build
# Outputs: sdk/dist/descript-0.1.0-py3-none-any.whl and sdk/dist/descript-0.1.0.tar.gz

# 2. In another developer's application:
pip install /path/to/descript/sdk/dist/descript-0.1.0-py3-none-any.whl
# OR with uv:
uv add /path/to/descript/sdk/dist/descript-0.1.0-py3-none-any.whl
# OR editable during active local development:
uv add --editable /path/to/descript/sdk
```

### Option B: Install Directly from Git / GitHub
Once this repository is pushed to GitHub (or any Git host), developers can install the `sdk/` subdirectory without cloning manually:

```bash
pip install "descript @ git+https://github.com/<your-org>/descript.git#subdirectory=sdk"
# OR with uv:
uv add "descript @ git+https://github.com/<your-org>/descript.git#subdirectory=sdk"
```

### Option C: Publish to PyPI (`pip install descript`)
The `sdk/pyproject.toml` is already configured with package metadata (`name = "descript"`, `version = "0.1.0"`, dependencies, classifiers, and CLI entrypoint). When you are ready for public `pip install descript` / `uv add descript`:

```bash
cd sdk
uv build
uv publish --token "$PYPI_API_TOKEN"
```

---

## Quick Start: Using the Python SDK

### 1. Check API & Database Health

```python
from descript import DescriptClient

with DescriptClient(base_url="http://localhost:8000") as client:
    status = client.health()
    print(status.status, status.database, status.databaseConnected, status.latencyMs)
```

### 2. Generate Keys, Register an Agent & Authenticate

```python
from descript import DescriptClient, KeyPair, verify_bytecript_signature

# Generate an Ed25519 keypair locally (private key never leaves your app)
keypair = KeyPair.generate()
keypair.save_pem("agent_key.pem")  # saved with chmod 600

# Create an API key in the Descript UI under /developers, then connect:
with DescriptClient(base_url="http://localhost:8000", api_key="dsc_live_...") as client:
    agent = client.agents.create(
        name="Ledger Sentinel",
        description="Autonomous invoice reconciliation agent",
        byte_network="kiroween",
        public_key=keypair.public_key_b64,
        capabilities=["reconcile", "sign"],
    )
    print("Assigned Agent ID:", agent.id)
    print("Fingerprint:", agent.credentials[0].formatted_fingerprint)

    # Verify the signed Bytecript card offline
    assert agent.bytecript is not None
    assert verify_bytecript_signature(agent.bytecript)

    # Authenticate against a service (e.g. Bytebank) via single-use challenge-response
    auth_result = client.verify.authenticate_with_keypair(
        agent_id=agent.id,
        keypair=keypair,
        audience="bytebank",
    )
    assert auth_result.verified is True
```

### 3. Async Client (`AsyncDescriptClient`)

```python
from descript import AsyncDescriptClient

async with AsyncDescriptClient(base_url="http://localhost:8000", api_key="dsc_live_...") as client:
    health = await client.health()
    agent, keypair = await client.agents.create_with_generated_key(
        name="Async Worker",
        byte_network="kiroween",
    )
    cred2, new_keypair = await client.credentials.rotate_with_generated_key(agent.id)
```

### 4. CLI Tools Included in `descript`

```bash
descript health --base-url http://localhost:8000
descript keygen --out agent.pem
descript lookup agent_01... --base-url http://localhost:8000
descript verify-bytecript bytecript-ledger-sentinel.json
```

---

## Running the Platform Locally (Neon + FastAPI + React)

### 1. Backend API (`backend/`) with Neon PostgreSQL

```bash
cd backend
cp .env.example .env
# Edit .env and set your Neon PostgreSQL connection string:
# DATABASE_URL=postgresql://neondb_owner:...@ep-....aws.neon.tech/neondb?sslmode=require

uv sync
uv run alembic upgrade head   # applies schema migrations to Neon
uv run descript-migrate       # ensures schema + seeds default Byte Networks
uv run descript-api           # starts FastAPI on http://localhost:8000
```

> If `DATABASE_URL` is omitted in local development, the backend defaults to `sqlite+aiosqlite:///./descript_dev.db` so you can still test without a remote DB.

Verify the backend health endpoint:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/health
```

Both endpoints execute a `SELECT 1` ping against the configured database and return HTTP `200` (`status: "ok"`) when connected or HTTP `503` (`status: "degraded"`) if the database is unreachable.

### 2. Frontend Platform (`public/app/`)

```bash
cd public/app
npm install
npm run dev       # starts Vite on http://localhost:5173 (proxies /api -> http://127.0.0.1:8000)
```

---

## Key API Endpoints

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/health`, `/api/v1/health` | Service + Neon PostgreSQL database health & latency |
| `POST` | `/api/v1/auth/signup`, `/login`, `/refresh` | Controller authentication & JWT issuance |
| `GET` | `/api/v1/networks` | List available Byte Networks |
| `POST` | `/api/v1/agents`, `/agents/bulk` | Register one or more agents and issue Bytecripts |
| `GET/PATCH` | `/api/v1/agents/{id}`, `/status` | Manage agent metadata and lifecycle (`active`, `suspended`, `revoked`, `compromised`) |
| `GET/POST` | `/api/v1/agents/{id}/credentials` | List, add, or rotate Ed25519 public keys |
| `POST` | `/api/v1/credentials/{id}/revoke` | Permanently revoke a credential |
| `GET` | `/api/v1/agents/{id}/audit` | Retrieve immutable agent audit timeline |
| `GET` | `/api/v1/public/agents/{id}` | Public unauthenticated agent & Bytecript lookup |
| `POST` | `/api/v1/challenges`, `/challenges/verify` | Challenge-response authentication for relying services |
| `POST` | `/api/v1/verify`, `/verify/bytecript` | Stateless message & Bytecript signature verification |
| `GET/POST/DELETE` | `/api/v1/api-keys` | Manage Developer API keys (`dsc_live_...`) for the Python SDK |

---

## Running Tests & Checks

```bash
# Backend tests + linter
cd backend && uv run pytest -v && uv run ruff check src tests

# Python SDK tests + linter + wheel build
cd sdk && uv run --with-editable ../backend --with aiosqlite pytest -v && uv run ruff check src tests && uv build

# Frontend build, lint, and tests
cd public/app && npm run build && npm run lint && npm test
```
