import { NextResponse } from "next/server"
// import { createClient } from "@/lib/supabase/server" // Removed as supabase is no longer used in this route
export async function POST(request: Request) {
  const { restaurantName, settlementBankCode, accountNumber, country } = await request.json()

  if (!restaurantName || !settlementBankCode || !accountNumber || !country) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Server configuration error", details: "PAYSTACK_SECRET_KEY is not set" }, { status: 500 })
  }

  const paystackBody = {
    business_name: restaurantName,
    settlement_bank: settlementBankCode,
    account_number: accountNumber,
    country: country,
    percentage_charge: 10, // This is the restaurant's cut
  }

  try {
    const paystackResponse = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackBody),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error("Paystack API Error:", paystackData)
      return NextResponse.json({ error: "Failed to create subaccount", details: paystackData.message }, { status: 500 })
    }

    const subaccountCode = paystackData.data.subaccount_code

    return NextResponse.json({ success: true, subaccount_code: subaccountCode })

  } catch (error) {
    console.error("Error creating Paystack subaccount:", error)
    return NextResponse.json(
      {
        error: "An internal error occurred during subaccount creation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
    


}
