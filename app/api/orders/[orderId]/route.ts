import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { status } = body

    const { error } = await supabase.from("orders").update({ status }).eq("id", params.orderId)

    if (error) throw error

    // Log activity
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: order } = await supabase.from("orders").select("restaurant_id").eq("id", params.orderId).single()

      if (order) {
        await supabase.from("activity_logs").insert({
          restaurant_id: order.restaurant_id,
          staff_id: user.id,
          action: `updated_order_status_to_${status}`,
          details: { orderId: params.orderId },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
