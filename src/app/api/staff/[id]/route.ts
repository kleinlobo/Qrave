import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteCtx {
  params: { id: string }
}

const VALID_ROLES = ["owner", "manager", "staff", "kitchen_staff"] as const

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { data: caller } = await supabase
    .from("staff_users")
    .select("role, restaurant_id")
    .eq("id", user.id)
    .single()

  if (!caller?.restaurant_id || !["owner", "manager"].includes(caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Cannot edit own record via this endpoint
  if (params.id === user.id) {
    return NextResponse.json({ error: "Cannot edit your own account here" }, { status: 400 })
  }

  let body: { role?: string; isActive?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    update.role = body.role
  }
  if (body.isActive !== undefined) update.is_active = body.isActive

  const { data, error } = await supabase
    .from("staff_users")
    .update(update)
    .eq("id", params.id)
    .eq("restaurant_id", caller.restaurant_id)
    .select("id, name, email, role, is_active")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staffUser: data })
}
