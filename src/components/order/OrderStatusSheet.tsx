"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/currency"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { Tables } from "@/types"

type Order = Pick<
  Tables<"orders">,
  "id" | "status" | "subtotal" | "vat_amount" | "service_amount" | "estimated_total" | "submitted_at"
>

const STATUS_LABEL: Record<string, string> = {
  pending: "Received",
  preparing: "Being prepared",
  ready: "Ready!",
  delivered: "Delivered",
}

const STATUS_COLOR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  preparing: "default",
  ready: "default",
  delivered: "outline",
}

interface Props {
  orderId: string | null
  currency: string
  onClose: () => void
}

export default function OrderStatusSheet({ orderId, currency, onClose }: Props) {
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()

    // Initial fetch
    supabase
      .from("orders")
      .select("id, status, subtotal, vat_amount, service_amount, estimated_total, submitted_at")
      .eq("id", orderId)
      .single()
      .then(({ data }) => { if (data) setOrder(data) })

    // Real-time subscription — RLS ensures we only receive our own row
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...(payload.new as Partial<Order>) } : null)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  const open = !!orderId

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        className="h-auto rounded-t-2xl pb-10 px-5"
      >
        <SheetHeader className="mb-4 mt-2">
          <SheetTitle className="text-foreground">Order status</SheetTitle>
        </SheetHeader>

        {!order ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status badge */}
            <div className="flex items-center gap-3">
              <Badge
                variant={STATUS_COLOR[order.status] ?? "secondary"}
                className={`text-sm px-3 py-1 ${order.status === "ready" ? "animate-[status-flash_1s_ease-in-out_3]" : ""}`}
              >
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
              <span className="text-xs text-foreground-muted">
                {new Date(order.submitted_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal ?? 0, currency)}</span>
              </div>
              {(order.vat_amount ?? 0) > 0 && (
                <div className="flex justify-between text-foreground-muted">
                  <span>VAT</span>
                  <span>{formatCurrency(order.vat_amount ?? 0, currency)}</span>
                </div>
              )}
              {(order.service_amount ?? 0) > 0 && (
                <div className="flex justify-between text-foreground-muted">
                  <span>Service charge</span>
                  <span>{formatCurrency(order.service_amount ?? 0, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(order.estimated_total ?? 0, currency)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-full border border-border py-3.5 text-sm font-medium text-foreground active:bg-surface-muted transition-colors"
            >
              Back to menu
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
