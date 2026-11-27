-- 015: Create netprints and agent messages tables
-- Netprints: Trace and log every agent activity across platforms/internet (footprints)
-- Agent Messages: Secure agent-to-agent messaging & communication hub

CREATE TABLE IF NOT EXISTS public.netprints (
    id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    platform_name VARCHAR(128) NOT NULL,
    platform_domain VARCHAR(128) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource VARCHAR(256),
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    security_level VARCHAR(32) NOT NULL DEFAULT 'standard',
    ip_address VARCHAR(64),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_netprints_agent_id ON public.netprints(agent_id);
CREATE INDEX IF NOT EXISTS idx_netprints_domain ON public.netprints(platform_domain);
CREATE INDEX IF NOT EXISTS idx_netprints_action ON public.netprints(action);
CREATE INDEX IF NOT EXISTS idx_netprints_created_at ON public.netprints(created_at);

CREATE TABLE IF NOT EXISTS public.agent_messages (
    id VARCHAR(64) PRIMARY KEY,
    sender_agent_id VARCHAR(64) NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    recipient_agent_id VARCHAR(64) NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    message_type VARCHAR(64) NOT NULL DEFAULT 'text',
    subject VARCHAR(256),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature VARCHAR(256) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'unread',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_sender ON public.agent_messages(sender_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON public.agent_messages(recipient_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status ON public.agent_messages(status);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON public.agent_messages(created_at);
