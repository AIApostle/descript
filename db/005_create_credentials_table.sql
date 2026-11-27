-- 005: Create credentials table for Ed25519 public keys and fingerprints
CREATE TABLE IF NOT EXISTS public.credentials (
    id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    algorithm VARCHAR(16) NOT NULL DEFAULT 'ed25519',
    public_key TEXT NOT NULL,
    public_key_pem TEXT NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    label VARCHAR(128),
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT
);

ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS revocation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_credentials_agent_id ON public.credentials(agent_id);
CREATE INDEX IF NOT EXISTS idx_credentials_fingerprint ON public.credentials(fingerprint);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON public.credentials(status);
