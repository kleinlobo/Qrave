import { createServiceClient } from "@/lib/supabase/server"
import { getStaffUser } from "@/lib/auth/get-staff-user"
import type { Json } from "@/types/database"

export const dynamic = "force-dynamic"

function formatDetails(details: Json): string {
  if (!details) return ""
  try {
    return JSON.stringify(details, null, 0)
      .replace(/^\{/, "")
      .replace(/\}$/, "")
      .replace(/"/g, "")
      .slice(0, 120)
  } catch {
    return ""
  }
}

export default async function AuditLogPage() {
  const staffUser = await getStaffUser()
  if (!staffUser || staffUser.role !== "platform_admin") return null

  const supabase = createServiceClient()
  const { data: entries } = await supabase
    .from("admin_audit_log")
    .select(
      "id, action, created_at, details, restaurant_id, admin_id, staff_users!admin_id(name)"
    )
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Last 100 admin actions</p>
      </div>

      {(entries ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit entries yet.</p>
      ) : (
        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {(entries ?? []).map((entry) => {
            const adminName =
              (entry.staff_users as { name?: string } | null)?.name ?? entry.admin_id.slice(0, 8)
            const details = formatDetails(entry.details)
            return (
              <div key={entry.id} className="flex items-start gap-4 px-4 py-3">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{entry.action}</p>
                    <span className="text-xs text-muted-foreground">by {adminName}</span>
                  </div>
                  {details && (
                    <p className="text-xs text-muted-foreground truncate">{details}</p>
                  )}
                  {entry.restaurant_id && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {entry.restaurant_id.slice(0, 8)}
                    </p>
                  )}
                </div>
                <time
                  dateTime={entry.created_at}
                  className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap"
                >
                  {new Date(entry.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
