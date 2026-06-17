"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "TZS", label: "TZS — Tanzanian Shilling" },
  { value: "UGX", label: "UGX — Ugandan Shilling" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "MXN", label: "MXN — Mexican Peso" },
  { value: "BRL", label: "BRL — Brazilian Real" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
]

const SESSION_EXPIRY_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
  { value: 1440, label: "24 hours" },
]

export interface RestaurantSettings {
  name: string
  currency: string
  whatsapp_number: string | null
  group_ordering_enabled: boolean
  maintenance_mode: boolean
  session_expiry_minutes: number
}

interface Props {
  settings: RestaurantSettings
}

export default function SettingsForm({ settings }: Props) {
  const [form, setForm] = useState({
    name: settings.name,
    currency: settings.currency,
    whatsapp_number: settings.whatsapp_number ?? "",
    group_ordering_enabled: settings.group_ordering_enabled,
    maintenance_mode: settings.maintenance_mode,
    session_expiry_minutes: settings.session_expiry_minutes,
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setStatus("idle")
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setStatus("idle")

    const patch = {
      ...form,
      whatsapp_number: form.whatsapp_number.trim() || null,
    }

    const res = await fetch("/api/restaurant/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    setSaving(false)

    if (res.ok) {
      setStatus("success")
    } else {
      const err = await res.json().catch(() => ({}))
      setErrorMsg(err.error ?? "Save failed")
      setStatus("error")
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Restaurant name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Restaurant name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Your restaurant name"
        />
      </div>

      {/* Currency */}
      <div className="space-y-1.5">
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          value={form.currency}
          onChange={(e) => set("currency", e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* WhatsApp number */}
      <div className="space-y-1.5">
        <Label htmlFor="whatsapp">WhatsApp number</Label>
        <Input
          id="whatsapp"
          type="tel"
          value={form.whatsapp_number}
          onChange={(e) => set("whatsapp_number", e.target.value)}
          placeholder="+1 555 000 0000 (international format)"
        />
        <p className="text-xs text-muted-foreground">
          Customers will see a &ldquo;Message us&rdquo; button after placing an order. Leave blank to hide.
        </p>
      </div>

      {/* Session expiry */}
      <div className="space-y-1.5">
        <Label htmlFor="session_expiry">Session expiry</Label>
        <select
          id="session_expiry"
          value={form.session_expiry_minutes}
          onChange={(e) => set("session_expiry_minutes", Number(e.target.value))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {SESSION_EXPIRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          How long a customer&apos;s scan session lasts before they must re-scan the QR code.
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleRow
          id="group_ordering"
          label="Group ordering"
          description="Let customers at the same table join a shared cart"
          checked={form.group_ordering_enabled}
          onChange={(v) => set("group_ordering_enabled", v)}
        />
        <ToggleRow
          id="maintenance_mode"
          label="Maintenance mode"
          description="Hides the menu and shows a 'back shortly' message to customers"
          checked={form.maintenance_mode}
          onChange={(v) => set("maintenance_mode", v)}
        />
      </div>

      {/* Status */}
      {status === "success" && (
        <p className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600">
          Settings saved successfully.
        </p>
      )}
      {status === "error" && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-opacity"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-4">
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
