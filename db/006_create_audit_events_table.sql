-- 006: Create audit events table for immutable lifecycle event tracking
-- Existing table (from initial run) has: id, agent_id, event_type, actor, details, timestamp
-- We add the new columns the SQLAlchemy model expects and create the table if it doesn't exist

CREATE TABLE IF NOT EXISTS public.audit_events (
    id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    actor_type VARCHAR(32) NOT NULL DEFAULT 'controller',
    actor_id VARCHAR(64),
    event_type VARCHAR(64) NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent column additions for existing tables
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS actor_type VARCHAR(32) NOT NULL DEFAULT 'controller';
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS actor_id VARCHAR(64);
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_audit_events_agent_id ON public.audit_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON public.audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON public.audit_events(created_at);
