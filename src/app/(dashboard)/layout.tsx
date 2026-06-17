import { redirect } from "next/navigation"
import Link from "next/link"
import type { ReactNode } from "react"
import { getStaffUser } from "@/lib/auth/get-staff-user"
import SignOutButton from "@/components/dashboard/SignOutButton"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const staffUser = await getStaffUser()

  if (!staffUser) redirect("/login")
  if (staffUser.role === "platform_admin") redirect("/admin")
  if (staffUser.role === "kitchen_staff") redirect("/kitchen")

  return (
    <div data-app="internal" className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-base font-bold text-foreground tracking-tight">
            Qrave
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard">Orders</NavLink>
            <NavLink href="/dashboard/menu">Menu</NavLink>
            <NavLink href="/dashboard/tables">Tables</NavLink>
            <NavLink href="/dashboard/staff">Staff</NavLink>
            <NavLink href="/dashboard/analytics">Analytics</NavLink>
            <NavLink href="/dashboard/settings">Settings</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden md:block text-sm text-muted-foreground">
            {staffUser.name} &middot; {staffUser.role}
          </p>
          <SignOutButton />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  )
}
