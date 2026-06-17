import { notFound } from "next/navigation"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/server"
import { getStaffUser } from "@/lib/auth/get-staff-user"
import RestaurantActions from "@/components/admin/RestaurantActions"
import type { Json } from "@/types/database"

export const dynamic = "force-dynamic"

interface Props {
  params: { id: string }
}

function asFlags(json: Json): Record<string, boolean> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {}
  return Object.fromEntries(
    Object.entries(json as Record<string, unknown>)
      .filter(([, v]) => typeof v === "boolean")
      .map(([k, v]) => [k, v as boolean])
  )
}

export default async function AdminRestaurantDetailPage({ params }: Props) {
  const staffUser = await getStaffUser()
  if (!staffUser || staffUser.role !== "platform_admin") return null

  const supabase = createServiceClient()

  const [{ data: restaurant }, { data: staff }, { data: recentOrders }] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id, name, subscription_status, maintenance_mode, feature_flags, trial_ends_at, created_at, currency, region, venue_type"
      )
      .eq("id", params.id)
      .single(),

    supabase
      .from("staff_users")
      .select("id, name, email, role, is_active")
      .eq("restaurant_id", params.id)
      .order("created_at"),

    supabase
      .from("orders")
      .select("id, status, estimated_total, submitted_at")
      .eq("restaurant_id", params.id)
      .order("submitted_at", { ascending: false })
      .limit(5),
  ])

  if (!restaurant) notFound()

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-2xl">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Link
            href="/admin/restaurants"
            className="text-xs text-muted-foreground hover:text-foreground mb-1 block"
          >
            ← All restaurants
          </Link>
          <h1 className="text-xl font-bold text-foreground">{restaurant.name}</h1>
          <p className="text-sm text-muted-foreground">
            {restaurant.venue_type} &middot; {restaurant.region} &middot; {restaurant.currency} &middot;{" "}
            Created {new Date(restaurant.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <RestaurantActions
        restaurantId={restaurant.id}
        currentStatus={restaurant.subscription_status}
        maintenanceMode={restaurant.maintenance_mode}
        featureFlags={asFlags(restaurant.feature_flags)}
        trialEndsAt={restaurant.trial_ends_at}
      />

      {/* Staff */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Staff ({(staff ?? []).length})</h2>
        {(staff ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff yet.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {(staff ?? []).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize flex-shrink-0">{s.role}</span>
                {!s.is_active && (
                  <span className="text-[10px] text-red-500 flex-shrink-0">inactive</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent orders */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recent orders</h2>
        {(recentOrders ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {(recentOrders ?? []).map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                <p className="text-xs text-muted-foreground font-mono flex-shrink-0">
                  {o.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="flex-1 text-sm text-foreground capitalize">{o.status}</p>
                <p className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(o.submitted_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
