"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/cart/CartContext"
import { formatCurrency } from "@/lib/currency"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  restaurantId: string
  currency: string
  restaurantName: string
  tableLabel: string
}

export default function CartPageClient({ restaurantId, currency, restaurantName, tableLabel }: Props) {
  const router = useRouter()
  const { items, subtotal, totalItems, ready, addItem, decrementItem, removeItem, setNotes, clear } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePlaceOrder() {
    if (items.length === 0 || submitting) return
    setSubmitting(true)
    setError(null)

    const res = await fetch("/api/order/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        idempotencyKey: crypto.randomUUID(),
        items: items.map((i) => ({
          menu_item_id: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes ?? null,
        })),
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg: string = err.error ?? "Failed to place order. Please try again."
      // Session expired — send them back to the menu which will refresh the session
      if (msg.includes("Session expired") || msg.includes("No active session")) {
        setError("Your session expired. Go back to the menu and try again.")
      } else {
        setError(msg)
      }
      return
    }

    clear()
    router.back()
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground active:opacity-70"
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">Your Cart</h1>
          {restaurantName && (
            <p className="text-xs text-muted-foreground">
              {restaurantName}{tableLabel ? ` · Table ${tableLabel}` : ""}
            </p>
          )}
        </div>
        {totalItems > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">
            {totalItems} item{totalItems !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag size={28} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Go back to the menu to add items</p>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground active:opacity-80"
          >
            Browse menu
          </button>
        </div>
      ) : (
        <>
          {/* Item list */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {items.map((item, idx) => (
              <div key={item.menuItemId}>
                <CartItemRow
                  item={item}
                  currency={currency}
                  onAdd={() => addItem(item.menuItemId, item.name, item.price)}
                  onDecrement={() => decrementItem(item.menuItemId)}
                  onRemove={() => removeItem(item.menuItemId)}
                  onNotesChange={(notes) => setNotes(item.menuItemId, notes)}
                />
                {idx < items.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-background px-4 pt-4 pb-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Taxes and service charges will be added to your final bill.
            </p>

            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive space-y-2">
                <p>{error}</p>
                {(error.includes("expired") || error.includes("session")) && (
                  <button
                    onClick={() => router.back()}
                    className="text-xs font-semibold underline underline-offset-2"
                  >
                    Go back to menu →
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-60 active:opacity-80 transition-opacity"
            >
              {submitting ? "Placing order…" : `Place order · ${formatCurrency(subtotal, currency)}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

interface CartItemRowProps {
  item: { menuItemId: string; name: string; price: number; quantity: number; notes?: string }
  currency: string
  onAdd: () => void
  onDecrement: () => void
  onRemove: () => void
  onNotesChange: (notes: string) => void
}

function CartItemRow({ item, currency, onAdd, onDecrement, onRemove, onNotesChange }: CartItemRowProps) {
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center gap-3">
        {/* Qty controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={item.quantity === 1 ? onRemove : onDecrement}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground text-lg active:bg-muted"
            aria-label="Remove one"
          >
            {item.quantity === 1 ? "×" : "−"}
          </button>
          <span className="w-5 text-center text-sm font-bold text-foreground">
            {item.quantity}
          </span>
          <button
            onClick={onAdd}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg active:opacity-80"
            aria-label="Add one more"
          >
            +
          </button>
        </div>

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(item.price, currency)} each
          </p>
        </div>

        {/* Line total */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(item.price * item.quantity, currency)}
          </p>
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            {showNotes ? "Hide note" : "Add note"}
          </button>
        </div>
      </div>

      {showNotes && (
        <Textarea
          placeholder="e.g. no onions, extra spicy…"
          rows={2}
          value={item.notes ?? ""}
          onChange={(e) => onNotesChange(e.target.value)}
          className="text-sm resize-none"
        />
      )}
    </div>
  )
}
