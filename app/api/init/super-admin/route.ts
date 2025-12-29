import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Default super admin credentials
    const email = "admin@restaurantpos.com"
    const password = "SuperAdmin123!"
    const fullName = "System Administrator"

    // Check if super admin already exists
    const { data: existingAdmin } = await supabaseAdmin.from("super_admins").select("id").eq("email", email).single()

    if (existingAdmin) {
      return NextResponse.json({ message: "Super admin already exists" }, { status: 200 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create auth user" }, { status: 400 })
    }

    const { error: dbError } = await supabaseAdmin.from("super_admins").insert({
      id: authData.user.id,
      email,
      full_name: fullName,
    })

    if (dbError) {
      // Clean up auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create super admin record" }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: "Super admin initialized successfully",
        email,
        password,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Super admin init error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
