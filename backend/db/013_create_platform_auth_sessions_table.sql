-- 013: Create platform auth sessions table for external platform verification (OTP / code flow)
CREATE TABLE IF NOT EXISTS public.platform_auth_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_code VARCHAR(32) UNIQUE NOT NULL,
    platform_name VARCHAR(128) NOT NULL,
    platform_domain VARCHAR(128) NOT NULL,
    requested_scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    agent_id VARCHAR(64) REFERENCES public.agents(id) ON DELETE CASCADE,
    controller_id VARCHAR(64) REFERENCES public.users(id) ON DELETE SET NULL,
    credential_id VARCHAR(64),
    access_token VARCHAR(128) UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_auth_user_code ON public.platform_auth_sessions(user_code);
CREATE INDEX IF NOT EXISTS idx_platform_auth_domain ON public.platform_auth_sessions(platform_domain);
CREATE INDEX IF NOT EXISTS idx_platform_auth_agent_id ON public.platform_auth_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_platform_auth_status ON public.platform_auth_sessions(status);
