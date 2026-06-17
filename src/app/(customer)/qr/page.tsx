import Image from "next/image"
import Link from "next/link"

const RESTAURANT_ID = "83caa5e7-291f-42e5-bcf3-49d1c7930e9b"
const TABLE_ID = "31d2d967-c3a2-4ea1-9f3c-479ae833c5aa"
const TOKEN = "ac139c231dfd2e77eff3fbfde4d09f3ec8dc8d84f7e2fefaa4142ba25e3e7c8a"
const DELIVERY_TOKEN = "7ca90253-9281-4141-9d0e-8b36c79c6fe0"

const DINE_IN_URL = `/menu/${RESTAURANT_ID}/${TABLE_ID}?t=${TOKEN}`
const WHATSAPP_URL = `/wa/${RESTAURANT_ID}/${DELIVERY_TOKEN}`

export default function QRTestPage() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-lg font-bold text-foreground">Resha Bar &amp; Restaurant</h1>
        <p className="text-sm text-muted-foreground">QR Codes &amp; Direct Links</p>
      </div>

      {/* Table 1 dine-in */}
      <div className="rounded-xl border border-border p-4 space-y-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">Table 1 — Dine-in Menu</p>
          <p className="text-xs text-muted-foreground">Scan to order or tap the button below</p>
        </div>
        <div className="flex justify-center">
          <Image src="/qr-table1.png" alt="Table 1 QR" width={200} height={200} className="rounded-lg" />
        </div>
        <Link
          href={DINE_IN_URL}
          className="block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-primary-foreground active:opacity-80"
        >
          Open Table 1 Menu
        </Link>
      </div>

      {/* WhatsApp delivery */}
      <div className="rounded-xl border border-border p-4 space-y-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">WhatsApp Delivery</p>
          <p className="text-xs text-muted-foreground">Scan to open WhatsApp chat or tap the button</p>
        </div>
        <div className="flex justify-center">
          <Image src="/qr-whatsapp.png" alt="WhatsApp QR" width={200} height={200} className="rounded-lg" />
        </div>
        <Link
          href={WHATSAPP_URL}
          className="block w-full rounded-lg bg-[#25D366] py-3 text-center text-sm font-semibold text-white active:opacity-80"
        >
          Open WhatsApp Chat
        </Link>
      </div>
    </div>
  )
}
