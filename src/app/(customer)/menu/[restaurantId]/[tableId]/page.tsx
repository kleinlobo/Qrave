import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { verifyQRToken } from "@/lib/qr"
import SessionBootstrap from "@/components/session/SessionBootstrap"
import type { MenuCategory } from "@/lib/menu/types"

interface Props {
  params: { restaurantId: string; tableId: string }
  searchParams: { t?: string }
}

export default async function CustomerMenuPage({ params, searchParams }: Props) {
  const { restaurantId, tableId } = params
  const token = searchParams.t

  if (!token) notFound()

  const valid = await verifyQRToken(restaurantId, tableId, token)
  if (!valid) notFound()

  const supabase = createServiceClient()

  // Verify table belongs to this restaurant
  const { data: table } = await supabase
    .from("tables")
    .select("id, label")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .single()

  if (!table) notFound()

  // Fetch restaurant and menu in parallel
  const [{ data: restaurant }, { data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id, name, currency, latitude, longitude, region_lock_radius_meters, maintenance_mode, subscription_status, session_expiry_minutes, group_ordering_enabled"
      )
      .eq("id", restaurantId)
      .single(),

    supabase
      .from("menu_categories")
      .select("id, name, display_order")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("display_order"),

    supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, video_url, thumbnail_url, dietary_tags, display_order")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("display_order"),
  ])

  if (!restaurant) notFound()

  if (
    restaurant.subscription_status === "suspended" ||
    restaurant.subscription_status === "cancelled"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-lg font-semibold text-foreground">{restaurant.name}</p>
          <p className="text-sm text-foreground-muted">
            This venue is temporarily unavailable. Please ask a staff member for assistance.
          </p>
        </div>
      </div>
    )
  }

  if (restaurant.maintenance_mode) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-lg font-semibold text-foreground">{restaurant.name}</p>
          <p className="text-sm text-foreground-muted">
            We&apos;ll be back shortly. The menu is currently under maintenance.
          </p>
        </div>
      </div>
    )
  }

  // Build menu category tree
  const menuCategories: MenuCategory[] = (categories ?? []).map((cat) => ({
    ...cat,
    items: (items ?? []).filter((item) => item.category_id === cat.id),
  }))

  return (
    <SessionBootstrap
      restaurantId={restaurantId}
      tableId={tableId}
      tableLabel={table.label}
      restaurantName={restaurant.name}
      restaurantLat={restaurant.latitude}
      restaurantLon={restaurant.longitude}
      regionLockRadius={restaurant.region_lock_radius_meters}
      sessionExpiryMinutes={restaurant.session_expiry_minutes}
      currency={restaurant.currency}
      groupOrderingEnabled={restaurant.group_ordering_enabled}
      menuCategories={menuCategories}
    />
  )
}
