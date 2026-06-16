-- Migration 003: Helper Functions for RLS
-- All SECURITY DEFINER + explicit search_path to prevent recursive-RLS and search-path-hijacking.

create or replace function public.current_session_restaurant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select restaurant_id from public.sessions where id = auth.uid();
$$;

create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.staff_users where id = auth.uid() and is_active;
$$;

create or replace function public.current_staff_restaurant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select restaurant_id from public.staff_users where id = auth.uid() and is_active;
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff_users
    where id = auth.uid() and role = 'platform_admin' and is_active
  );
$$;

create or replace function public.is_staff_for(p_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff_users
    where id = auth.uid() and restaurant_id = p_restaurant_id and is_active
  ) or public.is_platform_admin();
$$;

create or replace function public.is_manager_for(p_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff_users
    where id = auth.uid()
      and restaurant_id = p_restaurant_id
      and role in ('owner','manager')
      and is_active
  );
$$;
