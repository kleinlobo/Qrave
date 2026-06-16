-- Migration 008: Storage Buckets & Policies
-- Buckets use {restaurant_id}/... path convention so RLS helpers can scope by folder.

insert into storage.buckets (id, name, public) values
  ('menu-media',          'menu-media',          true),
  ('stock-library',       'stock-library',       true),
  ('menu-import-uploads', 'menu-import-uploads', false),
  ('restaurant-branding', 'restaurant-branding', true)
on conflict (id) do nothing;

-- ─── menu-media: public read, owner/manager write ─────────────────────────────

create policy "menu_media_public_read" on storage.objects
  for select using (bucket_id = 'menu-media');

create policy "menu_media_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'menu-media'
    and public.is_manager_for((storage.foldername(name))[1]::uuid)
  );

create policy "menu_media_owner_update" on storage.objects
  for update using (
    bucket_id = 'menu-media'
    and public.is_manager_for((storage.foldername(name))[1]::uuid)
  );

create policy "menu_media_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'menu-media'
    and public.is_manager_for((storage.foldername(name))[1]::uuid)
  );

-- ─── stock-library: public read, platform_admin write only ───────────────────

create policy "stock_library_public_read" on storage.objects
  for select using (bucket_id = 'stock-library');

create policy "stock_library_admin_write" on storage.objects
  for all
  using (bucket_id = 'stock-library' and public.is_platform_admin())
  with check (bucket_id = 'stock-library' and public.is_platform_admin());

-- ─── menu-import-uploads: private, owner/manager scoped ─────────────────────

create policy "menu_import_uploads_owner" on storage.objects
  for all
  using (
    bucket_id = 'menu-import-uploads'
    and public.is_manager_for((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'menu-import-uploads'
    and public.is_manager_for((storage.foldername(name))[1]::uuid)
  );

-- ─── restaurant-branding: public read, owner/manager write ───────────────────

create policy "restaurant_branding_public_read" on storage.objects
  for select using (bucket_id = 'restaurant-branding');

create policy "restaurant_branding_owner_write" on storage.objects
  for all
  using (
    bucket_id = 'restaurant-branding'
    and public.is_manager_for((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'restaurant-branding'
    and public.is_manager_for((storage.foldername(name))[1]::uuid)
  );
