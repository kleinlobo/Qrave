-- Migration 004: Row-Level Security Policies
-- Default-deny: enable RLS on every table first, then grant only what is needed.

alter table public.restaurants           enable row level security;
alter table public.tables                enable row level security;
alter table public.menu_categories       enable row level security;
alter table public.menu_items            enable row level security;
alter table public.groups                enable row level security;
alter table public.sessions              enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.requests              enable row level security;
alter table public.staff_users           enable row level security;
alter table public.admin_audit_log       enable row level security;
alter table public.video_analytics_events enable row level security;
alter table public.recommendation_events enable row level security;
alter table public.recommendation_cache  enable row level security;
alter table public.menu_import_jobs      enable row level security;

-- recommendation_cache and admin_audit_log intentionally have NO policies.
-- Only the service-role key (bypasses RLS) can access them.

-- ─── 4.1 restaurants ─────────────────────────────────────────────────────────

create policy "restaurants_select" on public.restaurants
  for select using (
    id = public.current_session_restaurant_id()
    or public.is_staff_for(id)
  );

create policy "restaurants_update_owner_manager" on public.restaurants
  for update
  using (public.is_manager_for(id))
  with check (public.is_manager_for(id));

-- ─── 4.2 tables ──────────────────────────────────────────────────────────────

create policy "tables_select" on public.tables
  for select using (
    id = (select table_id from public.sessions where id = auth.uid())
    or public.is_staff_for(restaurant_id)
  );

create policy "tables_manage" on public.tables
  for all
  using (public.is_manager_for(restaurant_id))
  with check (public.is_manager_for(restaurant_id));

-- ─── 4.3 menu_categories & menu_items ────────────────────────────────────────

create policy "menu_categories_select" on public.menu_categories
  for select using (
    restaurant_id = public.current_session_restaurant_id()
    or public.is_staff_for(restaurant_id)
  );

create policy "menu_categories_manage" on public.menu_categories
  for all
  using (public.is_manager_for(restaurant_id))
  with check (public.is_manager_for(restaurant_id));

create policy "menu_items_select" on public.menu_items
  for select using (
    restaurant_id = public.current_session_restaurant_id()
    or public.is_staff_for(restaurant_id)
  );

create policy "menu_items_manage" on public.menu_items
  for all
  using (public.is_manager_for(restaurant_id))
  with check (public.is_manager_for(restaurant_id));

-- ─── 4.4 groups ──────────────────────────────────────────────────────────────

create policy "groups_select" on public.groups
  for select using (
    id = (select group_id from public.sessions where id = auth.uid())
    or public.is_staff_for(restaurant_id)
  );

-- No INSERT/UPDATE policy: groups managed exclusively by join_group() RPC (SECURITY DEFINER).

-- ─── 4.5 sessions ────────────────────────────────────────────────────────────

create policy "sessions_select" on public.sessions
  for select using (
    id = auth.uid()
    or public.is_staff_for(restaurant_id)
  );

create policy "sessions_update_own" on public.sessions
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- No INSERT policy: bootstrap write uses service-role key in the Route Handler.
-- protect_session_columns trigger (005_triggers.sql) limits what the UPDATE policy allows.

-- ─── 4.6 orders & order_items ────────────────────────────────────────────────

create policy "orders_select" on public.orders
  for select using (
    session_id = auth.uid()
    or group_id = (select group_id from public.sessions where id = auth.uid())
    or public.is_staff_for(restaurant_id)
  );

create policy "orders_update_staff" on public.orders
  for update
  using (public.is_staff_for(restaurant_id))
  with check (public.is_staff_for(restaurant_id));

create policy "order_items_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.session_id = auth.uid()
          or o.group_id = (select group_id from public.sessions where id = auth.uid())
          or public.is_staff_for(o.restaurant_id)
        )
    )
  );

create policy "order_items_manage_staff" on public.order_items
  for all
  using (
    exists (select 1 from public.orders o
      where o.id = order_items.order_id and public.is_staff_for(o.restaurant_id))
  )
  with check (
    exists (select 1 from public.orders o
      where o.id = order_items.order_id and public.is_staff_for(o.restaurant_id))
  );

-- No customer INSERT: handled exclusively by submit_order() RPC.

-- ─── 4.7 requests ────────────────────────────────────────────────────────────

create policy "requests_select" on public.requests
  for select using (
    session_id = auth.uid()
    or public.is_staff_for(restaurant_id)
  );

create policy "requests_insert_own" on public.requests
  for insert with check (session_id = auth.uid());
-- set_request_context trigger populates restaurant_id/table_id and enforces region lock.

create policy "requests_update_staff" on public.requests
  for update
  using (public.is_staff_for(restaurant_id))
  with check (public.is_staff_for(restaurant_id));

-- ─── 4.8 staff_users ─────────────────────────────────────────────────────────

create policy "staff_users_select" on public.staff_users
  for select using (
    id = auth.uid()
    or public.is_manager_for(restaurant_id)
    or public.is_platform_admin()
  );

create policy "staff_users_update_self" on public.staff_users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "staff_users_update_owner" on public.staff_users
  for update
  using (
    public.current_staff_role() = 'owner'
    and restaurant_id = public.current_staff_restaurant_id()
  )
  with check (
    public.current_staff_role() = 'owner'
    and restaurant_id = public.current_staff_restaurant_id()
  );

-- ─── 4.9 video_analytics_events & recommendation_events ─────────────────────

create policy "video_events_insert" on public.video_analytics_events
  for insert with check (session_id = auth.uid() or session_id is null);

create policy "video_events_select_staff" on public.video_analytics_events
  for select using (public.is_staff_for(restaurant_id));

create policy "recommendation_events_insert" on public.recommendation_events
  for insert with check (session_id = auth.uid() or session_id is null);

create policy "recommendation_events_select_staff" on public.recommendation_events
  for select using (public.is_staff_for(restaurant_id));

-- ─── 4.10 menu_import_jobs ───────────────────────────────────────────────────

create policy "menu_import_jobs_manage" on public.menu_import_jobs
  for all
  using (public.is_manager_for(restaurant_id))
  with check (public.is_manager_for(restaurant_id));
