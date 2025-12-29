import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const restaurantId = request.nextUrl.searchParams.get("restaurantId")
    const departmentId = request.nextUrl.searchParams.get("departmentId")

    let query = supabase.from("staff_members").select("*").eq("restaurant_id", restaurantId)

    if (departmentId) {
      query = query.eq("department_id", departmentId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  }
}
