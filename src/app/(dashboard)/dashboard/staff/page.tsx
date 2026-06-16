import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createClient } from "@/lib/supabase/server"
import StaffManager from "@/components/dashboard/staff/StaffManager"
import type { MgmtStaff } from "@/components/dashboard/staff/StaffDialog"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  const staffUser = await getStaffUser()
  if (!staffUser) return null

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return null

  // Only owner/manager can access this page
  if (!["owner", "manager"].includes(staffUser.role)) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">You do not have permission to manage staff.</p>
      </div>
    )
  }

  const supabase = createClient()
  const { data: staff } = await supabase
    .from("staff_users")
    .select("id, name, email, role, is_active, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at")

  return (
    <div className="p-4 md:p-6">
      <StaffManager
        currentUserId={staffUser.id}
        initialStaff={(staff ?? []) as MgmtStaff[]}
      />
    </div>
  )
}
