"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import StaffDialog, { type MgmtStaff } from "./StaffDialog"

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Front of House",
  kitchen_staff: "Kitchen",
}

interface Props {
  currentUserId: string
  initialStaff: MgmtStaff[]
}

export default function StaffManager({ currentUserId, initialStaff }: Props) {
  const [staff, setStaff] = useState<MgmtStaff[]>(initialStaff)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MgmtStaff | null>(null)

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(member: MgmtStaff) {
    setEditing(member)
    setDialogOpen(true)
  }

  function onSaved(member: MgmtStaff) {
    setStaff((prev) => {
      const idx = prev.findIndex((s) => s.id === member.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = member
        return next
      }
      return [...prev, member]
    })
  }

  async function toggleActive(member: MgmtStaff) {
    if (member.id === currentUserId) return
    const res = await fetch(`/api/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.is_active }),
    })
    if (res.ok) {
      const { staffUser } = await res.json()
      onSaved(staffUser)
    }
  }

  const sorted = [...staff].sort((a, b) => {
    const roleOrder = ["owner", "manager", "staff", "kitchen_staff"]
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground">{staff.length} member{staff.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:opacity-80 transition-opacity"
        >
          + Add staff
        </button>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {sorted.map((member) => (
          <div key={member.id} className="flex items-center gap-4 px-4 py-3.5">
            {/* Avatar */}
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
              {member.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                {member.id === currentUserId && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
                {!member.is_active && (
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
            </div>

            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {ROLE_LABEL[member.role] ?? member.role}
            </Badge>

            {member.id !== currentUserId && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => openEdit(member)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Edit role
                </button>
                <button
                  onClick={() => toggleActive(member)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {member.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <StaffDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        currentUserId={currentUserId}
        onSaved={onSaved}
      />
    </div>
  )
}
