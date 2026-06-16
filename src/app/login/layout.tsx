import type { ReactNode } from "react"

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div data-app="internal" className="min-h-screen bg-background">
      {children}
    </div>
  )
}
