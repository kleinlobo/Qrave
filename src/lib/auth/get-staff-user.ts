import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types"
export type { StaffRole } from "./roles"
export { redirectPathForRole } from "./roles"

export type StaffUser = Tables<"staff_users">

// Server-only — call from layouts and Route Handlers.
export async function getStaffUser(): Promise<StaffUser | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.is_anonymous) return null

  const { data } = await supabase
    .from("staff_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .single()

  return data ?? null
}
