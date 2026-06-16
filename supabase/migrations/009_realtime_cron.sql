-- Migration 009: Realtime Publications & pg_cron Scheduled Jobs

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable postgres_changes on the tables that drive live updates.
-- RLS SELECT policies (004_rls.sql) ensure subscribers only receive their own rows.

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.requests;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.groups;

-- ─── pg_cron ─────────────────────────────────────────────────────────────────
-- Functions defined in 006_rpcs.sql (Section 6.5).

-- Every 15 minutes: mark sessions past their expiry timestamp as 'expired'
select cron.schedule(
  'expire-stale-sessions',
  '*/15 * * * *',
  $$ select public.expire_stale_sessions(); $$
);

-- Hourly: purge expired Gemini recommendation cache entries
select cron.schedule(
  'cleanup-recommendation-cache',
  '0 * * * *',
  $$ select public.cleanup_recommendation_cache(); $$
);
