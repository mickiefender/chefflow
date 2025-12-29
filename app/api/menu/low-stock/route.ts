import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const restaurantId = request.nextUrl.searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .select("*, menu_categories!inner(type)")
      .eq("restaurant_id", restaurantId)
      .eq("menu_categories.type", "drink")
      .lte("quantity_in_stock", supabase.raw("low_stock_threshold"));

    if (error) {
      console.error("Error fetching low stock items:", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch low stock items" }, { status: 500 });
  }
}
