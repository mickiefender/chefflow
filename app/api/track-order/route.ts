import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = createClient() // Server-side Supabase client

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("orderId")
  const email = searchParams.get("email")

  if (!orderId || !email) {
    return NextResponse.json({ error: "Order ID and Email are required" }, { status: 400 })
  }

  try {
    // Fetch order details. RLS on 'orders' table is still recommended for defense-in-depth,
    // but this server-side check adds a crucial layer of security.
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)") // Select order details and related items
      .eq("id", orderId)
      .eq("customer_email", email)
      .single()

    if (error) {
      console.error("Error fetching order in API:", error)
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 })
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Filter out any sensitive information before sending to client
    const { customer_id, ...safeOrder } = order

    return NextResponse.json(safeOrder)
  } catch (err) {
    console.error("API error during order tracking:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
