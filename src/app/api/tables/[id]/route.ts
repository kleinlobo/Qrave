import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteCtx {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: { label?: string; isActive?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.label !== undefined) update.label = body.label.trim()
  if (body.isActive !== undefined) update.is_active = body.isActive

  const { data, error } = await supabase
    .from("tables")
    .update(update)
    .eq("id", params.id)
    .select("id, label, qr_token, is_active")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ table: data })
}

export async function DELETE(_request: NextRequest, { params }: RouteCtx) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { error } = await supabase.from("tables").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
