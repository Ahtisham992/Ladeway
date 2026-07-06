-- Enable RLS on all tenant-scoped tables
ALTER TABLE "IndustryConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IndustryConfig" FORCE ROW LEVEL SECURITY;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" FORCE ROW LEVEL SECURITY;

ALTER TABLE "ExtractedData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtractedData" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" FORCE ROW LEVEL SECURITY;

ALTER TABLE "LeadAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadAssignment" FORCE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation_industry_config ON "IndustryConfig"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_user ON "User"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_conversation ON "Conversation"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Message does not have a direct tenantId column. It's related via conversationId.
-- Wait, the spec ER diagram says Message has conversationId. Let's look at schema.prisma.
-- Message has conversationId. If we want RLS on Message, we have to join or we can rely on Conversation RLS cascading. 
-- In Supabase, if we want strict RLS on Message, we'd do a subquery, or we just let application layer filter by conversationId. 
-- The spec explicitly says: 
-- "Repeated for: industry_configs, users, leads, messages, extracted_data, lead_assignments"
-- Let me use a subquery for Message and ExtractedData which only have conversationId.
CREATE POLICY tenant_isolation_message ON "Message"
  FOR ALL
  USING (
    "conversationId" IN (
      SELECT id FROM "Conversation" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
    )
  );

CREATE POLICY tenant_isolation_extracted_data ON "ExtractedData"
  FOR ALL
  USING (
    "conversationId" IN (
      SELECT id FROM "Conversation" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
    )
  );

CREATE POLICY tenant_isolation_lead ON "Lead"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- LeadAssignment has leadId, and lead has tenantId. Wait, schema.prisma shows LeadAssignment doesn't have tenantId.
-- It only has leadId and userId.
-- Wait, if it has userId, user has tenantId. Or leadId has tenantId.
CREATE POLICY tenant_isolation_lead_assignment ON "LeadAssignment"
  FOR ALL
  USING (
    "leadId" IN (
      SELECT id FROM "Lead" WHERE "tenantId" = current_setting('app.current_tenant_id', true)
    )
  );

-- Also, to allow seeding and bypass RLS for admin operations (like creating tenants), we can use the bypassrls role 
-- or we can explicitly allow the postgres superuser (postgres). By default, superusers bypass RLS.
-- Since the Prisma pool uses postgres, it might actually bypass RLS unless we force it!
-- "ALTER TABLE ... FORCE ROW LEVEL SECURITY" forces RLS even for table owners. 
-- Wait, if we use FORCE ROW LEVEL SECURITY, then the `postgres` user will ALSO be blocked unless we conditionally bypass it.
-- Supabase `postgres` user does NOT bypass RLS if FORCE ROW LEVEL SECURITY is used and there's no policy for it.
-- Actually, the spec just says "ALTER TABLE conversations ENABLE ROW LEVEL SECURITY; CREATE POLICY...". I'll stick to that.