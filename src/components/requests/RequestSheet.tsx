"use client"

import { useState, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type RequestStatus = "idle" | "loading" | "sent" | "error"

interface Props {
  open: boolean
  onClose: () => void
  groupOrderingEnabled: boolean
}

export default function RequestSheet({ open, onClose, groupOrderingEnabled }: Props) {
  const [waiterStatus, setWaiterStatus] = useState<RequestStatus>("idle")
  const [billStatus, setBillStatus] = useState<RequestStatus>("idle")
  const [groupId, setGroupId] = useState<string | null>(null)
  const [joinLoading, setJoinLoading] = useState(false)

  const sendRequest = useCallback(
    async (type: "waiter_call" | "bill_request", setStatus: (s: RequestStatus) => void) => {
      setStatus("loading")
      try {
        const res = await fetch("/api/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestType: type }),
        })
        if (!res.ok) throw new Error()
        setStatus("sent")
        setTimeout(() => setStatus("idle"), 30_000)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 3_000)
      }
    },
    []
  )

  async function handleJoinGroup() {
    if (joinLoading || groupId) return
    setJoinLoading(true)
    try {
      const res = await fetch("/api/session/join-group", { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGroupId(data.groupId as string)
    } catch {
      // silently fail — non-critical feature
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      {/* data-app="customer" on SheetContent ensures CSS vars resolve inside the Radix portal */}
      <SheetContent
        side="bottom"
        // @ts-expect-error — custom data attribute forwarded via ...props spread in sheet.tsx
        data-app="customer"
        className="h-auto rounded-t-2xl pb-10 px-5"
      >
        <SheetHeader className="mb-5 mt-2">
          <SheetTitle className="text-foreground text-lg">Need help?</SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          <ActionButton
            icon="🔔"
            label="Call waiter"
            sentLabel="Waiter called ✓"
            errorLabel="Try again"
            description="A staff member will come to your table"
            sentDescription="Staff have been notified"
            errorDescription="Could not reach staff — please try again"
            status={waiterStatus}
            onClick={() => sendRequest("waiter_call", setWaiterStatus)}
          />

          <ActionButton
            icon="🧾"
            label="Request bill"
            sentLabel="Bill requested ✓"
            errorLabel="Try again"
            description="We'll bring your bill shortly"
            sentDescription="Staff will bring your bill soon"
            errorDescription="Could not reach staff — please try again"
            status={billStatus}
            onClick={() => sendRequest("bill_request", setBillStatus)}
          />

          {groupOrderingEnabled && (
            <div className="rounded-2xl bg-muted px-4 py-4">
              <p className="text-sm font-semibold text-foreground mb-0.5">Group order</p>
              <p className="text-xs text-muted-foreground mb-3">
                Join a shared cart so your whole table orders together
              </p>
              {groupId ? (
                <div className="rounded-xl bg-primary/10 px-3 py-2.5 text-center">
                  <p className="text-xs text-primary/70 mb-1">Share this code with your table</p>
                  <p className="font-mono text-2xl font-bold text-primary tracking-widest">
                    {groupId.slice(0, 6).toUpperCase()}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleJoinGroup}
                  disabled={joinLoading}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 active:opacity-80 transition-opacity"
                >
                  {joinLoading ? "Joining…" : "Start group order"}
                </button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface ActionButtonProps {
  icon: string
  label: string
  sentLabel: string
  errorLabel: string
  description: string
  sentDescription: string
  errorDescription: string
  status: RequestStatus
  onClick: () => void
}

function ActionButton({
  icon,
  label,
  sentLabel,
  errorLabel,
  description,
  sentDescription,
  errorDescription,
  status,
  onClick,
}: ActionButtonProps) {
  const sent = status === "sent"
  const loading = status === "loading"
  const error = status === "error"

  const bgClass = sent
    ? "bg-primary/20"
    : error
    ? "bg-destructive"
    : "bg-primary"

  const displayLabel = sent ? sentLabel : error ? errorLabel : label
  const displayDesc = sent ? sentDescription : error ? errorDescription : description

  return (
    <button
      onClick={onClick}
      disabled={loading || sent}
      className={`w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition-opacity active:opacity-80 disabled:opacity-80 ${bgClass}`}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${sent ? "text-primary" : "text-primary-foreground"}`}>
          {displayLabel}
        </p>
        <p className={`text-xs mt-0.5 ${sent ? "text-primary/60" : "text-primary-foreground/70"}`}>
          {displayDesc}
        </p>
      </div>
      {loading && (
        <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
      )}
    </button>
  )
}
