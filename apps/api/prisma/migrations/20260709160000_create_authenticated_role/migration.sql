-- Create the "authenticated" role used by PrismaService to scope queries under RLS.
-- The app connection role needs to be able to SET LOCAL ROLE authenticated, and
-- "authenticated" needs table privileges since RLS policies restrict rows, not
-- grant access by themselves.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

GRANT authenticated TO ladeway;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
