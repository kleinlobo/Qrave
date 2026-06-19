"use client"

import { useEffect, useRef, useState } from "react"
import CategoryChips from "./CategoryChips"
import MenuItemCard from "./MenuItemCard"
import CartFab from "@/components/cart/CartFab"
import OrderStatusSheet from "@/components/order/OrderStatusSheet"
import RequestSheet from "@/components/requests/RequestSheet"
import RecommendationStrip from "./RecommendationStrip"
import type { MenuCategory, MenuItem } from "@/lib/menu/types"

interface Props {
  categories: MenuCategory[]
  currency: string
  restaurantName: string
  restaurantId: string
  tableLabel: string
  groupOrderingEnabled: boolean
  whatsappNumber?: string | null
}

interface FlatItem extends MenuItem {
  categoryId: string
}

export default function MenuFeed({ categories, currency, restaurantName, restaurantId, tableLabel, groupOrderingEnabled, whatsappNumber }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  )
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [requestSheetOpen, setRequestSheetOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  const feedRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const allItems: FlatItem[] = categories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryId: cat.id }))
  )

  useEffect(() => {
    const feed = feedRef.current
    if (!feed || allItems.length === 0) return

    const observers: IntersectionObserver[] = []

    allItems.forEach((item) => {
      const el = itemRefs.current.get(item.id)
      if (!el) return

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCategoryId(item.categoryId)
            setActiveItemId(item.id)
          }
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

  function scrollToItem(itemId: string) {
    const el = itemRefs.current.get(itemId)
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
    <div className="relative h-screen overflow-hidden">
      {/* Sticky header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center justify-between px-5 pt-4 pb-1">
            <p className="text-white text-sm font-semibold truncate">{restaurantName}</p>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <p className="text-white/70 text-xs">Table {tableLabel}</p>
              <button
                onClick={() => setRequestSheetOpen(true)}
                aria-label="More options"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/90 active:bg-black/60 transition-colors"
              >
                <span className="text-base leading-none">···</span>
              </button>
            </div>
          </div>
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

      {/* Cart FAB — navigates to /cart page */}
      <CartFab
        currency={currency}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        tableLabel={tableLabel}
      />

      {/* Order status sheet */}
      <OrderStatusSheet
        orderId={activeOrderId}
        currency={currency}
        whatsappNumber={whatsappNumber}
        onClose={() => setActiveOrderId(null)}
      />

      {/* AI recommendations strip */}
      <RecommendationStrip
        currentItemId={activeItemId}
        restaurantId={restaurantId}
        allItems={allItems}
        currency={currency}
        onJumpTo={scrollToItem}
      />

      {/* Waiter / bill / group requests */}
      <RequestSheet
        open={requestSheetOpen}
        onClose={() => setRequestSheetOpen(false)}
        groupOrderingEnabled={groupOrderingEnabled}
      />
    </div>
  )
}
