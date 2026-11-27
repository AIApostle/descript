-- 010: Integrate with Neon Auth schema
-- Bridges neon_auth.user with public.users when Neon Auth is used as IdP
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'neon_auth' AND table_name = 'user') THEN
        CREATE OR REPLACE VIEW public.v_neon_auth_controllers AS
        SELECT
            u.id AS auth_user_id,
            u.email,
            u.name,
            u."createdAt" AS auth_created_at,
            c.id AS descript_user_id,
            c.organization
        FROM neon_auth.user u
        LEFT JOIN public.users c ON lower(u.email) = lower(c.email);
    END IF;
END $$;
