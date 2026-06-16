// Geo helpers for the region-lock feature.
// GPS check runs client-side; IP fallback runs server-side (Route Handler only).

export type GeoResult =
  | { status: "in_range" }
  | { status: "out_of_range" }
  | { status: "undetermined" }

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isWithinRadius(
  userLat: number,
  userLon: number,
  restaurantLat: number,
  restaurantLon: number,
  radiusMeters: number
): boolean {
  return (
    haversineMeters(userLat, userLon, restaurantLat, restaurantLon) <=
    radiusMeters
  )
}

// Client-side only — call from a Client Component after user gesture if needed.
export function getGPSPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 60_000,
      enableHighAccuracy: false,
    })
  )
}

// Server-side only — called from Route Handlers.
// Uses IP_GEO_API_URL env var (ipapi.co). Returns null on any failure.
export async function getIPLocation(
  ip: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const base = process.env.IP_GEO_API_URL ?? "https://ipapi.co"
    const res = await fetch(`${base}/${ip}/json/`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error || !data.latitude) return null
    return { latitude: data.latitude, longitude: data.longitude }
  } catch {
    return null
  }
}

// Derive a real client IP from Next.js request headers (behind Vercel's proxy).
export function getClientIP(headers: Headers): string | null {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    null
  )
}
