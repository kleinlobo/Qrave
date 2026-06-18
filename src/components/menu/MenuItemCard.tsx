"use client"

import { useRef } from "react"
import VideoPlayer from "./VideoPlayer"
import { useCart } from "@/lib/cart/CartContext"
import { formatCurrency } from "@/lib/currency"
import type { MenuItem } from "@/lib/menu/types"

const DIETARY_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  gluten_free: "GF",
  halal: "Halal",
  spicy: "Spicy",
}

interface Props {
  item: MenuItem
  currency: string
}

export default function MenuItemCard({ item, currency }: Props) {
  const { addItem, decrementItem, getQuantity } = useCart()
  const quantity = getQuantity(item.id)
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={cardRef}
      className="relative h-screen w-full snap-start overflow-hidden bg-surface"
    >
      {/* Background video / image */}
      <VideoPlayer src={item.video_url} poster={item.thumbnail_url} />

      {/* Gradient scrim — bottom two-thirds */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* Dietary tags — top right */}
      {item.dietary_tags.length > 0 && (
        <div className="absolute top-14 right-4 flex flex-col gap-1.5 z-10">
          {item.dietary_tags.map((tag) => (
            <span
              key={tag}
              className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"
            >
              {DIETARY_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      )}

      {/* Item info + cart controls — bottom (pb-28 keeps controls above CartFab) */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-28 z-10 space-y-3">
        <div>
          <h2 className="text-white text-xl font-bold leading-tight">{item.name}</h2>
          {item.description && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2 leading-snug">
              {item.description}
            </p>
          )}
          <p className="text-white font-semibold text-base mt-1.5">
            {formatCurrency(item.price, currency)}
          </p>
        </div>

        {/* Add / quantity controls */}
        {quantity === 0 ? (
          <button
            onClick={() => addItem(item.id, item.name, item.price)}
            className="w-full bg-primary text-primary-foreground rounded-full py-3.5 font-semibold text-sm active:opacity-80 transition-opacity"
          >
            Add to order
          </button>
        ) : (
          <div className="flex items-center justify-between bg-primary rounded-full px-2 py-2">
            <button
              onClick={() => decrementItem(item.id)}
              className="w-10 h-10 rounded-full bg-white/20 text-white text-xl font-bold flex items-center justify-center active:bg-white/30"
              aria-label="Remove one"
            >
              −
            </button>
            <span className="text-white font-bold text-base">{quantity}</span>
            <button
              onClick={() => addItem(item.id, item.name, item.price)}
              className="w-10 h-10 rounded-full bg-white/20 text-white text-xl font-bold flex items-center justify-center active:bg-white/30"
              aria-label="Add one more"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
