import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStaffUser } from "@/lib/auth/get-staff-user"

export async function PATCH(request: NextRequest) {
  const staffUser = await getStaffUser()
  if (!staffUser) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 403 })

  if (!["owner", "manager"].includes(staffUser.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  // Allowlist — only these fields can be updated via this endpoint
  const allowed = [
    "name",
    "currency",
    "whatsapp_number",
    "group_ordering_enabled",
    "maintenance_mode",
    "session_expiry_minutes",
  ] as const

  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 })
  }

  const supabase = createClient()
  const { error } = await supabase
    .from("restaurants")
    .update(patch)
    .eq("id", restaurantId)

  if (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
