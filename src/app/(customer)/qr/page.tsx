import { headers } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { signQRToken } from "@/lib/qr"
import QRCode from "qrcode"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function QRTestPage() {
  const supabase = createServiceClient()

  // Fetch restaurant
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, whatsapp_number, delivery_qr_token")
    .single()

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">No restaurant configured.</p>
      </div>
    )
  }

  // Fetch active tables
  const { data: tables } = await supabase
    .from("tables")
    .select("id, label")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("label")

  // Derive base URL from request headers
  const headersList = headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const proto = headersList.get("x-forwarded-proto") ?? "http"
  const baseUrl = `${proto}://${host}`

  // Build signed QR data URLs for each table
  const tableQRs = await Promise.all(
    (tables ?? []).map(async (t) => {
      const sig = await signQRToken(restaurant.id, t.id)
      const menuUrl = `${baseUrl}/menu/${restaurant.id}/${t.id}?t=${sig}`
      const dataUrl = await QRCode.toDataURL(menuUrl, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#0a0a0a", light: "#ffffff" },
      })
      return { id: t.id, label: t.label, menuUrl, dataUrl }
    })
  )

  // WhatsApp delivery QR
  const waDataUrl =
    restaurant.delivery_qr_token && restaurant.whatsapp_number
      ? await QRCode.toDataURL(`${baseUrl}/wa/${restaurant.id}/${restaurant.delivery_qr_token}`, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#0a0a0a", light: "#ffffff" },
        })
      : null
  const waUrl = restaurant.delivery_qr_token
    ? `/wa/${restaurant.id}/${restaurant.delivery_qr_token}`
    : null

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 max-w-sm mx-auto">
      <div className="text-center space-y-1 pt-2">
        <h1 className="text-lg font-bold text-foreground">{restaurant.name}</h1>
        <p className="text-sm text-muted-foreground">QR Codes &amp; Direct Links</p>
      </div>

      {tableQRs.map((t) => (
        <div key={t.id} className="rounded-xl border border-border p-4 space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Table {t.label} — Dine-in</p>
            <p className="text-xs text-muted-foreground">Scan or tap to open the menu</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex justify-center">
            <img src={t.dataUrl} alt={`Table ${t.label} QR`} width={200} height={200} className="rounded-lg" />
          </div>
          <Link
            href={t.menuUrl}
            className="block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-primary-foreground active:opacity-80"
          >
            Open Table {t.label} Menu
          </Link>
        </div>
      ))}

      {waDataUrl && waUrl && (
        <div className="rounded-xl border border-border p-4 space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">WhatsApp Delivery</p>
            <p className="text-xs text-muted-foreground">Scan or tap to open WhatsApp</p>
          </div>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={waDataUrl} alt="WhatsApp QR" width={200} height={200} className="rounded-lg" />
          </div>
          <Link
            href={waUrl}
            className="block w-full rounded-lg bg-[#25D366] py-3 text-center text-sm font-semibold text-white active:opacity-80"
          >
            Open WhatsApp Chat
          </Link>
        </div>
      )}
    </div>
  )
}
