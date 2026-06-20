import { NextResponse } from "next/server"
import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const staffUser = await getStaffUser()
  if (!staffUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) {
    return NextResponse.json({ error: "No restaurant" }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("requests")
    .select("id, request_type, requested_at, acknowledged_at, table_id, tables(label)")
    .eq("restaurant_id", restaurantId)
    .is("acknowledged_at", null)
    .order("requested_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}
