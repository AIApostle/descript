# Render Deployment Guide & Neon Configuration

This guide provides the exact configuration and environment variables needed to deploy the **Descript Platform API** to Render with **Neon PostgreSQL** and **Neon Managed Auth**.

**Production Service URL:** `https://descript-ffch.onrender.com`

---

## 1. Render Service Settings

In your [Render Dashboard](https://dashboard.render.com/) under your Web Service settings:

| Setting | Value |
| :--- | :--- |
| **Runtime** | `Python` |
| **Python Version** | `3.11` (Pinned via `.python-version` and `backend/.python-version`) |
| **Root Directory** | `backend` |
| **Build Command** | `uv sync` |
| **Start Command** | `uv run uvicorn main:app --host 0.0.0.0 --port $PORT` |

---

## 2. Environment Variables (Neon & Secrets)

Add these keys in **Render Dashboard -> Environment**:

```env
# Database Connections (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_8NYESDU4bsFo@ep-ancient-pond-bjrvhg79-pooler.c-3.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_8NYESDU4bsFo@ep-ancient-pond-bjrvhg79.c-3.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# Neon Project & Branch Metadata
NEON_BRANCH=production
NEON_BRANCH_ID=br-curly-dawn-bjt2e4mb
NEON_FUNCTION_HOST_SUFFIX=.compute.c-3.eu-west-2.aws.neon.tech

# Neon Managed Authentication & JWKS
NEON_AUTH_BASE_URL=https://ep-ancient-pond-bjrvhg79.neonauth.c-3.eu-west-2.aws.neon.tech/neondb/auth
NEON_AUTH_JWKS_URL=https://ep-ancient-pond-bjrvhg79.neonauth.c-3.eu-west-2.aws.neon.tech/neondb/auth/.well-known/jwks.json

# Controller Session Signing
JWT_SECRET=dsc_prod_jwt_secret_98335924_withered_dawn_31704350

# Security & CORS
ENVIRONMENT=production
CORS_ORIGINS=https://descript-ffch.onrender.com,http://localhost:5173
```

---

## 3. Key Details & Architecture

### Database Connections
- **`DATABASE_URL`**: Routes traffic through Neon's connection pooler (`-pooler.c-3.eu-west-2.aws.neon.tech`). Used for low-latency web request handling.
- **`DATABASE_URL_UNPOOLED`**: Bypasses the pooler to connect directly to the compute endpoint. Used by Descript for DDL schema updates and migrations in `db/`.

### Python 3.12 Compatibility
- `pyproject.toml` has been configured with `requires-python = ">=3.11"` to prevent Render's `No interpreter found for Python 3.14` error.
- Render automatically reads `.python-version` (set to `3.12`) to select its preinstalled Python 3.12 runtime.

### Entry Point (`main:app`)
Both the repository root (`/main.py`) and backend directory (`backend/main.py`) include bridge entry points that re-export `app` from `backend.main:app`. This allows `uvicorn main:app` to work seamlessly.

---

## 4. Post-Deploy Health Check Verification

Once the service finishes building and deploying on Render, verify live connectivity:

```bash
# Check service and Neon PostgreSQL connectivity
curl -i https://descript-ffch.onrender.com/health

# Check versioned API health
curl -i https://descript-ffch.onrender.com/api/v1/health
```

Expected response (`HTTP 200 OK`):
```json
{
  "status": "ok",
  "service": "descript-api",
  "version": "0.1.0",
  "environment": "production",
  "database": "postgres",
  "databaseConnected": true,
  "latencyMs": 4.85,
  "timestamp": "2026-11-27T12:00:00.000000Z",
  "detail": null
}
```
