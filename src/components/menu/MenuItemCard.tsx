"use client"

import Image from "next/image"
import VideoPlayer from "./VideoPlayer"
import { useCart } from "@/lib/cart/CartContext"
import { formatCurrency } from "@/lib/currency"
import type { MenuItem } from "@/lib/menu/types"

interface Props {
  item: MenuItem
  currency: string
}

export default function MenuItemCard({ item, currency }: Props) {
  const { addItem, decrementItem, getQuantity } = useCart()
  const quantity = getQuantity(item.id)

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-surface border border-border">
      {/* Thumbnail / video */}
      <div className="relative h-28 w-full bg-surface-muted">
        {item.video_url ? (
          <VideoPlayer src={item.video_url} poster={item.thumbnail_url} />
        ) : item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.name}
            fill
            sizes="(max-width: 430px) 50vw, 215px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl opacity-20">🍽</span>
          </div>
        )}

        {/* Dietary tags — overlay top-left */}
        {item.dietary_tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {item.dietary_tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              >
                {DIETARY_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {item.name}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {item.description}
            </p>
          )}
          <p className="text-sm font-bold text-primary mt-1">
            {formatCurrency(item.price, currency)}
          </p>
        </div>

        {/* Add / quantity controls */}
        {quantity === 0 ? (
          <button
            onClick={() => addItem(item.id, item.name, item.price)}
            className="w-full rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground active:opacity-80 transition-opacity"
          >
            Add
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-full bg-primary px-1.5 py-1">
            <button
              onClick={() => decrementItem(item.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white text-base font-bold active:bg-white/30"
              aria-label="Remove one"
            >
              −
            </button>
            <span className="text-white font-bold text-sm">{quantity}</span>
            <button
              onClick={() => addItem(item.id, item.name, item.price)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white text-base font-bold active:bg-white/30"
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

const DIETARY_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Veg",
  gluten_free: "GF",
  halal: "Halal",
  spicy: "Spicy",
}
