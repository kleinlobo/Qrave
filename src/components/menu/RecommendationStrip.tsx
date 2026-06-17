"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { formatCurrency } from "@/lib/currency"
import type { MenuItem } from "@/lib/menu/types"

interface Props {
  currentItemId: string | null
  restaurantId: string
  allItems: MenuItem[]
  currency: string
  onJumpTo: (itemId: string) => void
}

export default function RecommendationStrip({
  currentItemId,
  restaurantId,
  allItems,
  currency,
  onJumpTo,
}: Props) {
  const [recommendedIds, setRecommendedIds] = useState<string[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!currentItemId) {
      setVisible(false)
      setRecommendedIds([])
      return
    }

    setVisible(false)
    setRecommendedIds([])

    // Debounce: only fetch after the item has been in view for 2.5s
    const fetchTimer = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId, currentItemId }),
        })
        if (res.ok) {
          const data = await res.json()
          const ids: string[] = data.recommendedItemIds ?? []
          if (ids.length > 0) {
            setRecommendedIds(ids)
            setVisible(true)
          }
        }
      } catch {
        // Gracefully ignore — AI recommendations are non-critical
      }
    }, 2500)

    return () => clearTimeout(fetchTimer)
  }, [currentItemId, restaurantId])

  const recommendedItems = recommendedIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is MenuItem => !!i)

  if (!visible || recommendedItems.length === 0) {
    return null
  }

  return (
    <div className="animate-slide-up fixed bottom-24 left-4 right-4 z-40">
      <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2 px-1">
          ✨ You might also like
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hidden">
          {recommendedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onJumpTo(item.id)}
              className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/15 px-3 py-2 text-left transition-colors"
            >
              {item.thumbnail_url && (
                <Image
                  src={item.thumbnail_url}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate max-w-[100px]">{item.name}</p>
                <p className="text-[10px] text-white/60">{formatCurrency(item.price, currency)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
