import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/server"
import { getStaffUser } from "@/lib/auth/get-staff-user"

export const dynamic = "force-dynamic"

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-yellow-500/10 text-yellow-600",
  active: "bg-green-500/10 text-green-600",
  suspended: "bg-orange-500/10 text-orange-600",
  cancelled: "bg-red-500/10 text-red-600",
}

export default async function AdminRestaurantsPage() {
  const staffUser = await getStaffUser()
  if (!staffUser || staffUser.role !== "platform_admin") return null

  const supabase = createServiceClient()
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select(
      "id, name, subscription_status, maintenance_mode, created_at, currency, region, venue_type, trial_ends_at"
    )
    .order("created_at", { ascending: false })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Restaurants</h1>
        <p className="text-sm text-muted-foreground">{(restaurants ?? []).length} total</p>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {(restaurants ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No restaurants yet.</p>
        )}
        {(restaurants ?? []).map((r) => (
          <Link
            key={r.id}
            href={`/admin/restaurants/${r.id}`}
            className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.venue_type} &middot; {r.region} &middot; {r.currency}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {r.maintenance_mode && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-orange-500/10 text-orange-600">
                  maintenance
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  STATUS_COLORS[r.subscription_status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {r.subscription_status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
