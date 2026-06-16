import type { ReactNode } from "react"

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div data-app="customer" className="min-h-screen bg-background">
      {children}
    </div>
  )
}
