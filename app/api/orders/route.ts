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
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { restaurantId, tableId, items, customerName } = body

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: customerName,
        status: "Pending",
        total_amount: 0,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    let total = 0
    for (const item of items) {
      // Get menu item type
      const { data: menuItem, error: menuItemError } = await supabase
        .from("menu_items")
        .select("*, menu_categories(type)")
        .eq("id", item.menuItemId)
        .single()

      if (menuItemError) throw menuItemError

      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.price,
      })

      if (itemError) throw itemError
      total += item.price * item.quantity

      // Decrement stock if it is a drink
      if (menuItem.menu_categories?.type === "drink") {
        const { error: stockError } = await supabase.rpc("decrement_stock", {
          p_menu_item_id: item.menuItemId,
          p_quantity: item.quantity,
        })
        if (stockError) throw stockError
      }
    }

    // Update order total
    await supabase.from("orders").update({ total_amount: total }).eq("id", order.id)

    // Log activity
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from("activity_logs").insert({
        restaurant_id: restaurantId,
        staff_id: user.id,
        action: "created_order",
        details: { orderId: order.id, tableId, itemCount: items.length },
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
