import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import MenuManager from "@/components/dashboard/menu/MenuManager"
import type { MgmtCategory, MgmtItem } from "@/components/dashboard/menu/types"

export const dynamic = "force-dynamic"

export default async function MenuPage() {
  const staffUser = await getStaffUser()
  if (!staffUser) return null

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return null

  const supabase = createClient()

  const [{ data: restaurant }, { data: categories }, { data: items }] = await Promise.all([
    createServiceClient()
      .from("restaurants")
      .select("currency")
      .eq("id", restaurantId)
      .single(),

    supabase
      .from("menu_categories")
      .select("id, name, display_order, is_active")
      .eq("restaurant_id", restaurantId)
      .order("display_order"),

    supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, video_url, thumbnail_url, dietary_tags, display_order, is_available")
      .eq("restaurant_id", restaurantId)
      .order("display_order"),
  ])

  return (
    <div className="p-4 md:p-6">
      <MenuManager
        restaurantId={restaurantId}
        currency={restaurant?.currency ?? "USD"}
        initialCategories={(categories ?? []) as MgmtCategory[]}
        initialItems={(items ?? []) as MgmtItem[]}
      />
    </div>
  )
}
