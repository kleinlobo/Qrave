import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface CreateItemBody {
  restaurantId: string
  categoryId: string
  name: string
  description?: string
  price: number
  videoUrl?: string
  thumbnailUrl?: string
  dietaryTags?: string[]
  displayOrder?: number
  isAvailable?: boolean
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: CreateItemBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { restaurantId, categoryId, name, description, price, videoUrl, thumbnailUrl, dietaryTags, displayOrder, isAvailable } = body
  if (!restaurantId || !categoryId || !name?.trim() || price == null) {
    return NextResponse.json({ error: "restaurantId, categoryId, name, price required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: name.trim(),
      description: description?.trim() ?? null,
      price,
      video_url: videoUrl ?? null,
      thumbnail_url: thumbnailUrl ?? null,
      dietary_tags: dietaryTags ?? [],
      display_order: displayOrder ?? 0,
      is_available: isAvailable ?? true,
    })
    .select("id, category_id, name, description, price, video_url, thumbnail_url, dietary_tags, display_order, is_available")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
