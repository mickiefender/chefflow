import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get('country') || 'ghana' // Default to Ghana

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "PAYSTACK_SECRET_KEY is not set in environment variables." },
        { status: 500 }
      );
    }

    try {
        // Fetch traditional banks (NUBAN)
        const banksResponse = await fetch(`https://api.paystack.co/bank?country=${country}&type=nuban&use_cursor=true&perPage=100`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
            cache: 'force-cache',
        });

        if (!banksResponse.ok) {
            const errorData = await banksResponse.json();
            console.error("Paystack Banks API Error:", errorData);
            return NextResponse.json(
                { error: "Failed to fetch banks from Paystack", details: errorData.message },
                { status: banksResponse.status }
            );
        }
        const banksData = await banksResponse.json();

        // Fetch mobile money providers
        const momoResponse = await fetch(`https://api.paystack.co/bank?country=${country}&type=mobile_money&use_cursor=true&perPage=100`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
            cache: 'force-cache',
        });

        if (!momoResponse.ok) {
            const errorData = await momoResponse.json();
            console.error("Paystack Mobile Money API Error:", errorData);
            return NextResponse.json(
                { error: "Failed to fetch mobile money providers from Paystack", details: errorData.message },
                { status: momoResponse.status }
            );
        }
        const momoData = await momoResponse.json();

        // Combine and filter active providers
        const combinedProviders = [...banksData.data, ...momoData.data];
        
        const providers = combinedProviders
            .filter((provider: any) => provider.active === true)
            .map((provider: any) => ({
                id: provider.id, // Use Paystack's unique ID for the key
                name: provider.name,
                code: provider.code,
                type: provider.type, // Add type for differentiation if needed
            }));

        console.log("Fetched Providers:", providers);

        return NextResponse.json(providers);
    } catch (error) {
        console.error("Error fetching providers from Paystack:", error);
        return NextResponse.json(
            { error: "An internal error occurred while fetching payment providers" },
            { status: 500 }
        );
    }
}