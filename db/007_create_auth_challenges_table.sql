-- 007: Create auth challenges table for nonce challenge-response authentication
CREATE TABLE IF NOT EXISTS public.auth_challenges (
    id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    nonce VARCHAR(128) UNIQUE NOT NULL,
    audience VARCHAR(128),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.auth_challenges ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_auth_challenges_agent_id ON public.auth_challenges(agent_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_nonce ON public.auth_challenges(nonce);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires ON public.auth_challenges(expires_at);
