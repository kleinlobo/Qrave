import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { getStaffUser } from "@/lib/auth/get-staff-user"

export default async function KitchenLayout({ children }: { children: ReactNode }) {
  const staffUser = await getStaffUser()

  if (!staffUser) redirect("/login")

  if (staffUser.role === "platform_admin") redirect("/admin")
  if (!["kitchen_staff", "owner", "manager"].includes(staffUser.role)) {
    redirect("/dashboard")
  }

  return (
    <div data-app="internal" className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
