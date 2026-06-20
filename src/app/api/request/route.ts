import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

const VALID_TYPES = ["waiter_call", "bill_request"] as const
type RequestType = (typeof VALID_TYPES)[number]

const DB_TYPE_MAP: Record<RequestType, "waiter" | "bill"> = {
  waiter_call: "waiter",
  bill_request: "bill",
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  let body: { requestType: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!VALID_TYPES.includes(body.requestType as RequestType)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 })
  }

  // Fetch active session for restaurant_id + table_id
  const { data: session } = await supabase
    .from("sessions")
    .select("restaurant_id, table_id")
    .eq("id", user.id)
    .eq("status", "active")
    .single()

  if (!session) {
    return NextResponse.json({ error: "No active session" }, { status: 404 })
  }

  if (!session.table_id) {
    return NextResponse.json({ error: "Requests require a dine-in session" }, { status: 422 })
  }

  // Use service role for the insert so the set_request_context trigger
  // (SECURITY INVOKER) can SELECT the session row without RLS interference.
  const serviceSupabase = createServiceClient()
  const { data, error } = await serviceSupabase
    .from("requests")
    .insert({
      session_id: user.id,
      restaurant_id: session.restaurant_id,
      table_id: session.table_id,
      request_type: DB_TYPE_MAP[body.requestType as RequestType],
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requestId: data.id })
}
