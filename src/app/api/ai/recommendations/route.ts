import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { createClient } from "@/lib/supabase/server"

const MODEL = "gemini-2.0-flash"

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: { restaurantId: string; currentItemId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { restaurantId, currentItemId } = body
  if (!restaurantId || !currentItemId) {
    return NextResponse.json({ error: "restaurantId and currentItemId required" }, { status: 400 })
  }

  const cacheKey = `${restaurantId}:${currentItemId}`

  // Check recommendation cache
  const { data: cached } = await supabase
    .from("recommendation_cache")
    .select("recommended_item_ids")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()

  if (cached?.recommended_item_ids?.length) {
    return NextResponse.json({ recommendedItemIds: cached.recommended_item_ids })
  }

  // Fetch menu items for this restaurant
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, description, dietary_tags")
    .eq("restaurant_id", restaurantId)
    .eq("is_available", true)

  if (!menuItems?.length) {
    return NextResponse.json({ recommendedItemIds: [] })
  }

  const currentItem = menuItems.find((i) => i.id === currentItemId)
  if (!currentItem) {
    return NextResponse.json({ recommendedItemIds: [] })
  }

  // Build Gemini prompt
  const menuList = menuItems
    .filter((i) => i.id !== currentItemId)
    .map((i) => {
      const tags = (i.dietary_tags ?? []).length ? ` [${i.dietary_tags!.join(", ")}]` : ""
      return `- id:${i.id} | ${i.name}${tags}${i.description ? ` — ${i.description}` : ""}`
    })
    .join("\n")

  const prompt = `You are a smart menu recommendation engine for a restaurant app.

The customer is currently viewing: "${currentItem.name}"${currentItem.description ? ` — ${currentItem.description}` : ""}

Available menu items (excluding the current item):
${menuList}

Recommend up to 3 items the customer is most likely to enjoy next, considering complementary flavours, meal balance, and popular combinations.

Return ONLY a valid JSON array of item IDs (strings), with no other text. Example: ["id1","id2","id3"]
Select at most 3 items. If there are fewer than 3 good matches, return fewer.`

  let recommendedItemIds: string[] = []

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0.3, maxOutputTokens: 200 },
    })

    const raw = response.text?.trim() ?? "[]"
    // Extract JSON array even if surrounded by markdown fences
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as unknown[]
      // Validate — only include IDs that actually exist in the menu
      const validIds = new Set(menuItems.map((i) => i.id))
      recommendedItemIds = parsed
        .filter((id): id is string => typeof id === "string" && validIds.has(id))
        .slice(0, 3)
    }
  } catch (err) {
    console.error("Gemini recommendation error:", err)
    // Graceful degradation — return empty rather than 500
    return NextResponse.json({ recommendedItemIds: [] })
  }

  // Cache the result for 1 hour
  if (recommendedItemIds.length > 0) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await supabase
      .from("recommendation_cache")
      .upsert(
        {
          cache_key: cacheKey,
          restaurant_id: restaurantId,
          placement: "menu_feed",
          recommended_item_ids: recommendedItemIds,
          expires_at: expiresAt,
        },
        { onConflict: "cache_key" }
      )
  }

  // Record recommendation shown event (fire-and-forget)
  supabase
    .from("recommendation_events")
    .insert({
      restaurant_id: restaurantId,
      session_id: user.id,
      placement: "menu_feed",
      event_type: "shown",
      recommended_item_ids: recommendedItemIds,
      source_item_ids: [currentItemId],
    })
    .then(() => {}, () => {})

  return NextResponse.json({ recommendedItemIds })
}
