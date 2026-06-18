import { createClient } from "@/lib/supabase/server"
import CartPageClient from "@/components/cart/CartPageClient"

export default async function CartPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">No active session. Please scan a QR code.</p>
      </div>
    )
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("restaurant_id, table_id")
    .eq("id", user.id)
    .eq("status", "active")
    .single()

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Session expired. Please scan the QR code again.</p>
      </div>
    )
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, currency")
    .eq("id", session.restaurant_id)
    .single()

  const tableId = session.table_id
  const { data: table } = tableId
    ? await supabase.from("tables").select("label").eq("id", tableId).single()
    : { data: null }

  return (
    <CartPageClient
      restaurantId={session.restaurant_id}
      currency={restaurant?.currency ?? "INR"}
      restaurantName={restaurant?.name ?? ""}
      tableLabel={table?.label ?? ""}
    />
  )
}
