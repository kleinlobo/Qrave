"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getGPSPosition, isWithinRadius } from "@/lib/geo"
import MenuFeed from "@/components/menu/MenuFeed"
import type { MenuCategory } from "@/lib/menu/types"

interface Props {
  restaurantId: string
  tableId: string
  tableLabel: string
  restaurantName: string
  restaurantLat: number | null
  restaurantLon: number | null
  regionLockRadius: number
  sessionExpiryMinutes: number
  currency: string
  menuCategories: MenuCategory[]
}

type SessionState =
  | { phase: "booting" }
  | { phase: "region_blocked" }
  | { phase: "error"; message: string }
  | { phase: "ready" }

export default function SessionBootstrap({
  restaurantId,
  tableId,
  tableLabel,
  restaurantName,
  restaurantLat,
  restaurantLon,
  regionLockRadius,
  sessionExpiryMinutes,
  currency,
  menuCategories,
}: Props) {
  const [state, setState] = useState<SessionState>({ phase: "booting" })
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    async function boot() {
      const supabase = createClient()

      // Ensure anonymous auth session exists
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) {
          setState({
            phase: "error",
            message: "Could not start a session. Please try scanning again.",
          })
          return
        }
      }

      // Attempt GPS region check (best effort, 8s timeout baked into getGPSPosition)
      let gpsLat: number | undefined
      let gpsLon: number | undefined

      try {
        const position = await getGPSPosition()
        gpsLat = position.coords.latitude
        gpsLon = position.coords.longitude

        // Fast-path client rejection before hitting the server
        if (restaurantLat != null && restaurantLon != null) {
          if (!isWithinRadius(gpsLat, gpsLon, restaurantLat, restaurantLon, regionLockRadius)) {
            setState({ phase: "region_blocked" })
            return
          }
        }
      } catch {
        // GPS unavailable or denied — server falls back to IP geo
      }

      const res = await fetch("/api/session/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          sessionExpiryMinutes,
          restaurantLat,
          restaurantLon,
          regionLockRadius,
          gpsLat,
          gpsLon,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setState({ phase: "error", message: err.error ?? "Failed to start session." })
        return
      }

      const data = await res.json()

      if (data.regionCheckStatus === "out_of_range") {
        setState({ phase: "region_blocked" })
        return
      }

      setState({ phase: "ready" })
    }

    boot()
  }, [
    restaurantId,
    tableId,
    restaurantLat,
    restaurantLon,
    regionLockRadius,
    sessionExpiryMinutes,
  ])

  if (state.phase === "booting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-foreground-muted">Loading {restaurantName}&hellip;</p>
        </div>
      </div>
    )
  }

  if (state.phase === "region_blocked") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="text-4xl">📍</div>
          <p className="text-base font-semibold text-foreground">You&apos;re not at the venue</p>
          <p className="text-sm text-foreground-muted">
            Orders can only be placed when you&apos;re at {restaurantName}. Please scan the QR code
            again once you arrive.
          </p>
        </div>
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-base font-semibold text-foreground">Something went wrong</p>
          <p className="text-sm text-foreground-muted">{state.message}</p>
        </div>
      </div>
    )
  }

  return (
    <MenuFeed
      categories={menuCategories}
      currency={currency}
      restaurantName={restaurantName}
    />
  )
}
