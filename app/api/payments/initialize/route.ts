import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { order_id } = await request.json()

  if (!order_id) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
  }

  // 1. Fetch order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("total_amount, restaurant_id, customer_email")
    .eq("id", order_id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // 2. Fetch restaurant's paystack subaccount
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("paystack_subaccount_code, email") // Assuming customer email is on restaurant for now
    .eq("id", order.restaurant_id)
    .single()

  if (restaurantError || !restaurant || !restaurant.paystack_subaccount_code) {
    return NextResponse.json({ error: "Restaurant payment account not configured" }, { status: 400 })
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Server configuration error", details: "PAYSTACK_SECRET_KEY is not set" }, { status: 500 })
  }

  const amountInKobo = Math.round(order.total_amount * 100)
  const platformCommission = Math.round(0.10 * amountInKobo) // 10% commission

  const paystackBody = {
    email: order.customer_email || restaurant.email || "customer@example.com", // customer_email is used as email
    amount: amountInKobo,
    subaccount: restaurant.paystack_subaccount_code,
    transaction_charge: platformCommission,
    bearer: "subaccount",
    channels: ["card", "mobile_money"],
    metadata: {
      order_id: order_id,
    }
  }

  try {
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackBody),
    })

    const paystackData = await paystackResponse.json() // Parse JSON here as well for error cases

    if (!paystackResponse.ok) {
      console.error("Paystack API Error Status:", paystackResponse.status)
      console.error("Paystack API Error Response:", paystackData)
      console.error("Paystack Request Body Sent:", paystackBody) // Log the body sent
      return NextResponse.json({ error: "Failed to initialize payment", details: paystackData.message || "Unknown error from Paystack" }, { status: paystackResponse.status })
    }

    // const paystackData = await paystackResponse.json() // Moved up to parse error responses as well
    
    // Create a payment record
    await supabase.from('payments').insert({
      order_id: order_id,
      provider: 'paystack',
      status: 'pending',
      amount: order.total_amount,
      reference: paystackData.data.reference,
    })


    return NextResponse.json({ authorization_url: paystackData.data.authorization_url })
  } catch (error) {
    console.error("Error initializing Paystack transaction:", error)
    return NextResponse.json(
      {
        error: "An internal error occurred during payment initialization",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
