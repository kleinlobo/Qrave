"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, Receipt, X } from "lucide-react"

interface StaffRequest {
  id: string
  request_type: "waiter" | "bill"
  requested_at: string
  acknowledged_at: string | null
  table_id: string
  tables: { label: string } | null
}

interface Props {
  restaurantId: string
  initialRequests: StaffRequest[]
}

export default function LiveRequestsPanel({ restaurantId, initialRequests }: Props) {
  const [requests, setRequests] = useState<StaffRequest[]>(
    initialRequests.filter((r) => !r.acknowledged_at)
  )
  const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Poll the server-side API (service role) so requests always appear
    // regardless of the browser client's auth state or RLS.
    async function fetchRequests() {
      try {
        const res = await fetch("/api/dashboard/requests")
        if (!res.ok) return
        const { requests: data } = await res.json() as { requests: StaffRequest[] }
        setRequests(data)
      } catch {}
    }

    fetchRequests() // immediate first fetch
    const pollInterval = setInterval(fetchRequests, 8_000)

    // Also try Realtime for instant updates (best-effort — may not fire if
    // the publication isn't set up on the live DB or auth is wrong).
    const supabase = createClient()
    const channel = supabase
      .channel(`live-requests-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "requests" },
        (payload) => {
          const newRow = payload.new as { id: string; restaurant_id: string }
          if (newRow.restaurant_id !== restaurantId) return
          // Re-fetch from server to get fully populated row (including table label)
          fetchRequests()
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "requests" },
        (payload) => {
          const updated = payload.new as { id: string; restaurant_id: string; acknowledged_at: string | null }
          if (updated.restaurant_id !== restaurantId) return
          if (updated.acknowledged_at) {
            setRequests((prev) => prev.filter((r) => r.id !== updated.id))
          }
        }
      )
      .subscribe()

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  async function acknowledge(id: string) {
    setAcknowledging((s) => new Set(s).add(id))
    try {
      await fetch(`/api/request/${id}`, { method: "PATCH" })
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setAcknowledging((s) => { const next = new Set(s); next.delete(id); return next })
    }
  }

  if (requests.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">
          Table Requests <span className="text-muted-foreground font-normal">({requests.length})</span>
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {requests.map((req) => (
          <RequestAlert key={req.id} request={req} loading={acknowledging.has(req.id)} onDone={() => acknowledge(req.id)} />
        ))}
      </div>
    </div>
  )
}

function RequestAlert({
  request,
  loading,
  onDone,
}: {
  request: StaffRequest
  loading: boolean
  onDone: () => void
}) {
  const isWaiter = request.request_type === "waiter"
  const tableLabel = request.tables?.label ?? request.table_id.slice(0, 6)
  const minutesAgo = Math.floor((Date.now() - new Date(request.requested_at).getTime()) / 60000)

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
      isWaiter ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"
    }`}>
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
        isWaiter ? "bg-yellow-100" : "bg-blue-100"
      }`}>
        {isWaiter
          ? <Bell size={16} className="text-yellow-700" />
          : <Receipt size={16} className="text-blue-700" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isWaiter ? "text-yellow-900" : "text-blue-900"}`}>
          {isWaiter ? "Waiter requested" : "Bill requested"}
        </p>
        <p className={`text-xs ${isWaiter ? "text-yellow-700" : "text-blue-700"}`}>
          Table {tableLabel} · {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`}
        </p>
      </div>

      <button
        onClick={onDone}
        disabled={loading}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-50 ${
          isWaiter ? "bg-yellow-200 hover:bg-yellow-300 text-yellow-900" : "bg-blue-200 hover:bg-blue-300 text-blue-900"
        }`}
        aria-label="Mark done"
      >
        {loading
          ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          : <X size={14} />
        }
      </button>
    </div>
  )
}
