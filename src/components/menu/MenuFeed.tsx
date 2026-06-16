"use client"

import { useEffect, useRef, useState } from "react"
import { CartProvider } from "@/lib/cart/CartContext"
import CategoryChips from "./CategoryChips"
import MenuItemCard from "./MenuItemCard"
import CartFab from "@/components/cart/CartFab"
import type { MenuCategory, MenuItem } from "@/lib/menu/types"

interface Props {
  categories: MenuCategory[]
  currency: string
  restaurantName: string
}

interface FlatItem extends MenuItem {
  categoryId: string
}

export default function MenuFeed({ categories, currency, restaurantName }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  )

  const feedRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Flatten all items in display order, retaining their category
  const allItems: FlatItem[] = categories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryId: cat.id }))
  )

  // Track which category is active as user scrolls
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return

    const observers: IntersectionObserver[] = []

    allItems.forEach((item) => {
      const el = itemRefs.current.get(item.id)
      if (!el) return

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveCategoryId(item.categoryId)
        },
        { root: feed, threshold: 0.5 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems.length])

  function scrollToCategory(categoryId: string) {
    const firstItem = allItems.find((i) => i.categoryId === categoryId)
    if (!firstItem) return
    const el = itemRefs.current.get(firstItem.id)
    el?.scrollIntoView({ behavior: "smooth" })
  }

  if (allItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">{restaurantName}</p>
          <p className="text-sm text-foreground-muted">The menu isn&apos;t available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <CartProvider>
      <div className="relative h-screen overflow-hidden">
        {/* Sticky category chips overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <CategoryChips
              categories={categories}
              activeId={activeCategoryId}
              onSelect={scrollToCategory}
            />
          </div>
        </div>

        {/* Snap-scroll feed */}
        <div
          ref={feedRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hidden"
        >
          {allItems.map((item) => (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el)
                else itemRefs.current.delete(item.id)
              }}
            >
              <MenuItemCard item={item} currency={currency} />
            </div>
          ))}
        </div>

        {/* Floating cart button — opens cart sheet (Phase 7) */}
        <CartFab currency={currency} onOpen={() => {}} />
      </div>
    </CartProvider>
  )
}
