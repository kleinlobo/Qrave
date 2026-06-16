"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type MgmtTable = {
  id: string
  label: string
  qr_token: string
  is_active: boolean
  qrUrl: string
}

interface Props {
  open: boolean
  onClose: () => void
  restaurantId: string
  editing: MgmtTable | null
  onSaved: (table: MgmtTable, qrUrl: string) => void
}

export default function TableDialog({ open, onClose, restaurantId, editing, onSaved }: Props) {
  const [label, setLabel] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLabel(editing?.label ?? "")
      setError(null)
    }
  }, [open, editing])

  async function handleSave() {
    if (!label.trim()) { setError("Label is required"); return }
    setSaving(true)
    setError(null)

    try {
      let res: Response
      if (editing) {
        res = await fetch(`/api/tables/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        })
      } else {
        res = await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId, label }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? "Failed to save")
        return
      }

      const { table } = await res.json()
      // qrUrl will be computed by the parent after receiving the table
      onSaved(table, "")
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit table" : "Add table"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="table-label">Label</Label>
            <Input
              id="table-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 1, A3, Bar Seat 2"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This appears on the QR code and in the kitchen display.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add table"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
