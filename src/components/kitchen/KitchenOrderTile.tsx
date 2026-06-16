"use client"

import { useState } from "react"
import type { LiveOrder } from "@/components/dashboard/OrderCard"

interface Props {
  order: LiveOrder
  onStatusChange: (orderId: string, newStatus: string) => void
}

export default function KitchenOrderTile({ order, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false)
  const tableLabel = order.tables?.label ?? "—"
  const isNew = order.status === "pending"
  const elapsed = getElapsed(order.submitted_at)
  const nextStatus = isNew ? "preparing" : "ready"
  const actionLabel = isNew ? "Accept" : "Done"

  async function handleBump() {
    if (loading) return
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
    <div
      className={`flex flex-col rounded-2xl border-2 p-5 space-y-4 ${
        isNew ? "border-yellow-400 bg-yellow-400/5" : "border-blue-400 bg-blue-400/5"
      }`}
    >
      {/* Table + elapsed */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">Table {tableLabel}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{elapsed}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isNew
              ? "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
              : "bg-blue-400/20 text-blue-700 dark:text-blue-300"
          }`}
        >
          {isNew ? "NEW" : "PREPARING"}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-2 flex-1">
        {order.order_items
          .filter((i) => !i.is_removed)
          .map((item) => (
            <li key={item.id} className="space-y-0.5">
              <p className="text-base font-medium text-foreground">
                {item.quantity}× {item.item_name_snapshot}
              </p>
              {item.notes && (
                <p className="text-sm text-muted-foreground italic pl-4">{item.notes}</p>
              )}
            </li>
          ))}
      </ul>

      {/* Action button */}
      <button
        onClick={handleBump}
        disabled={loading}
        className={`w-full rounded-xl py-3.5 text-base font-bold transition-opacity disabled:opacity-60 active:opacity-70 ${
          isNew
            ? "bg-yellow-400 text-yellow-900"
            : "bg-blue-500 text-white"
        }`}
      >
        {loading ? "…" : actionLabel}
      </button>
    </div>
  )
}

function getElapsed(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  const mins = Math.floor(diff / 60)
  return `${mins}m ago`
}
