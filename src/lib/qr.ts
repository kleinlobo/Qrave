// QR token signing utilities — server-side only.
// Uses Web Crypto (available in Node 18+ and Edge runtime).
// QR_SIGNING_SECRET must be a 64-char hex string (32 bytes).

const ALG = { name: "HMAC", hash: "SHA-256" } as const

async function importKey(): Promise<CryptoKey> {
  const secret = process.env.QR_SIGNING_SECRET!
  const bytes = Uint8Array.from(
    secret.match(/.{2}/g)!.map((h) => parseInt(h, 16))
  )
  return crypto.subtle.importKey("raw", bytes, ALG, false, ["sign", "verify"])
}

function encode(restaurantId: string, tableId: string): Uint8Array {
  return new TextEncoder().encode(`${restaurantId}:${tableId}`)
}

// Returns a hex HMAC signature for a (restaurantId, tableId) pair.
export async function signQRToken(
  restaurantId: string,
  tableId: string
): Promise<string> {
  const key = await importKey()
  const sig = await crypto.subtle.sign(ALG, key, encode(restaurantId, tableId))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Returns true if the token is a valid HMAC for this (restaurantId, tableId).
export async function verifyQRToken(
  restaurantId: string,
  tableId: string,
  token: string
): Promise<boolean> {
  try {
    const expected = await signQRToken(restaurantId, tableId)
    // Constant-time comparison to prevent timing attacks
    if (expected.length !== token.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

// Build the customer-facing URL embedded in a dine-in QR code.
export function buildTableQRUrl(
  baseUrl: string,
  restaurantId: string,
  tableId: string,
  signature: string
): string {
  return `${baseUrl}/menu/${restaurantId}/${tableId}?t=${signature}`
}

// Build the WhatsApp/delivery QR URL (token stored on restaurants.delivery_qr_token).
export function buildDeliveryQRUrl(
  baseUrl: string,
  restaurantId: string,
  deliveryQrToken: string
): string {
  return `${baseUrl}/wa/${restaurantId}/${deliveryQrToken}`
}
