import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createClient } from "@/lib/supabase/server"
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard"
import LiveRequestsPanel from "@/components/dashboard/LiveRequestsPanel"
import type { LiveOrder } from "@/components/dashboard/OrderCard"

const ACTIVE_STATUSES = ["pending", "preparing", "ready"]

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const staffUser = await getStaffUser()
  if (!staffUser) return null

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return null
  const supabase = createClient()

  const [{ data: restaurant }, { data: orders }, { data: requests }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("name, currency")
      .eq("id", restaurantId)
      .single(),

    supabase
      .from("orders")
      .select(
        "id, status, estimated_total, submitted_at, table_id, tables(label), order_items(id, item_name_snapshot, quantity, price_snapshot, notes, is_removed)"
      )
      .eq("restaurant_id", restaurantId)
      .in("status", ACTIVE_STATUSES)
      .order("submitted_at", { ascending: true }),

    supabase
      .from("requests")
      .select("id, request_type, requested_at, acknowledged_at, table_id, tables(label)")
      .eq("restaurant_id", restaurantId)
      .is("acknowledged_at", null)
      .order("requested_at", { ascending: true }),
  ])

  const currency = restaurant?.currency ?? "USD"

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{restaurant?.name ?? "Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">Live orders</p>
        </div>
      </div>

      <LiveRequestsPanel
        restaurantId={restaurantId}
        initialRequests={(requests ?? []) as Parameters<typeof LiveRequestsPanel>[0]["initialRequests"]}
      />

      <LiveOrderBoard
        restaurantId={restaurantId}
        currency={currency}
        initialOrders={(orders ?? []) as LiveOrder[]}
      />
    </div>
  )
}
