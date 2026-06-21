-- Migration 005: Triggers

-- ─── 5.1 set_updated_at (generic) ────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

create trigger trg_tables_updated_at
  before update on public.tables
  for each row execute function public.set_updated_at();

create trigger trg_menu_categories_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

create trigger trg_menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger trg_menu_import_jobs_updated_at
  before update on public.menu_import_jobs
  for each row execute function public.set_updated_at();

-- ─── 5.2 protect_admin_only_restaurant_columns ───────────────────────────────
-- Silently reverts subscription_status, trial_ends_at, and feature_flags
-- if the actor is not a platform_admin.

create or replace function public.protect_admin_only_restaurant_columns()
returns trigger language plpgsql as $$
begin
  if not public.is_platform_admin() then
    new.subscription_status := old.subscription_status;
    new.trial_ends_at       := old.trial_ends_at;
    new.feature_flags       := old.feature_flags;
    -- maintenance_mode, branding, delivery_qr_token remain owner/manager-editable
  end if;
  return new;
end;
$$;

create trigger trg_protect_restaurant_admin_columns
  before update on public.restaurants
  for each row execute function public.protect_admin_only_restaurant_columns();

-- ─── 5.3 protect_session_columns ─────────────────────────────────────────────
-- Allows customer to update customer_name/customer_contact (Lightweight Signup)
-- while preventing changes to sensitive session fields.
-- join_group() sets app.bypass_session_protection=on (transaction-local) before its UPDATE.

create or replace function public.protect_session_columns()
returns trigger language plpgsql as $$
begin
  -- Bypass: explicit override, or service-role (auth.uid() is null means no user context)
  if current_setting('app.bypass_session_protection', true) = 'on'
     or auth.uid() is null then
    new.last_active_at := now();
    return new;
  end if;

  if not (public.is_staff_for(new.restaurant_id) or public.is_platform_admin()) then
    new.restaurant_id       := old.restaurant_id;
    new.table_id            := old.table_id;
    new.group_id            := old.group_id;
    new.region_check_status := old.region_check_status;
    new.status              := old.status;
    new.expires_at          := old.expires_at;
    new.channel             := old.channel;
  end if;

  new.last_active_at := now();
  return new;
end;
$$;

create trigger trg_protect_session_columns
  before update on public.sessions
  for each row execute function public.protect_session_columns();

-- ─── 5.4 recalc_order_totals ─────────────────────────────────────────────────
-- Recomputes order totals whenever order_items rows change.
-- Always uses the snapshot VAT/service rates on the order itself.

create or replace function public.recalc_order_totals()
returns trigger language plpgsql as $$
declare
  v_order_id uuid := coalesce(new.order_id, old.order_id);
  v_subtotal numeric(10,2);
  v_vat_rate numeric(5,2);
  v_svc_rate numeric(5,2);
begin
  select coalesce(sum(price_snapshot * quantity), 0)
    into v_subtotal
    from public.order_items
   where order_id = v_order_id and is_removed = false;

  select vat_rate_snapshot, service_charge_rate_snapshot
    into v_vat_rate, v_svc_rate
    from public.orders
   where id = v_order_id;

  update public.orders
     set subtotal        = v_subtotal,
         vat_amount      = round(v_subtotal * v_vat_rate / 100, 2),
         service_amount  = round(v_subtotal * v_svc_rate / 100, 2),
         estimated_total = v_subtotal
                         + round(v_subtotal * v_vat_rate / 100, 2)
                         + round(v_subtotal * v_svc_rate / 100, 2),
         updated_at      = now()
   where id = v_order_id;

  return null;
end;
$$;

create trigger trg_recalc_order_totals
  after insert or update or delete on public.order_items
  for each row execute function public.recalc_order_totals();

-- ─── 5.5 set_request_context (+ server-side region lock) ─────────────────────
-- Derives restaurant_id/table_id from the session and enforces the region lock
-- server-side for dine-in sessions.

create or replace function public.set_request_context()
returns trigger language plpgsql as $$
declare
  v_session public.sessions%rowtype;
begin
  select * into v_session from public.sessions where id = new.session_id;

  if v_session.id is null then
    raise exception 'Invalid session';
  end if;

  new.restaurant_id := v_session.restaurant_id;
  new.table_id      := v_session.table_id;

  if v_session.channel = 'dine_in'
     and coalesce(v_session.region_check_status, 'undetermined') <> 'in_range' then
    raise exception 'Region lock: cannot place this request outside the restaurant';
  end if;

  return new;
end;
$$;

create trigger trg_set_request_context
  before insert on public.requests
  for each row execute function public.set_request_context();

-- ─── 5.6 protect_staff_role_column ───────────────────────────────────────────
-- Prevents role escalation and self-demotion.

create or replace function public.protect_staff_role_column()
returns trigger language plpgsql as $$
begin
  if new.id = auth.uid() then
    -- Cannot change own role, restaurant assignment, or active status
    new.role          := old.role;
    new.restaurant_id := old.restaurant_id;
    new.is_active     := old.is_active;
  elsif public.current_staff_role() <> 'owner' and not public.is_platform_admin() then
    new.role          := old.role;
    new.restaurant_id := old.restaurant_id;
  end if;
  return new;
end;
$$;

create trigger trg_protect_staff_role_column
  before update on public.staff_users
  for each row execute function public.protect_staff_role_column();

-- ─── 5.7 set_analytics_context ───────────────────────────────────────────────
-- Derives restaurant_id from session_id, rejects events for non-existent sessions.

create or replace function public.set_analytics_context()
returns trigger language plpgsql as $$
declare
  v_restaurant_id uuid;
begin
  if new.session_id is not null then
    select restaurant_id into v_restaurant_id
      from public.sessions where id = new.session_id;
    if v_restaurant_id is null then
      raise exception 'Invalid session';
    end if;
    new.restaurant_id := v_restaurant_id;
  elsif new.restaurant_id is null then
    raise exception 'restaurant_id required when session_id is null';
  end if;
  return new;
end;
$$;

create trigger trg_video_events_context
  before insert on public.video_analytics_events
  for each row execute function public.set_analytics_context();

create trigger trg_recommendation_events_context
  before insert on public.recommendation_events
  for each row execute function public.set_analytics_context();
