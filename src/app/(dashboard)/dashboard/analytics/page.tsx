import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/currency"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const staffUser = await getStaffUser()
  if (!staffUser) return null

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return null

  const supabase = createClient()

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const monthStart = new Date(now)
  monthStart.setDate(now.getDate() - 30)

  const [
    { data: restaurant },
    { data: todayOrders },
    { data: weekOrders },
    { data: monthOrders },
    { data: topItems },
  ] = await Promise.all([
    supabase.from("restaurants").select("name, currency").eq("id", restaurantId).single(),

    supabase
      .from("orders")
      .select("estimated_total")
      .eq("restaurant_id", restaurantId)
      .eq("status", "delivered")
      .gte("submitted_at", todayStart.toISOString()),

    supabase
      .from("orders")
      .select("estimated_total")
      .eq("restaurant_id", restaurantId)
      .eq("status", "delivered")
      .gte("submitted_at", weekStart.toISOString()),

    supabase
      .from("orders")
      .select("estimated_total")
      .eq("restaurant_id", restaurantId)
      .eq("status", "delivered")
      .gte("submitted_at", monthStart.toISOString()),

    supabase
      .from("v_most_ordered_items")
      .select("name, total_quantity, order_count")
      .eq("restaurant_id", restaurantId)
      .order("total_quantity", { ascending: false })
      .limit(10),
  ])

  const currency = restaurant?.currency ?? "USD"

  function sum(orders: Array<{ estimated_total: number }> | null) {
    return (orders ?? []).reduce((acc, o) => acc + (o.estimated_total ?? 0), 0)
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
      </div>

      {/* Revenue stats */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Revenue (delivered orders)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Today"
            value={formatCurrency(sum(todayOrders), currency)}
            sub={`${(todayOrders ?? []).length} order${todayOrders?.length !== 1 ? "s" : ""}`}
          />
          <StatCard
            label="Last 7 days"
            value={formatCurrency(sum(weekOrders), currency)}
            sub={`${(weekOrders ?? []).length} orders`}
          />
          <StatCard
            label="Last 30 days"
            value={formatCurrency(sum(monthOrders), currency)}
            sub={`${(monthOrders ?? []).length} orders`}
          />
        </div>
      </div>

      {/* Top items */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Most ordered items (all time)</h2>
        {(topItems ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {(topItems ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                <p className="flex-1 text-sm font-medium text-foreground">{item.name}</p>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{item.total_quantity ?? 0}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{item.order_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">orders</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}
