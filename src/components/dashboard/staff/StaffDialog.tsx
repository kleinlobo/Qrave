"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type MgmtStaff = {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Front of House" },
  { value: "kitchen_staff", label: "Kitchen Staff" },
]

interface Props {
  open: boolean
  onClose: () => void
  editing: MgmtStaff | null
  currentUserId: string
  onSaved: (staffUser: MgmtStaff) => void
}

export default function StaffDialog({ open, onClose, editing, currentUserId, onSaved }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("staff")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const isCreate = !editing

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "")
      setEmail(editing?.email ?? "")
      setRole(editing?.role ?? "staff")
      setPassword("")
      setError(null)
      setCopiedPassword(false)
    }
  }, [open, editing])

  function generatePassword(): string {
    return Math.random().toString(36).slice(2, 10).toUpperCase()
  }

  async function handleSave() {
    if (isCreate && (!name.trim() || !email.trim() || !password)) {
      setError("All fields are required")
      return
    }
    setSaving(true)
    setError(null)

    try {
      let res: Response
      if (isCreate) {
        res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, role, temporaryPassword: password }),
        })
      } else {
        res = await fetch(`/api/staff/${editing!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? "Failed to save")
        return
      }

      const { staffUser } = await res.json()
      onSaved(staffUser)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Add staff member" : `Edit ${editing?.name}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isCreate && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="staff-name">Full name</Label>
                <Input
                  id="staff-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@restaurant.com"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="staff-role">Role</Label>
            <select
              id="staff-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={editing?.id === currentUserId}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {isCreate && (
            <div className="space-y-1.5">
              <Label htmlFor="staff-pass">Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  id="staff-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                />
                <button
                  type="button"
                  onClick={() => {
                    const p = generatePassword()
                    setPassword(p)
                    navigator.clipboard.writeText(p).then(() => setCopiedPassword(true))
                  }}
                  className="rounded-lg border border-border px-3 text-xs text-muted-foreground hover:border-primary/50 flex-shrink-0"
                >
                  {copiedPassword ? "Copied!" : "Generate"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this with the staff member — they should change it after first login.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity"
          >
            {saving ? "Saving…" : isCreate ? "Add staff member" : "Save changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
