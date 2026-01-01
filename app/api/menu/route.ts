import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { parseAndFormatIngredients } from "@/lib/utils"

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
        available,
        ingredients,
        preparation_time
      )
    `,
      )
      .eq("restaurant_id", restaurantId)
      .order("sort_order")

    if (error) throw error

    // Apply parsing to ingredients in fetched menu items
    const processedData = data?.map(category => ({
      ...category,
      menu_items: category.menu_items?.map(item => ({
        ...item,
        ingredients: parseAndFormatIngredients(item.ingredients),
      }))
    }));

    return NextResponse.json(processedData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Process ingredients before insertion
    if (body.ingredients !== undefined) {
      body.ingredients = parseAndFormatIngredients(body.ingredients);
    }

    const { error } = await supabase.from("menu_items").insert(body)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 })
  }
}
