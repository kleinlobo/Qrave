import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// Temporary diagnostic endpoint — remove after debugging
export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No user — anon auth not working", userId: null })
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, status, expires_at, restaurant_id, table_id, region_check_status")
    .eq("id", user.id)
    .single()

  // Test service role write ability
  let serviceRoleWorking = false
  let serviceRoleError = null
  try {
    const svc = createServiceClient()
    const { error } = await svc.from("sessions").select("id").limit(1)
    serviceRoleWorking = !error
    if (error) serviceRoleError = error.message
  } catch (e) {
    serviceRoleError = String(e)
  }

  return NextResponse.json({
    userId: user.id,
    isAnonymous: user.is_anonymous,
    session: session ?? null,
    sessionError: sessionError?.message ?? null,
    serviceRoleWorking,
    serviceRoleError,
    now: new Date().toISOString(),
  })
}
