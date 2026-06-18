import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getClientIP, getIPLocation, isWithinRadius } from "@/lib/geo"

interface BootstrapBody {
  restaurantId: string
  tableId: string
  sessionExpiryMinutes: number
  restaurantLat: number | null
  restaurantLon: number | null
  regionLockRadius: number
  gpsLat?: number
  gpsLon?: number
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  let body: BootstrapBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const {
    restaurantId,
    tableId,
    sessionExpiryMinutes,
    restaurantLat,
    restaurantLon,
    regionLockRadius,
    gpsLat,
    gpsLon,
  } = body

  // Determine region check status.
  // When the restaurant has no coordinates configured, geo-lock is disabled — treat as in_range.
  let regionCheckStatus: "in_range" | "out_of_range" | "undetermined" = "undetermined"

  if (restaurantLat == null || restaurantLon == null) {
    regionCheckStatus = "in_range"
  } else if (gpsLat != null && gpsLon != null) {
    regionCheckStatus = isWithinRadius(gpsLat, gpsLon, restaurantLat, restaurantLon, regionLockRadius)
      ? "in_range"
      : "out_of_range"
  } else {
    const ip = getClientIP(request.headers)
    if (ip) {
      const ipLoc = await getIPLocation(ip)
      if (ipLoc) {
        regionCheckStatus = isWithinRadius(
          ipLoc.latitude,
          ipLoc.longitude,
          restaurantLat,
          restaurantLon,
          regionLockRadius
        )
          ? "in_range"
          : "out_of_range"
      }
    }
  }

  // Idempotency: return existing active session if one exists for this user + restaurant
  const { data: existing } = await supabase
    .from("sessions")
    .select("id, status, region_check_status, expires_at")
    .eq("id", user.id)
    .eq("restaurant_id", restaurantId)
    .single()

  if (existing && existing.status === "active" && existing.expires_at > new Date().toISOString()) {
    // Update region check if we got a better result
    if (existing.region_check_status === "undetermined" && regionCheckStatus !== "undetermined") {
      await supabase
        .from("sessions")
        .update({ region_check_status: regionCheckStatus })
        .eq("id", user.id)
    }
    return NextResponse.json({
      sessionId: existing.id,
      regionCheckStatus:
        existing.region_check_status === "undetermined"
          ? regionCheckStatus
          : existing.region_check_status,
    })
  }

  // Create or replace session (upsert handles the case where an expired/inactive
  // session row already exists for this user, avoiding duplicate key errors)
  const expiresAt = new Date(
    Date.now() + sessionExpiryMinutes * 60 * 1000
  ).toISOString()

  const { data: session, error } = await supabase
    .from("sessions")
    .upsert({
      id: user.id,
      restaurant_id: restaurantId,
      table_id: tableId,
      channel: "dine_in",
      region_check_status: regionCheckStatus,
      status: "active",
      expires_at: expiresAt,
    }, { onConflict: "id" })
    .select("id, region_check_status")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    sessionId: session.id,
    regionCheckStatus: session.region_check_status,
  })
}
