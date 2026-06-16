import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

const VALID_ROLES = ["owner", "manager", "staff", "kitchen_staff"] as const

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  // Verify caller is owner or manager
  const { data: caller } = await supabase
    .from("staff_users")
    .select("role, restaurant_id")
    .eq("id", user.id)
    .single()

  if (!caller?.restaurant_id || !["owner", "manager"].includes(caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { name: string; email: string; role: string; temporaryPassword: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { name, email, role, temporaryPassword } = body
  if (!name?.trim() || !email?.trim() || !temporaryPassword) {
    return NextResponse.json({ error: "name, email, and temporaryPassword required" }, { status: 400 })
  }
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Create auth user with service role (bypasses email confirmation)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password: temporaryPassword,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Insert staff_users record
  const { data: staffUser, error: insertError } = await adminClient
    .from("staff_users")
    .insert({
      id: authData.user.id,
      name: name.trim(),
      email: email.trim(),
      role,
      restaurant_id: caller.restaurant_id,
    })
    .select("id, name, email, role, is_active, created_at")
    .single()

  if (insertError) {
    // Roll back auth user creation
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ staffUser })
}
