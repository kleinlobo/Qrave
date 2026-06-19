import CartPageClient from "@/components/cart/CartPageClient"

interface Props {
  searchParams: { rid?: string; cur?: string; rname?: string; table?: string }
}

export default function CartPage({ searchParams }: Props) {
  const restaurantId = searchParams.rid ?? ""
  const currency = searchParams.cur ?? "INR"
  const restaurantName = searchParams.rname ?? ""
  const tableLabel = searchParams.table ?? ""

  return (
    <CartPageClient
      restaurantId={restaurantId}
      currency={currency}
      restaurantName={restaurantName}
      tableLabel={tableLabel}
    />
  )
}
