import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: restaurants, error: restaurantsError } = await supabase
      .from("restaurants")
      .select("id, name");

    if (restaurantsError) throw restaurantsError;

    const analytics = await Promise.all(
      restaurants.map(async (restaurant) => {
        const { data: paidOrders, error: paidOrdersError } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("restaurant_id", restaurant.id)
          .eq("payment_status", "PAID");

        if (paidOrdersError) throw paidOrdersError;

        const totalIncome = paidOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("id")
          .eq("restaurant_id", restaurant.id)
          .eq("payment_status", "PAID");

        if (ordersError) throw ordersError;

        const totalOrders = orders.length;

        return {
          ...restaurant,
          totalIncome,
          totalOrders,
        };
      })
    );

    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}