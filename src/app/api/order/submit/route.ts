import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface SubmitBody {
  restaurantId: string
  idempotencyKey: string
  items: Array<{
    menu_item_id: string
    quantity: number
    notes: string | null
  }>
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  let body: SubmitBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { idempotencyKey, items } = body

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
  }

  // Call the SECURITY DEFINER RPC — it handles idempotency, region lock,
  // session validation, stock snapshot, and totals recalculation via trigger.
  const { data: orderId, error } = await supabase.rpc("submit_order", {
    p_items: items,
    p_idempotency_key: idempotencyKey,
    p_fulfillment_type: undefined,
    p_delivery_address: undefined,
  })

  if (error) {
    const isUserError =
      error.message.includes("Session expired") ||
      error.message.includes("Region lock") ||
      error.message.includes("Cart is empty") ||
      error.message.includes("unavailable")

    return NextResponse.json(
      { error: error.message },
      { status: isUserError ? 422 : 500 }
    )
  }

  return NextResponse.json({ orderId })
}
