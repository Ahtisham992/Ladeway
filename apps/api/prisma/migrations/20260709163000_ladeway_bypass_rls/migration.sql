-- PrismaService.$system is used throughout the app to intentionally bypass RLS
-- (registration, public endpoints, cron jobs) by querying directly as the
-- connection's login role instead of switching to "authenticated". Because the
-- RLS migration used FORCE ROW LEVEL SECURITY, even the table owner is blocked
-- without BYPASSRLS. Tenant-scoped queries are unaffected: they explicitly
-- SET LOCAL ROLE authenticated first, and that role has no BYPASSRLS.
ALTER ROLE ladeway BYPASSRLS;
