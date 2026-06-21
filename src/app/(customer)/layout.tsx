import type { ReactNode } from "react"
import { CartProvider } from "@/lib/cart/CartContext"
import { CustomerTheme } from "@/components/CustomerTheme"

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex justify-center">
      {/* Sets data-app="customer" on document.body so Radix portals inherit CSS variables */}
      <CustomerTheme />
      <div data-app="customer" className="relative w-full max-w-[430px] min-h-screen bg-background overflow-hidden">
        <CartProvider>
          {children}
        </CartProvider>
      </div>
    </div>
  )
}
