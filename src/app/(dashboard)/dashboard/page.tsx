import { getStaffUser } from "@/lib/auth/get-staff-user"

export default async function DashboardPage() {
  const staff = await getStaffUser()

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Restaurant Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Signed in as {staff?.name} &middot; {staff?.role}
        </p>
      </div>
    </main>
  )
}
