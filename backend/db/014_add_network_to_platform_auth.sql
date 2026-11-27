-- 014: Add byte_network to platform_auth_sessions for network-scoped code verification
ALTER TABLE public.platform_auth_sessions 
ADD COLUMN IF NOT EXISTS byte_network VARCHAR(64) REFERENCES public.byte_networks(slug) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_platform_auth_network ON public.platform_auth_sessions(byte_network);
