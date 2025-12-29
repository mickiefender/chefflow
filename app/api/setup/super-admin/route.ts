import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@restaurantpos.com",
      password: "SuperAdmin123!",
      email_confirm: true,
    })

    if (authError) {
      // User might already exist, try to get them
      if (authError.message.includes("already exists")) {
        return NextResponse.json({ message: "Super admin already exists" }, { status: 200 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: dbError } = await supabase.from("super_admins").insert({
      id: authUser.user.id,
      email: "admin@restaurantpos.com",
      full_name: "System Administrator",
    })

    if (dbError && !dbError.message.includes("duplicate")) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: "Super admin account created successfully",
        email: "admin@restaurantpos.com",
        password: "SuperAdmin123!",
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
