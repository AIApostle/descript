-- 008: Seed initial Byte Networks
-- byte_networks uses slug as the primary key per SQLAlchemy model (ByteNetwork.__tablename__ with slug PK)
-- The id column exists in the live table from a prior migration; we include it via gen_random_uuid()

INSERT INTO public.byte_networks (id, slug, name, residence_domain, description, issuer, policy_summary, is_public, created_at, updated_at)
VALUES
    (
        gen_random_uuid()::varchar,
        'kiroween',
        'Kiroween Network',
        'kiroween-residence',
        'Primary production identity namespace for autonomous AI agents and service integrations.',
        'Descript Root Authority',
        'Ed25519 asymmetric credentials required. Instant revocation and challenge-response verification.',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::varchar,
        'partner-network',
        'Partner Network',
        'partner-residence',
        'Federated namespace for B2B service integrators, financial tools, and verified partner runtimes.',
        'Descript Partner Authority',
        'Controller verification required; supports multi-credential rotation and strict audit logging.',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::varchar,
        'open-agent-grid',
        'Open Agent Grid',
        'open-grid-residence',
        'Open sandbox and experimental namespace for developer agents, testing, and multi-agent workflows.',
        'Descript Community Authority',
        'Open registration with standard Ed25519 key binding and public Bytecript resolution.',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    residence_domain = EXCLUDED.residence_domain,
    description = EXCLUDED.description,
    issuer = EXCLUDED.issuer,
    policy_summary = EXCLUDED.policy_summary,
    is_public = EXCLUDED.is_public,
    updated_at = CURRENT_TIMESTAMP;
