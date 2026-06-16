-- Migration 006: RPC Functions (Business Logic)
-- All SECURITY DEFINER — called via supabase.rpc() from client or Route Handlers.

-- ─── 6.1 submit_order ────────────────────────────────────────────────────────

create or replace function public.submit_order(
  p_items            jsonb,    -- [{ "menu_item_id": uuid, "quantity": int, "notes": text }]
  p_idempotency_key  uuid,
  p_fulfillment_type text default null,  -- 'delivery' | 'takeaway' (whatsapp channel only)
  p_delivery_address text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_session    public.sessions%rowtype;
  v_order_id   uuid;
  v_item       jsonb;
  v_menu_item  public.menu_items%rowtype;
  v_restaurant public.restaurants%rowtype;
begin
  select * into v_session from public.sessions where id = auth.uid();

  if v_session.id is null then
    raise exception 'No active session';
  end if;

  if v_session.status <> 'active' or v_session.expires_at < now() then
    raise exception 'Session expired';
  end if;

  if v_session.channel = 'dine_in'
     and coalesce(v_session.region_check_status, 'undetermined') <> 'in_range' then
    raise exception 'Region lock: cannot place an order outside the restaurant';
  end if;

  -- Idempotency: return existing order if key already used
  select id into v_order_id
    from public.orders
   where session_id = v_session.id and idempotency_key = p_idempotency_key;
  if v_order_id is not null then
    return v_order_id;
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  select * into v_restaurant from public.restaurants where id = v_session.restaurant_id;

  insert into public.orders (
    restaurant_id, table_id, session_id, group_id, channel,
    fulfillment_type, delivery_address,
    vat_rate_snapshot, service_charge_rate_snapshot, idempotency_key
  ) values (
    v_session.restaurant_id, v_session.table_id, v_session.id, v_session.group_id,
    v_session.channel, p_fulfillment_type, p_delivery_address,
    v_restaurant.vat_rate, v_restaurant.service_charge_rate, p_idempotency_key
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_menu_item
      from public.menu_items
     where id = (v_item->>'menu_item_id')::uuid
       and restaurant_id = v_session.restaurant_id
       and is_available = true;

    if v_menu_item.id is null then
      raise exception 'Menu item unavailable: %', v_item->>'menu_item_id';
    end if;

    insert into public.order_items (
      order_id, menu_item_id, item_name_snapshot, price_snapshot,
      quantity, notes, contributor_session_id
    ) values (
      v_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price,
      (v_item->>'quantity')::int, v_item->>'notes', v_session.id
    );
  end loop;

  return v_order_id;
end;
$$;

-- ─── 6.2 update_order_status ─────────────────────────────────────────────────

create or replace function public.update_order_status(
  p_order_id   uuid,
  p_new_status text
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_restaurant_id uuid;
begin
  select restaurant_id into v_restaurant_id from public.orders where id = p_order_id;

  if v_restaurant_id is null then
    raise exception 'Order not found';
  end if;

  if not public.is_staff_for(v_restaurant_id) then
    raise exception 'Not authorized';
  end if;

  if p_new_status not in ('pending','preparing','ready','delivered') then
    raise exception 'Invalid status: %', p_new_status;
  end if;

  update public.orders
     set status         = p_new_status,
         status_history = status_history || jsonb_build_object(
                            'status', p_new_status,
                            'at',     now(),
                            'by',     auth.uid()
                          ),
         updated_at     = now()
   where id = p_order_id;
end;
$$;

-- ─── 6.3 join_group ──────────────────────────────────────────────────────────

create or replace function public.join_group()
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_session  public.sessions%rowtype;
  v_group_id uuid;
begin
  select * into v_session from public.sessions where id = auth.uid();

  if v_session.id is null then
    raise exception 'No active session';
  end if;

  if v_session.table_id is null then
    raise exception 'This session has no table (not a dine-in session)';
  end if;

  select id into v_group_id
    from public.groups
   where table_id = v_session.table_id and status = 'active'
   order by created_at asc
   limit 1;

  if v_group_id is null then
    insert into public.groups (restaurant_id, table_id)
    values (v_session.restaurant_id, v_session.table_id)
    returning id into v_group_id;
  end if;

  -- Bypass protect_session_columns for this group_id write (transaction-local flag)
  perform set_config('app.bypass_session_protection', 'on', true);
  update public.sessions set group_id = v_group_id where id = auth.uid();

  return v_group_id;
end;
$$;

-- ─── 6.4 Admin RPCs ──────────────────────────────────────────────────────────

create or replace function public.admin_set_subscription_status(
  p_restaurant_id uuid,
  p_status        text,
  p_note          text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Not authorized'; end if;
  if p_status not in ('trial','active','past_due','suspended','cancelled') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update public.restaurants
     set subscription_status = p_status, updated_at = now()
   where id = p_restaurant_id;

  insert into public.admin_audit_log (admin_id, restaurant_id, action, details)
  values (auth.uid(), p_restaurant_id, 'subscription_status_change',
          jsonb_build_object('new_status', p_status, 'note', p_note));
end;
$$;

create or replace function public.admin_set_feature_flag(
  p_restaurant_id uuid,
  p_flag          text,
  p_value         boolean
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Not authorized'; end if;

  update public.restaurants
     set feature_flags = jsonb_set(feature_flags, array[p_flag], to_jsonb(p_value)),
         updated_at    = now()
   where id = p_restaurant_id;

  insert into public.admin_audit_log (admin_id, restaurant_id, action, details)
  values (auth.uid(), p_restaurant_id, 'feature_flag_change',
          jsonb_build_object('flag', p_flag, 'value', p_value));
end;
$$;

create or replace function public.admin_extend_trial(
  p_restaurant_id  uuid,
  p_new_trial_end  timestamptz
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Not authorized'; end if;

  update public.restaurants
     set trial_ends_at = p_new_trial_end, updated_at = now()
   where id = p_restaurant_id;

  insert into public.admin_audit_log (admin_id, restaurant_id, action, details)
  values (auth.uid(), p_restaurant_id, 'trial_extended',
          jsonb_build_object('new_trial_end', p_new_trial_end));
end;
$$;

create or replace function public.admin_set_maintenance_mode(
  p_restaurant_id uuid,
  p_value         boolean
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Not authorized'; end if;

  update public.restaurants
     set maintenance_mode = p_value, updated_at = now()
   where id = p_restaurant_id;

  insert into public.admin_audit_log (admin_id, restaurant_id, action, details)
  values (auth.uid(), p_restaurant_id, 'maintenance_mode_change',
          jsonb_build_object('value', p_value));
end;
$$;

-- ─── 6.5 Scheduled Maintenance Functions (scheduled in 009_cron.sql) ─────────

create or replace function public.expire_stale_sessions()
returns void language sql as $$
  update public.sessions set status = 'expired'
  where status = 'active' and expires_at < now();
$$;

create or replace function public.cleanup_recommendation_cache()
returns void language sql as $$
  delete from public.recommendation_cache where expires_at < now();
$$;
