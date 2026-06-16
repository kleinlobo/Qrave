import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createClient } from "@/lib/supabase/server"
import KitchenBoard from "@/components/kitchen/KitchenBoard"
import type { LiveOrder } from "@/components/dashboard/OrderCard"

const KITCHEN_STATUSES = ["pending", "preparing"]

export const dynamic = "force-dynamic"

export default async function KitchenPage() {
  const staffUser = await getStaffUser()
  if (!staffUser) return null

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return null
  const supabase = createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, estimated_total, submitted_at, table_id, tables(label), order_items(id, item_name_snapshot, quantity, price_snapshot, notes, is_removed)"
    )
    .eq("restaurant_id", restaurantId)
    .in("status", KITCHEN_STATUSES)
    .order("submitted_at", { ascending: true })

  return (
    <KitchenBoard
      restaurantId={restaurantId}
      staffName={staffUser.name}
      initialOrders={(orders ?? []) as LiveOrder[]}
    />
  )
}
