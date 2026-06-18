import type { ReactNode } from "react"
import { CartProvider } from "@/lib/cart/CartContext"

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div data-app="customer" className="relative w-full max-w-[430px] min-h-screen bg-background overflow-hidden">
        <CartProvider>
          {children}
        </CartProvider>
      </div>
    </div>
  )
}
