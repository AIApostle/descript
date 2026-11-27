-- 012: Align column nullability with SQLAlchemy models and relax legacy constraints
-- Relaxes constraints on legacy columns from initial migrations so ORM inserts succeed

-- agents: agent_type, framework, user_id, and bytecript_payload are optional in the domain model
ALTER TABLE public.agents ALTER COLUMN agent_type DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN framework DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.agents ALTER COLUMN bytecript_payload DROP NOT NULL;

-- credentials: label and revocation reasons are optional
ALTER TABLE public.credentials ALTER COLUMN label DROP NOT NULL;
ALTER TABLE public.credentials ALTER COLUMN revoked_reason DROP NOT NULL;
ALTER TABLE public.credentials ALTER COLUMN revocation_reason DROP NOT NULL;

-- audit_events: legacy columns (actor, details, timestamp) must be nullable
ALTER TABLE public.audit_events ALTER COLUMN actor DROP NOT NULL;
ALTER TABLE public.audit_events ALTER COLUMN details DROP NOT NULL;
ALTER TABLE public.audit_events ALTER COLUMN timestamp DROP NOT NULL;

-- auth_challenges: audience and verified_at are optional
ALTER TABLE public.auth_challenges ALTER COLUMN audience DROP NOT NULL;
ALTER TABLE public.auth_challenges ALTER COLUMN verified_at DROP NOT NULL;
