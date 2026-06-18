"use client"

import { useState, useId } from "react"
import { useCart, type CartItem } from "@/lib/cart/CartContext"
import { formatCurrency } from "@/lib/currency"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

interface Props {
  open: boolean
  onClose: () => void
  currency: string
  restaurantId: string
  onOrderPlaced: (orderId: string) => void
}

export default function CartSheet({
  open,
  onClose,
  currency,
  restaurantId,
  onOrderPlaced,
}: Props) {
  const { items, subtotal, totalItems, addItem, decrementItem, removeItem, setNotes, clear } =
    useCart()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const notesId = useId()

  async function handlePlaceOrder() {
    if (items.length === 0 || submitting) return
    setSubmitting(true)
    setError(null)

    const idempotencyKey = newIdempotencyKey()

    const res = await fetch("/api/order/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        idempotencyKey,
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
      setError(err.error ?? "Failed to place order. Please try again.")
      return
    }

    const { orderId } = await res.json()
    clear()
    onClose()
    onOrderPlaced(orderId)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="h-[80vh] flex flex-col rounded-t-2xl px-0 pb-0 [data-app=customer]_&:bg-background"
      >
        <SheetHeader className="px-5 pt-4 pb-2">
          <SheetTitle className="text-foreground">
            Your order &middot; {totalItems} item{totalItems !== 1 ? "s" : ""}
          </SheetTitle>
        </SheetHeader>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-5 space-y-4">
          {items.map((item) => (
            <CartItemRow
              key={item.menuItemId}
              item={item}
              currency={currency}
              onAdd={() => addItem(item.menuItemId, item.name, item.price)}
              onDecrement={() => decrementItem(item.menuItemId)}
              onRemove={() => removeItem(item.menuItemId)}
              onNotesChange={(notes) => setNotes(item.menuItemId, notes)}
              notesId={notesId}
            />
          ))}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Totals + place order */}
        <div className="px-5 pb-6 pt-4 space-y-4 border-t border-border bg-background">
          <div className="flex justify-between text-sm font-medium text-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>
          <p className="text-xs text-foreground-muted">
            Taxes and charges will be shown on your final bill.
          </p>
          <button
            onClick={handlePlaceOrder}
            disabled={submitting || items.length === 0}
            className="w-full rounded-full bg-primary py-4 text-sm font-semibold text-primary-foreground disabled:opacity-60 active:opacity-80 transition-opacity"
          >
            {submitting ? "Placing order…" : `Place order · ${formatCurrency(subtotal, currency)}`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface CartItemRowProps {
  item: CartItem
  currency: string
  onAdd: () => void
  onDecrement: () => void
  onRemove: () => void
  onNotesChange: (notes: string) => void
  notesId: string
}

function CartItemRow({
  item,
  currency,
  onAdd,
  onDecrement,
  onRemove,
  onNotesChange,
  notesId,
}: CartItemRowProps) {
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {/* Qty controls */}
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={item.quantity === 1 ? onRemove : onDecrement}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground text-lg"
            aria-label="Remove one"
          >
            {item.quantity === 1 ? "×" : "−"}
          </button>
          <span className="w-4 text-center text-sm font-semibold text-foreground">
            {item.quantity}
          </span>
          <button
            onClick={onAdd}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg"
            aria-label="Add one more"
          >
            +
          </button>
        </div>

        {/* Name + price */}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{item.name}</p>
          <p className="text-xs text-foreground-muted">
            {formatCurrency(item.price * item.quantity, currency)}
          </p>
        </div>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="text-xs text-foreground-muted underline underline-offset-2 mt-0.5"
        >
          {showNotes ? "Hide" : "Note"}
        </button>
      </div>

      {showNotes && (
        <Textarea
          id={`${notesId}-${item.menuItemId}`}
          placeholder="e.g. no onions, extra spicy…"
          rows={2}
          value={item.notes ?? ""}
          onChange={(e) => onNotesChange(e.target.value)}
          className="text-sm resize-none"
        />
      )}

      <Separator className="mt-2" />
    </div>
  )
}
