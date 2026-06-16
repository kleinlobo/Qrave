import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteCtx {
  params: { id: string }
}

interface UpdateItemBody {
  categoryId?: string
  name?: string
  description?: string | null
  price?: number
  videoUrl?: string | null
  thumbnailUrl?: string | null
  dietaryTags?: string[]
  displayOrder?: number
  isAvailable?: boolean
}

export async function PATCH(request: NextRequest, { params }: RouteCtx) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: UpdateItemBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (body.categoryId !== undefined) update.category_id = body.categoryId
  if (body.name !== undefined) update.name = body.name.trim()
  if (body.description !== undefined) update.description = body.description?.trim() ?? null
  if (body.price !== undefined) update.price = body.price
  if (body.videoUrl !== undefined) update.video_url = body.videoUrl
  if (body.thumbnailUrl !== undefined) update.thumbnail_url = body.thumbnailUrl
  if (body.dietaryTags !== undefined) update.dietary_tags = body.dietaryTags
  if (body.displayOrder !== undefined) update.display_order = body.displayOrder
  if (body.isAvailable !== undefined) update.is_available = body.isAvailable

  const { data, error } = await supabase
    .from("menu_items")
    .update(update)
    .eq("id", params.id)
    .select("id, category_id, name, description, price, video_url, thumbnail_url, dietary_tags, display_order, is_available")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(_request: NextRequest, { params }: RouteCtx) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { error } = await supabase.from("menu_items").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
