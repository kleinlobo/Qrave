"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import OrderCard, { type LiveOrder } from "./OrderCard"

const ACTIVE_STATUSES = ["pending", "preparing", "ready"]

interface Props {
  restaurantId: string
  currency: string
  initialOrders: LiveOrder[]
}

export default function LiveOrderBoard({ restaurantId, currency, initialOrders }: Props) {
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("live-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          // Fetch the new order with items + table label
          const { data } = await supabase
            .from("orders")
            .select(
              "id, status, estimated_total, submitted_at, table_id, tables(label), order_items(id, item_name_snapshot, quantity, price_snapshot, notes, is_removed)"
            )
            .eq("id", payload.new.id)
            .single()

          if (data && ACTIVE_STATUSES.includes(data.status)) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === data.id)) return prev
              return [data as LiveOrder, ...prev]
            })
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; status: string }
          setOrders((prev) =>
            prev
              .map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
              .filter((o) => ACTIVE_STATUSES.includes(o.status))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  function handleStatusChange(orderId: string, newStatus: string) {
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        .filter((o) => ACTIVE_STATUSES.includes(o.status))
    )
  }

  const byStatus = {
    pending: orders.filter((o) => o.status === "pending"),
    preparing: orders.filter((o) => o.status === "preparing"),
    ready: orders.filter((o) => o.status === "ready"),
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="text-center space-y-2">
          <p className="text-4xl">🍽️</p>
          <p className="text-sm text-muted-foreground">No active orders right now</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <OrderColumn title="New" count={byStatus.pending.length} accent="border-yellow-400">
        {byStatus.pending.map((o) => (
          <OrderCard key={o.id} order={o} currency={currency} onStatusChange={handleStatusChange} />
        ))}
      </OrderColumn>

      <OrderColumn title="Preparing" count={byStatus.preparing.length} accent="border-blue-400">
        {byStatus.preparing.map((o) => (
          <OrderCard key={o.id} order={o} currency={currency} onStatusChange={handleStatusChange} />
        ))}
      </OrderColumn>

      <OrderColumn title="Ready" count={byStatus.ready.length} accent="border-green-400">
        {byStatus.ready.map((o) => (
          <OrderCard key={o.id} order={o} currency={currency} onStatusChange={handleStatusChange} />
        ))}
      </OrderColumn>
    </div>
  )
}

function OrderColumn({
  title,
  count,
  accent,
  children,
}: {
  title: string
  count: number
  accent: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 pb-2 border-b-2 ${accent}`}>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {count === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Empty</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
