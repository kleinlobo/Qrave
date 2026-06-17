import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getStaffUser } from "@/lib/auth/get-staff-user"

type Params = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const staffUser = await getStaffUser()
  if (!staffUser) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  if (staffUser.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const restaurantId = params.id
  // Use the authed client — admin RPCs are SECURITY DEFINER with is_platform_admin() guard
  const supabase = createClient()

  const action = body.action as string | undefined

  if (action === "set_subscription") {
    const status = body.status as string
    const note = (body.note as string | undefined) ?? undefined
    const { error } = await supabase.rpc("admin_set_subscription_status", {
      p_restaurant_id: restaurantId,
      p_status: status,
      ...(note ? { p_note: note } : {}),
    })
    if (error) {
      console.error("admin_set_subscription_status error:", error)
      return NextResponse.json({ error: "RPC failed" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === "set_maintenance") {
    const { error } = await supabase.rpc("admin_set_maintenance_mode", {
      p_restaurant_id: restaurantId,
      p_value: body.value as boolean,
    })
    if (error) return NextResponse.json({ error: "RPC failed" }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === "set_feature_flag") {
    const { error } = await supabase.rpc("admin_set_feature_flag", {
      p_restaurant_id: restaurantId,
      p_flag: body.flag as string,
      p_value: body.value as boolean,
    })
    if (error) return NextResponse.json({ error: "RPC failed" }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === "extend_trial") {
    const { error } = await supabase.rpc("admin_extend_trial", {
      p_restaurant_id: restaurantId,
      p_new_trial_end: body.trial_end as string,
    })
    if (error) return NextResponse.json({ error: "RPC failed" }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function GET(_request: NextRequest, { params }: Params) {
  const staffUser = await getStaffUser()
  if (!staffUser) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  if (staffUser.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Service client to bypass RLS for single-restaurant detail
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, name, subscription_status, maintenance_mode, feature_flags, trial_ends_at, created_at, currency, region, venue_type"
    )
    .eq("id", params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(data)
}
