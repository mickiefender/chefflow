import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const restaurantId = request.nextUrl.searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("menu_categories")
      .select(
        `
      id,
      name,
      sort_order,
      menu_items(
        id,
        name,
        description,
        price,
        image_url,
        available
      )
    `,
      )
      .eq("restaurant_id", restaurantId)
      .order("sort_order")

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { error } = await supabase.from("menu_items").insert(body)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 })
  }
}
