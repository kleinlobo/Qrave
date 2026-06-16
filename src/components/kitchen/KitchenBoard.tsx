"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import KitchenOrderTile from "./KitchenOrderTile"
import type { LiveOrder } from "@/components/dashboard/OrderCard"

const KITCHEN_STATUSES = ["pending", "preparing"]

interface Props {
  restaurantId: string
  staffName: string
  initialOrders: LiveOrder[]
}

export default function KitchenBoard({ restaurantId, staffName, initialOrders }: Props) {
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders)
  const [tick, setTick] = useState(0)

  // Re-render elapsed times every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("orders")
            .select(
              "id, status, estimated_total, submitted_at, table_id, tables(label), order_items(id, item_name_snapshot, quantity, price_snapshot, notes, is_removed)"
            )
            .eq("id", payload.new.id)
            .single()

          if (data && KITCHEN_STATUSES.includes(data.status)) {
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
              .filter((o) => KITCHEN_STATUSES.includes(o.status))
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
        .filter((o) => KITCHEN_STATUSES.includes(o.status))
    )
  }

  // Suppress unused tick warning — it causes re-renders for elapsed times
  void tick

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Kitchen header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-foreground">Kitchen Display</span>
          <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
            Live
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{staffName}</p>
      </header>

      {/* Board */}
      <main className="flex-1 p-6">
        {orders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-6xl">✅</p>
              <p className="text-lg font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">No pending orders</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {orders
              .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
              .map((order) => (
                <KitchenOrderTile
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                />
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
