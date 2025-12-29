import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables")
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables")
  }

  const signature = request.headers.get("x-paystack-signature")
  const body = await request.text()

  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(body).digest("hex")

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === "charge.success") {
    const { reference, amount, fees, channel, metadata } = event.data
    const order_id = metadata?.order_id

    if (!order_id) {
      console.error("Webhook Error: order_id not found in metadata")
      return NextResponse.json({ error: "order_id not found in metadata" }, { status: 400 })
    }

    try {
      // Update order payment_status and get the restaurant_id
      const { data: updatedOrder, error: orderError } = await supabase
        .from("orders")
        .update({ payment_status: "PAID", payment_method: channel })
        .eq("id", order_id)
        .select("restaurant_id")
        .single()

      if (orderError || !updatedOrder) {
        console.error("Webhook Error: Failed to update order or get restaurant_id.", orderError)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
      }

      // Update payment record status
      const { data: updatedPayment, error: updatePaymentError } = await supabase
        .from("payments")
        .update({ status: "success", method: channel })
        .eq("reference", reference)
        .select("id")
        .single()

      if (updatePaymentError) {
        console.error("Webhook Error: Failed to update payment record status.", updatePaymentError)
        // We can decide if we want to stop here or continue
      }

      // Create transaction record
      if (updatedPayment) {
        const grossAmount = amount / 100
        const platformFee = fees / 100
        const netAmount = grossAmount - platformFee

        await supabase.from("transactions").insert({
          restaurant_id: updatedOrder.restaurant_id,
          payment_id: updatedPayment.id,
          gross_amount: grossAmount,
          platform_fee: platformFee,
          net_amount: netAmount,
          settlement_status: "PENDING",
        })
      }
    } catch (error) {
      console.error("Webhook processing error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  return NextResponse.json({ status: "ok" })
}
