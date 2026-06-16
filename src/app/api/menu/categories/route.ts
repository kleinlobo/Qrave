import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: { restaurantId: string; name: string; displayOrder?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { restaurantId, name, displayOrder } = body
  if (!restaurantId || !name?.trim()) {
    return NextResponse.json({ error: "restaurantId and name required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("menu_categories")
    .insert({ restaurant_id: restaurantId, name: name.trim(), display_order: displayOrder ?? 0 })
    .select("id, name, display_order, is_active")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}
