import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()
  const { payment_id } = await request.json()

  if (!payment_id) {
    return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 1. Fetch payment and verify admin privileges
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*, orders(*, restaurants(id))")
    .eq("id", payment_id)
    .single()

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  }

  const restaurantId = payment.orders?.restaurants?.id

  // Check if user is admin for this restaurant
  const { data: restaurantAdmin } = await supabase
    .from("restaurant_admins")
    .select("id")
    .eq("id", user.id)
    .eq("restaurant_id", restaurantId)
    .single()
  
  const { data: superAdmin } = await supabase.from("super_admins").select("id").eq("id", user.id).single()
  
  // Check if user is a staff member for this restaurant
  const { data: staffMember } = await supabase
    .from("staff_members")
    .select("id")
    .eq("id", user.id)
    .eq("restaurant_id", restaurantId)
    .single()


  if (!restaurantAdmin && !superAdmin && !staffMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (payment.provider !== "paystack") {
    return NextResponse.json({ error: "Only online payments can be refunded through this endpoint." }, { status: 400 })
  }


  // 2. Call Paystack Refund API
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables")
  }
  
  try {
    const paystackResponse = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: payment.reference,
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
        console.error("Paystack Refund API Error:", paystackData)
        return NextResponse.json({ error: "Failed to process refund with Paystack", details: paystackData.message }, { status: 500 })
    }

    // 3. Update order payment_status
    await supabase
        .from("orders")
        .update({ payment_status: "REFUNDED" })
        .eq("id", payment.order_id)
        
    // 4. Update payment status
    await supabase
        .from("payments")
        .update({ status: "refunded" })
        .eq("id", payment.id)


    return NextResponse.json({ message: "Refund processed successfully" })
  } catch (error) {
    console.error("Error processing refund:", error)
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 })
  }
}
