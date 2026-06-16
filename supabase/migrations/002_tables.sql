-- Migration 002: Core Tables
-- Applied in dependency order: tenancy/menu → sessions/ordering → staff → analytics

-- ─── 2.1 Tenancy & Menu ───────────────────────────────────────────────────────

create table public.restaurants (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  venue_type                text not null check (venue_type in ('restaurant','cafe','cafeteria','food_court_stall','qsr')),
  region                    text not null,
  currency                  text not null,
  locale                    text not null default 'en-US',
  vat_rate                  numeric(5,2) not null default 0,
  service_charge_rate       numeric(5,2) not null default 0,
  bill_disclaimer_text      text not null default 'Estimated total only. Final bill may vary due to VAT, service charges, municipality fees, discounts, promotions, or restaurant-specific charges. Please refer to the final bill issued by the restaurant.',
  session_expiry_minutes    integer not null default 180 check (session_expiry_minutes between 30 and 480),
  group_ordering_enabled    boolean not null default true,
  split_billing_enabled     boolean not null default false,
  ordering_channels         jsonb not null default '{"dine_in": true, "whatsapp_delivery_takeaway": false, "preorder_pickup": false, "platform_delivery": false}',
  whatsapp_number           text,
  latitude                  double precision,
  longitude                 double precision,
  region_lock_radius_meters integer not null default 150 check (region_lock_radius_meters > 0),
  delivery_qr_token         text unique,
  subscription_status       text not null default 'trial' check (subscription_status in ('trial','active','past_due','suspended','cancelled')),
  trial_ends_at             timestamptz,
  feature_flags             jsonb not null default '{"video_menus": true, "analytics": true, "whatsapp_ordering": false, "ai_recommendations": true, "region_lock": true}',
  maintenance_mode          boolean not null default false,
  branding                  jsonb not null default '{}',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.tables (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label         text not null,
  qr_token      text not null unique,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_tables_restaurant on public.tables(restaurant_id);

create table public.menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_menu_categories_restaurant on public.menu_categories(restaurant_id);

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id   uuid not null references public.menu_categories(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(10,2) not null check (price >= 0),
  dietary_tags  text[] not null default '{}',
  video_url     text,
  video_source  text check (video_source in ('uploaded','stock_library')),
  thumbnail_url text,
  is_available  boolean not null default true,
  display_order integer not null default 0,
  source        text not null default 'manual' check (source in ('manual','menu_import')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_menu_items_restaurant on public.menu_items(restaurant_id);
create index idx_menu_items_category on public.menu_items(category_id);

-- ─── 2.2 Sessions & Ordering ─────────────────────────────────────────────────

create table public.groups (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id      uuid not null references public.tables(id) on delete cascade,
  status        text not null default 'active' check (status in ('active','closed')),
  created_at    timestamptz not null default now()
);
create index idx_groups_table on public.groups(table_id);

create table public.sessions (
  id                  uuid primary key references auth.users(id) on delete cascade,
  restaurant_id       uuid not null references public.restaurants(id) on delete cascade,
  table_id            uuid references public.tables(id) on delete set null,
  group_id            uuid references public.groups(id) on delete set null,
  channel             text not null default 'dine_in' check (channel in ('dine_in','whatsapp_delivery_takeaway')),
  customer_name       text,
  customer_contact    text,
  region_check_status text check (region_check_status in ('in_range','out_of_range','undetermined')),
  status              text not null default 'active' check (status in ('active','expired','closed')),
  expires_at          timestamptz not null,
  created_at          timestamptz not null default now(),
  last_active_at      timestamptz not null default now()
);
create index idx_sessions_restaurant on public.sessions(restaurant_id);
create index idx_sessions_table on public.sessions(table_id);
create index idx_sessions_group on public.sessions(group_id);

create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  restaurant_id               uuid not null references public.restaurants(id) on delete cascade,
  table_id                    uuid references public.tables(id) on delete set null,
  session_id                  uuid not null references public.sessions(id) on delete cascade,
  group_id                    uuid references public.groups(id) on delete set null,
  channel                     text not null check (channel in ('dine_in','whatsapp_delivery_takeaway')),
  fulfillment_type            text check (fulfillment_type in ('delivery','takeaway')),
  delivery_address            text,
  status                      text not null default 'pending' check (status in ('pending','preparing','ready','delivered')),
  subtotal                    numeric(10,2) not null default 0,
  vat_rate_snapshot           numeric(5,2) not null default 0,
  service_charge_rate_snapshot numeric(5,2) not null default 0,
  vat_amount                  numeric(10,2) not null default 0,
  service_amount              numeric(10,2) not null default 0,
  estimated_total             numeric(10,2) not null default 0,
  idempotency_key             uuid not null,
  status_history              jsonb not null default '[]',
  submitted_at                timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (session_id, idempotency_key)
);
create index idx_orders_restaurant on public.orders(restaurant_id);
create index idx_orders_table on public.orders(table_id);
create index idx_orders_session on public.orders(session_id);
create index idx_orders_group on public.orders(group_id);

create table public.order_items (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references public.orders(id) on delete cascade,
  menu_item_id         uuid not null references public.menu_items(id),
  item_name_snapshot   text not null,
  price_snapshot       numeric(10,2) not null,
  quantity             integer not null check (quantity > 0),
  notes                text,
  contributor_session_id uuid references public.sessions(id) on delete set null,
  is_removed           boolean not null default false,
  edit_history         jsonb not null default '[]'
);
create index idx_order_items_order on public.order_items(order_id);

create table public.requests (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references public.restaurants(id) on delete cascade,
  table_id        uuid not null references public.tables(id) on delete cascade,
  session_id      uuid not null references public.sessions(id) on delete cascade,
  request_type    text not null check (request_type in ('waiter','bill')),
  scope           text check (scope in ('own','group')),
  requested_at    timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index idx_requests_restaurant on public.requests(restaurant_id);
create index idx_requests_table on public.requests(table_id);

-- ─── 2.3 Staff & Platform ────────────────────────────────────────────────────

create table public.staff_users (
  id            uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  name          text not null,
  email         text not null,
  role          text not null check (role in ('owner','manager','kitchen_staff','floor_staff','platform_admin')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz,
  constraint chk_admin_no_restaurant check (
    (role = 'platform_admin' and restaurant_id is null)
    or (role <> 'platform_admin' and restaurant_id is not null)
  )
);
create index idx_staff_users_restaurant on public.staff_users(restaurant_id);

create table public.admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null references public.staff_users(id),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  action        text not null,
  details       jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index idx_admin_audit_restaurant on public.admin_audit_log(restaurant_id);

-- ─── 2.4 Analytics & AI ──────────────────────────────────────────────────────

create table public.video_analytics_events (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id  uuid not null references public.menu_items(id) on delete cascade,
  session_id    uuid references public.sessions(id) on delete set null,
  event_type    text not null check (event_type in ('video_view','add_to_cart','order_placed')),
  occurred_at   timestamptz not null default now()
);
create index idx_video_events_restaurant on public.video_analytics_events(restaurant_id);
create index idx_video_events_item on public.video_analytics_events(menu_item_id);

create table public.recommendation_events (
  id                   uuid primary key default gen_random_uuid(),
  restaurant_id        uuid not null references public.restaurants(id) on delete cascade,
  session_id           uuid references public.sessions(id) on delete set null,
  placement            text not null check (placement in ('most_popular','cart_cross_sell')),
  source_item_ids      uuid[] not null default '{}',
  recommended_item_ids uuid[] not null default '{}',
  event_type           text not null check (event_type in ('shown','item_tapped','added_to_cart')),
  occurred_at          timestamptz not null default now()
);
create index idx_recommendation_events_restaurant on public.recommendation_events(restaurant_id);

create table public.recommendation_cache (
  id                   uuid primary key default gen_random_uuid(),
  restaurant_id        uuid not null references public.restaurants(id) on delete cascade,
  placement            text not null check (placement in ('most_popular','cart_cross_sell')),
  cache_key            text not null,
  recommended_item_ids uuid[] not null default '{}',
  generated_at         timestamptz not null default now(),
  expires_at           timestamptz not null,
  unique (restaurant_id, placement, cache_key)
);
create index idx_recommendation_cache_lookup on public.recommendation_cache(restaurant_id, placement, cache_key);

create table public.menu_import_jobs (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid not null references public.restaurants(id) on delete cascade,
  uploaded_file_path text not null,
  status            text not null default 'processing' check (status in ('processing','ready_for_review','confirmed','failed')),
  extracted_items   jsonb not null default '[]',
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_menu_import_restaurant on public.menu_import_jobs(restaurant_id);
