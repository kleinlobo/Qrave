import { redirect } from "next/navigation"
import Link from "next/link"
import type { ReactNode } from "react"
import { getStaffUser } from "@/lib/auth/get-staff-user"
import SignOutButton from "@/components/dashboard/SignOutButton"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staffUser = await getStaffUser()

  if (!staffUser) redirect("/login")
  if (staffUser.role !== "platform_admin") redirect("/dashboard")

  return (
    <div data-app="internal" className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-base font-bold text-foreground tracking-tight">
            Qrave <span className="text-xs font-normal text-muted-foreground">Platform Admin</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <AdminNavLink href="/admin/restaurants">Restaurants</AdminNavLink>
            <AdminNavLink href="/admin/audit-log">Audit Log</AdminNavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden md:block text-sm text-muted-foreground">{staffUser.name}</p>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

function AdminNavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  )
}
