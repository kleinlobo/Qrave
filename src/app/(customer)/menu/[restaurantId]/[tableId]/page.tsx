import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { verifyQRToken } from "@/lib/qr"
import SessionBootstrap from "@/components/session/SessionBootstrap"

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

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "id, name, currency, locale, latitude, longitude, region_lock_radius_meters, maintenance_mode, subscription_status, ordering_channels, branding, session_expiry_minutes"
    )
    .eq("id", restaurantId)
    .single()

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
    />
  )
}
