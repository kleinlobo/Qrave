"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/currency"
import { Badge } from "@/components/ui/badge"

export type LiveOrderItem = {
  id: string
  item_name_snapshot: string
  quantity: number
  price_snapshot: number
  notes: string | null
  is_removed: boolean
}

export type LiveOrder = {
  id: string
  status: string
  estimated_total: number
  submitted_at: string
  table_id: string | null
  tables: { label: string } | null
  order_items: LiveOrderItem[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: "New",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
}

const STATUS_NEXT: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
}

const STATUS_NEXT_LABEL: Record<string, string> = {
  pending: "Start preparing",
  preparing: "Mark ready",
  ready: "Mark delivered",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  pending: "default",
  preparing: "secondary",
  ready: "default",
  delivered: "outline",
}

interface Props {
  order: LiveOrder
  currency: string
  onStatusChange: (orderId: string, newStatus: string) => void
}

export default function OrderCard({ order, currency, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false)

  const visibleItems = order.order_items.filter((i) => !i.is_removed)
  const tableLabel = order.tables?.label ?? "—"
  const nextStatus = STATUS_NEXT[order.status]
  const elapsed = getElapsed(order.submitted_at)

  async function handleBump() {
    if (!nextStatus || loading) return
    setLoading(true)
    try {
      await fetch("/api/order/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, newStatus: nextStatus }),
      })
      onStatusChange(order.id, nextStatus)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Table {tableLabel}</p>
          <p className="text-xs text-muted-foreground">{elapsed}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
          {STATUS_LABEL[order.status] ?? order.status}
        </Badge>
      </div>

      {/* Items */}
      <ul className="space-y-1 flex-1">
        {visibleItems.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2 text-sm">
            <span className="text-foreground">
              <span className="font-medium">{item.quantity}×</span> {item.item_name_snapshot}
            </span>
            <span className="text-muted-foreground flex-shrink-0">
              {formatCurrency(item.price_snapshot * item.quantity, currency)}
            </span>
          </li>
        ))}
        {visibleItems.some((i) => i.notes) && (
          <li className="mt-1">
            {visibleItems
              .filter((i) => i.notes)
              .map((i) => (
                <p key={i.id} className="text-xs text-muted-foreground italic">
                  {i.item_name_snapshot}: {i.notes}
                </p>
              ))}
          </li>
        )}
      </ul>

      {/* Total + action */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(order.estimated_total, currency)}
        </span>
        {nextStatus && (
          <button
            onClick={handleBump}
            disabled={loading}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60 active:opacity-80 transition-opacity"
          >
            {loading ? "…" : STATUS_NEXT_LABEL[order.status]}
          </button>
        )}
      </div>
    </div>
  )
}

function getElapsed(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}
