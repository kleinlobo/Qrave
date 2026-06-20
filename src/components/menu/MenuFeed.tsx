"use client"

import { useEffect, useRef, useState } from "react"
import CategoryChips from "./CategoryChips"
import MenuItemCard from "./MenuItemCard"
import CartFab from "@/components/cart/CartFab"
import RequestSheet from "@/components/requests/RequestSheet"
import type { MenuCategory } from "@/lib/menu/types"

interface Props {
  categories: MenuCategory[]
  currency: string
  restaurantName: string
  restaurantId: string
  tableLabel: string
  groupOrderingEnabled: boolean
  whatsappNumber?: string | null
}

export default function MenuFeed({ categories, currency, restaurantName, restaurantId, tableLabel, groupOrderingEnabled }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null)
  const [requestSheetOpen, setRequestSheetOpen] = useState(false)

  const feedRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    const feed = feedRef.current
    if (!feed || categories.length === 0) return

    const observers: IntersectionObserver[] = []

    categories.forEach((cat) => {
      const el = categoryRefs.current.get(cat.id)
      if (!el) return

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveCategoryId(cat.id)
        },
        { root: feed, threshold: 0, rootMargin: "0px 0px -75% 0px" }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [categories])

  function scrollToCategory(categoryId: string) {
    const el = categoryRefs.current.get(categoryId)
    if (!el || !feedRef.current) return
    const feedTop = feedRef.current.getBoundingClientRect().top
    const elTop = el.getBoundingClientRect().top
    feedRef.current.scrollBy({ top: elTop - feedTop - 8, behavior: "smooth" })
  }

  if (categories.length === 0 || categories.every((c) => c.items.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">{restaurantName}</p>
          <p className="text-sm text-muted-foreground">The menu isn&apos;t available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <p className="text-foreground font-bold text-base leading-tight">{restaurantName}</p>
            <p className="text-muted-foreground text-xs">Table {tableLabel}</p>
          </div>
          <button
            onClick={() => setRequestSheetOpen(true)}
            aria-label="Help"
            className="flex h-8 items-center justify-center rounded-full bg-primary px-4 text-primary-foreground text-xs font-semibold active:opacity-80 transition-opacity"
          >
            Help
          </button>
        </div>
        <CategoryChips
          categories={categories}
          activeId={activeCategoryId}
          onSelect={scrollToCategory}
        />
      </div>

      {/* Scrollable feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto pb-36">
        {categories.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => {
              if (el) categoryRefs.current.set(cat.id, el)
              else categoryRefs.current.delete(cat.id)
            }}
          >
            <h2 className="px-4 pt-5 pb-3 text-base font-bold text-foreground">
              {cat.name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {cat.items.length} item{cat.items.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-3 px-4">
              {cat.items.map((item) => (
                <MenuItemCard key={item.id} item={item} currency={currency} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart FAB */}
      <CartFab
        currency={currency}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        tableLabel={tableLabel}
      />

      {/* Help sheet */}
      <RequestSheet
        open={requestSheetOpen}
        onClose={() => setRequestSheetOpen(false)}
        groupOrderingEnabled={groupOrderingEnabled}
      />
    </div>
  )
}
