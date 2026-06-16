import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { getStaffUser } from "@/lib/auth/get-staff-user"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staffUser = await getStaffUser()

  if (!staffUser) redirect("/login")
  if (staffUser.role !== "platform_admin") redirect("/dashboard")

  return (
    <div data-app="internal" className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
