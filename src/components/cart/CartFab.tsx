"use client"

import { ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart/CartContext"
import { formatCurrency } from "@/lib/currency"

interface Props {
  currency: string
  onOpen: () => void
  hidden?: boolean
}

export default function CartFab({ currency, onOpen, hidden }: Props) {
  const { totalItems, subtotal } = useCart()

  if (totalItems === 0 || hidden) return null

  return (
    <button
      onClick={onOpen}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%_-_2rem)] max-w-[398px] z-50 flex items-center justify-between rounded-full bg-primary px-5 py-4 shadow-lg active:opacity-90 transition-opacity animate-fade-in"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <ShoppingBag size={14} className="text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-primary-foreground">
          {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
      </div>
      <span className="text-sm font-semibold text-primary-foreground">
        {formatCurrency(subtotal, currency)}
      </span>
    </button>
  )
}
