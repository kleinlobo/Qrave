"use client"

import { useState } from "react"

const SUBSCRIPTION_STATUSES = ["trial", "active", "suspended", "cancelled"] as const
const FEATURE_FLAGS = [
  { key: "ai_recommendations", label: "AI Recommendations" },
  { key: "group_ordering", label: "Group Ordering" },
  { key: "delivery_qr", label: "Delivery QR" },
] as const

interface Props {
  restaurantId: string
  currentStatus: string
  maintenanceMode: boolean
  featureFlags: Record<string, boolean>
  trialEndsAt: string | null
}

export default function RestaurantActions({
  restaurantId,
  currentStatus,
  maintenanceMode,
  featureFlags,
  trialEndsAt,
}: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [maintenance, setMaintenance] = useState(maintenanceMode)
  const [flags, setFlags] = useState<Record<string, boolean>>(featureFlags)
  const [note, setNote] = useState("")
  const [trialEnd, setTrialEnd] = useState(
    trialEndsAt ? trialEndsAt.slice(0, 10) : ""
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  async function call(action: string, extra: Record<string, unknown>) {
    setBusy(action)
    setMsg(null)
    const res = await fetch(`/api/admin/restaurants/${restaurantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    })
    setBusy(null)
    if (res.ok) {
      setMsg({ type: "ok", text: "Saved" })
    } else {
      const err = await res.json().catch(() => ({}))
      setMsg({ type: "err", text: err.error ?? "Error" })
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            msg.type === "ok"
              ? "bg-green-500/10 text-green-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* Subscription status */}
      <section className="rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Subscription</h3>
        <div className="flex flex-wrap gap-2">
          {SUBSCRIPTION_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                status === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (e.g. 'payment received')"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          disabled={busy === "set_subscription"}
          onClick={() => call("set_subscription", { status, note: note || undefined })}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy === "set_subscription" ? "Saving…" : "Apply status"}
        </button>
      </section>

      {/* Trial extension */}
      <section className="rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Extend trial</h3>
        <input
          type="date"
          value={trialEnd}
          onChange={(e) => setTrialEnd(e.target.value)}
          className="flex h-9 w-auto rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          disabled={!trialEnd || busy === "extend_trial"}
          onClick={() =>
            call("extend_trial", { trial_end: new Date(trialEnd).toISOString() })
          }
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy === "extend_trial" ? "Saving…" : "Set trial end date"}
        </button>
      </section>

      {/* Maintenance mode */}
      <section className="rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Maintenance mode</h3>
        <div className="flex items-center gap-3">
          <button
            role="switch"
            aria-checked={maintenance}
            onClick={() => {
              const next = !maintenance
              setMaintenance(next)
              call("set_maintenance", { value: next })
            }}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              maintenance ? "bg-destructive" : "bg-input"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                maintenance ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm text-foreground">
            {maintenance ? "Maintenance ON — menu hidden from customers" : "Normal operation"}
          </span>
        </div>
      </section>

      {/* Feature flags */}
      <section className="rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Feature flags</h3>
        <div className="space-y-2">
          {FEATURE_FLAGS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <button
                role="switch"
                aria-checked={!!flags[key]}
                onClick={() => {
                  const next = !flags[key]
                  setFlags((prev) => ({ ...prev, [key]: next }))
                  call("set_feature_flag", { flag: key, value: next })
                }}
                className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                  flags[key] ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    flags[key] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
