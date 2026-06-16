import { notFound, redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"

interface Props {
  params: { restaurantId: string; deliveryToken: string }
}

export default async function DeliveryWhatsAppPage({ params }: Props) {
  const { restaurantId, deliveryToken } = params

  const supabase = createServiceClient()

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, whatsapp_number, delivery_qr_token")
    .eq("id", restaurantId)
    .eq("delivery_qr_token", deliveryToken)
    .single()

  if (!restaurant?.whatsapp_number) notFound()

  const message = encodeURIComponent(
    `Hi ${restaurant.name}! I'd like to place an order. Could you please share the available options?`
  )

  // wa.me requires digits only (no +, spaces, or dashes)
  const phone = restaurant.whatsapp_number.replace(/\D/g, "")

  redirect(`https://wa.me/${phone}?text=${message}`)
}
