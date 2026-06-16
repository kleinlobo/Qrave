import { headers } from "next/headers"
import { getStaffUser } from "@/lib/auth/get-staff-user"
import { createClient } from "@/lib/supabase/server"
import { signQRToken, buildTableQRUrl } from "@/lib/qr"
import TableManager from "@/components/dashboard/tables/TableManager"
import type { MgmtTable } from "@/components/dashboard/tables/TableDialog"

export const dynamic = "force-dynamic"

export default async function TablesPage() {
  const staffUser = await getStaffUser()
  if (!staffUser) return null

  const restaurantId = staffUser.restaurant_id
  if (!restaurantId) return null

  const supabase = createClient()
  const { data: tables } = await supabase
    .from("tables")
    .select("id, label, qr_token, is_active")
    .eq("restaurant_id", restaurantId)
    .order("label")

  // Derive base URL from request headers (works in any deployment)
  const headersList = headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const proto = headersList.get("x-forwarded-proto") ?? "http"
  const baseUrl = `${proto}://${host}`

  // Pre-sign all QR URLs server-side (QR_SIGNING_SECRET is server-only)
  const signedTables: MgmtTable[] = await Promise.all(
    (tables ?? []).map(async (t) => {
      const sig = await signQRToken(restaurantId, t.id)
      return { ...t, qrUrl: buildTableQRUrl(baseUrl, restaurantId, t.id, sig) }
    })
  )

  return (
    <div className="p-4 md:p-6">
      <TableManager restaurantId={restaurantId} initialTables={signedTables} />
    </div>
  )
}
