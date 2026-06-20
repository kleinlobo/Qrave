"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useCart } from "@/lib/cart/CartContext"

interface OrderCtx {
  orderId: string
  restaurantName: string
  tableLabel: string
  currency: string
}

const STATUS_CONFIG: Record<string, { label: string; emoji: string; teal: boolean }> = {
  pending:   { label: "Order received",  emoji: "🧾", teal: false },
  preparing: { label: "Being prepared",  emoji: "👨‍🍳", teal: false },
  ready:     { label: "Ready to serve!", emoji: "🎉", teal: true  },
  delivered: { label: "Delivered",       emoji: "✅", teal: false },
}

export default function OrderStatusBar() {
  const { totalItems } = useCart()
  const [ctx, setCtx] = useState<OrderCtx | null>(null)
  const [status, setStatus] = useState<string>("pending")

  // Load persisted order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("qrave-active-order")
      if (!saved) return
      const parsed = JSON.parse(saved) as OrderCtx
      setCtx(parsed)
    } catch {}
  }, [])

  // Subscribe to order status once ctx is set
  useEffect(() => {
    if (!ctx) return
    const supabase = createClient()

    supabase
      .from("orders")
      .select("status")
      .eq("id", ctx.orderId)
      .single()
      .then(({ data }) => {
        if (!data) return
        setStatus(data.status)
        if (data.status === "delivered") dismiss()
      })

    const channel = supabase
      .channel(`order-bar-${ctx.orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${ctx.orderId}` },
        (payload) => {
          const s = (payload.new as { status: string }).status
          setStatus(s)
          if (s === "delivered") dismiss()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ctx])

  function dismiss() {
    try { localStorage.removeItem("qrave-active-order") } catch {}
    setCtx(null)
  }

  if (!ctx) return null

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const isReady = status === "ready"
  // Position above CartFab when cart has items
  const bottomClass = totalItems > 0 ? "bottom-[92px]" : "bottom-6"

  return (
    <div
      className={`fixed ${bottomClass} left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[398px] z-40 transition-all duration-300`}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ${
          isReady
            ? "bg-primary text-primary-foreground"
            : "bg-foreground text-background"
        }`}
      >
        {/* Pulsing dot */}
        {!isReady && (
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
        )}

        {/* Emoji */}
        <span className="text-lg leading-none flex-shrink-0">{config.emoji}</span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight truncate ${isReady ? "text-primary-foreground" : "text-background"}`}>
            {config.label}
          </p>
          <p className={`text-xs truncate ${isReady ? "text-primary-foreground/80" : "text-background/60"}`}>
            Table {ctx.tableLabel}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
            isReady ? "bg-white/20 text-primary-foreground" : "bg-white/10 text-background/70"
          } active:opacity-70`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
