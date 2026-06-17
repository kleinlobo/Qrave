import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createClient } from "@/lib/supabase/server"
import SettingsForm from "@/components/dashboard/settings/SettingsForm"
import type { RestaurantSettings } from "@/components/dashboard/settings/SettingsForm"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const staffUser = await getStaffUser()
  if (!staffUser) return null

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return null

  if (!["owner", "manager"].includes(staffUser.role)) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">You do not have permission to edit settings.</p>
      </div>
    )
  }

  const supabase = createClient()
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "name, currency, whatsapp_number, group_ordering_enabled, maintenance_mode, session_expiry_minutes"
    )
    .eq("id", restaurantId)
    .single()

  if (!restaurant) return null

  const settings: RestaurantSettings = {
    name: restaurant.name,
    currency: restaurant.currency ?? "USD",
    whatsapp_number: restaurant.whatsapp_number ?? null,
    group_ordering_enabled: restaurant.group_ordering_enabled ?? false,
    maintenance_mode: restaurant.maintenance_mode ?? false,
    session_expiry_minutes: restaurant.session_expiry_minutes ?? 240,
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">{restaurant.name}</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
