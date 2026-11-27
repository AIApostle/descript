-- 003: Create Byte Networks table for namespace governance
CREATE TABLE IF NOT EXISTS public.byte_networks (
    slug VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    residence_domain VARCHAR(128) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    issuer VARCHAR(128) NOT NULL DEFAULT 'Descript Root Authority',
    policy_summary TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.byte_networks ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.byte_networks ADD COLUMN IF NOT EXISTS issuer VARCHAR(128) NOT NULL DEFAULT 'Descript Root Authority';
ALTER TABLE public.byte_networks ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_byte_networks_slug ON public.byte_networks(slug);
