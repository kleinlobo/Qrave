"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import TableDialog, { type MgmtTable } from "./TableDialog"

const QRCodeDisplay = dynamic(() => import("./QRCodeDisplay"), { ssr: false })

interface Props {
  restaurantId: string
  initialTables: MgmtTable[]
}

export default function TableManager({ restaurantId, initialTables }: Props) {
  const [tables, setTables] = useState<MgmtTable[]>(initialTables)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MgmtTable | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(table: MgmtTable) {
    setEditing(table)
    setDialogOpen(true)
  }

  function onSaved(rawTable: { id: string; label: string; qr_token: string; is_active: boolean }) {
    // The qrUrl comes from the server-generated prop for existing tables.
    // For newly created tables, we derive the URL from the base URL + IDs.
    // Since the signature requires the secret (server-side), we need to call an API
    // to get the signed URL. For now we reload the page to get fresh signed URLs.
    // Better UX: use a fetch to /api/tables/sign or refresh via router.refresh().
    const table: MgmtTable = { ...rawTable, qrUrl: "" }
    setTables((prev) => {
      const idx = prev.findIndex((t) => t.id === table.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...prev[idx], label: table.label, is_active: table.is_active }
        return next
      }
      return [...prev, table]
    })
    // Refresh to get server-computed QR URLs for newly created tables
    window.location.reload()
  }

  async function toggleActive(table: MgmtTable) {
    const res = await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !table.is_active }),
    })
    if (res.ok) {
      const { table: updated } = await res.json()
      setTables((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, is_active: updated.is_active } : t))
      )
    }
  }

  async function deleteTable(table: MgmtTable) {
    if (!confirm(`Delete table "${table.label}"?`)) return
    const res = await fetch(`/api/tables/${table.id}`, { method: "DELETE" })
    if (res.ok) {
      setTables((prev) => prev.filter((t) => t.id !== table.id))
      if (selectedId === table.id) setSelectedId(null)
    }
  }

  const sorted = [...tables].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
  const selectedTable = tables.find((t) => t.id === selectedId) ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tables</h1>
          <p className="text-sm text-muted-foreground">{tables.length} table{tables.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:opacity-80 transition-opacity"
        >
          + Add table
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list */}
        <div className="lg:col-span-2">
          {sorted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">No tables yet.</p>
              <button onClick={openNew} className="mt-2 text-sm text-primary underline">
                Add your first table
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {sorted.map((table) => (
                <div
                  key={table.id}
                  className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                    selectedId === table.id ? "bg-muted/50" : ""
                  }`}
                  onClick={() => setSelectedId(table.id === selectedId ? null : table.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">Table {table.label}</p>
                      {!table.is_active && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(table)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(table)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {table.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteTable(table)}
                      className="text-xs text-destructive hover:opacity-80 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR code panel */}
        <div className="flex justify-center">
          {selectedTable?.qrUrl ? (
            <QRCodeDisplay url={selectedTable.qrUrl} label={selectedTable.label} />
          ) : (
            <div className="flex h-full min-h-32 items-center justify-center text-center px-4">
              <p className="text-sm text-muted-foreground">
                {tables.length > 0 ? "Select a table to view its QR code" : "Add a table to generate its QR code"}
              </p>
            </div>
          )}
        </div>
      </div>

      <TableDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        restaurantId={restaurantId}
        editing={editing}
        onSaved={onSaved}
      />
    </div>
  )
}
