-- Northline uses server-side Prisma with direct Postgres connections for the
-- current rebuild preview. Do not expose application tables through Supabase's
-- auto-generated Data API unless a future migration adds explicit grants and
-- tenant-scoped RLS policies for a specific table.

do $$
declare
  app_table text;
begin
  foreach app_table in array array[
    'Organization',
    'User',
    'Session',
    'PasswordResetToken',
    'OnboardingState',
    'BusinessProfile',
    'Channel',
    'Lead',
    'Conversation',
    'Message',
    'ContactIdentity',
    'ChannelEvent',
    'OutboundMessageAttempt',
    'KnowledgeSource',
    'BusinessContextItem',
    'BusinessContextRevision',
    'BusinessKnowledgeChunk',
    'KnowledgeIndexJob',
    'QualificationPlaybook',
    'QualificationQuestion',
    'QualificationAnswer',
    'BookingSettings',
    'MeetingType',
    'AvailabilityWindow',
    'BookingBlackout',
    'BookingRequest',
    'BookingEvent',
    'Handoff',
    'HandoffEvent',
    'IntegrationEvent',
    'OutboundDestination',
    'LeadExport',
    'ExportDeliveryAttempt',
    'AuditLog'
  ]
  loop
    execute format(
      'revoke all privileges on table public.%I from anon, authenticated, service_role',
      app_table
    );
    execute format('alter table public.%I enable row level security', app_table);
  end loop;
end $$;

revoke all privileges on table public."_prisma_migrations" from anon, authenticated, service_role;
revoke all privileges on all sequences in schema public from anon, authenticated, service_role;
revoke all privileges on all functions in schema public from anon, authenticated, service_role;

alter default privileges in schema public
  revoke all privileges on tables from anon, authenticated, service_role;

alter default privileges in schema public
  revoke all privileges on sequences from anon, authenticated, service_role;

alter default privileges in schema public
  revoke all privileges on functions from anon, authenticated, service_role;
