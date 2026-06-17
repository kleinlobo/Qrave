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
  whatsappNumber?: string | null
  onClose: () => void
}

export default function OrderStatusSheet({ orderId, currency, whatsappNumber, onClose }: Props) {
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

            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hi! I just placed an order at your restaurant. Order reference: " + order.id.slice(0, 8).toUpperCase())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-sm font-semibold text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.535 5.854L.057 23.272a.75.75 0 0 0 .92.92l5.418-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 0 1-4.98-1.37l-.357-.213-3.706 1.01 1.011-3.706-.213-.357A9.714 9.714 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                </svg>
                Message us on WhatsApp
              </a>
            )}

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
