-- 004: Create agents table for persistent canonical agent identities
CREATE TABLE IF NOT EXISTS public.agents (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    byte_network VARCHAR(64) NOT NULL REFERENCES public.byte_networks(slug) ON DELETE RESTRICT,
    residence VARCHAR(128) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    agent_type VARCHAR(64),
    framework VARCHAR(64),
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    public_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    bytecript_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_agents_owner_name UNIQUE (owner_id, name)
);

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64);
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS public_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS bytecript_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON public.agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_network ON public.agents(byte_network);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS ix_agents_owner_status ON public.agents(owner_id, status);
