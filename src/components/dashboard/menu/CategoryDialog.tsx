"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MgmtCategory } from "./types"

interface Props {
  open: boolean
  onClose: () => void
  restaurantId: string
  editing: MgmtCategory | null
  onSaved: (category: MgmtCategory) => void
}

export default function CategoryDialog({ open, onClose, restaurantId, editing, onSaved }: Props) {
  const [name, setName] = useState("")
  const [displayOrder, setDisplayOrder] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "")
      setDisplayOrder(editing?.display_order ?? 0)
      setError(null)
    }
  }, [open, editing])

  async function handleSave() {
    if (!name.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError(null)

    try {
      let res: Response
      if (editing) {
        res = await fetch(`/api/menu/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, displayOrder }),
        })
      } else {
        res = await fetch("/api/menu/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId, name, displayOrder }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? "Failed to save")
        return
      }

      const { category } = await res.json()
      onSaved(category)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starters"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-order">Display order</Label>
            <Input
              id="cat-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
