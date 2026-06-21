import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { error } = await supabase
    .from("requests")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", params.id)
    .is("acknowledged_at", null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
