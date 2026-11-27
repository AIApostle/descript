-- 009: Create composite indexes for high-throughput query optimization
CREATE INDEX IF NOT EXISTS idx_agents_network_status ON public.agents(byte_network, status);
CREATE INDEX IF NOT EXISTS idx_credentials_agent_status ON public.credentials(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.auth_challenges(agent_id, expires_at) WHERE used_at IS NULL;
