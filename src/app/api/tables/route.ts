import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: { restaurantId: string; label: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { restaurantId, label } = body
  if (!restaurantId || !label?.trim()) {
    return NextResponse.json({ error: "restaurantId and label required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("tables")
    .insert({
      restaurant_id: restaurantId,
      label: label.trim(),
      qr_token: crypto.randomUUID(),
    })
    .select("id, label, qr_token, is_active")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ table: data })
}
