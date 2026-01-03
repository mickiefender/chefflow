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

    const { restaurantId, tableId, items, customerName, customerEmail, notes } = body

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: customerName,
        customer_email: customerEmail,
        status: "Pending",
        total_amount: 0,
        notes: notes,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items (existing logic)
    let total = 0
    // Fetch all menu items in one go to avoid N+1 queries
    const itemIds = items.map((item: any) => item.menuItemId);
    const { data: menuItemsData, error: menuItemsError } = await supabase
        .from("menu_items")
        .select("id, name, price, menu_categories(type)")
        .in("id", itemIds);

    if (menuItemsError) throw menuItemsError;

    const menuItemsMap = new Map(menuItemsData.map(item => [item.id, item]));

    for (const item of items) {
      const menuItem = menuItemsMap.get(item.menuItemId);

      if (!menuItem) {
        console.warn(`Menu item with ID ${item.menuItemId} not found.`);
        continue;
      }

      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: menuItem.price, // Use price from fetched menuItem
      })

      if (itemError) throw itemError
      total += menuItem.price * item.quantity; // Use price from fetched menuItem

      // Decrement stock if it is a drink
      if (menuItem.menu_categories?.type === "drink") {
        const { error: stockError } = await supabase.rpc("decrement_stock", {
          p_menu_item_id: item.menuItemId,
          p_quantity: item.quantity,
        })
        if (stockError) console.error("Error decrementing stock:", stockError); // Log but don't block order
      }
    }

    // Update order total
    await supabase.from("orders").update({ total_amount: total }).eq("id", order.id)

    // Fetch restaurant details for email (name)
    const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", restaurantId)
        .single();

    if (restaurantError) {
        console.error("Error fetching restaurant name for email:", restaurantError);
        // Do not throw, email sending is a secondary concern
    }

    const restaurantName = restaurantData?.name || "Your Restaurant";

    // Fetch table number for email
    const { data: tableData, error: tableError } = await supabase
        .from("restaurant_tables")
        .select("table_number")
        .eq("id", tableId)
        .single();

    if (tableError) {
        console.error("Error fetching table number for email:", tableError);
        // Do not throw, email sending is a secondary concern
    }

    const tableNumber = tableData?.table_number || "N/A";

    // Prepare ordered items for email
    const orderedItemsForEmail = items.map((item: any) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      return { 
        name: menuItem?.name || "Unknown Item", 
        quantity: item.quantity, 
        price: menuItem?.price || 0 
      };
    });


    // Trigger email sending if customerEmail is provided
    if (customerEmail) {
      try {
        await fetch(`${request.nextUrl.origin}/api/email/send-order-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: customerEmail,
            orderId: order.human_readable_id, // Use the new human-readable ID
            restaurantName: restaurantName,
            tableNumber: tableNumber,
            orderedItems: orderedItemsForEmail,
            totalAmount: total,
            orderTime: new Date(order.created_at).toLocaleString(), // Use the created_at from the order
            paymentMethod: "CASH", // Assuming initial payment is cash or pending online
            paymentStatus: "UNPAID", // Assuming initial status
          }),
        });
        console.log(`Order confirmation email triggered for order ${order.id} to ${customerEmail}`);
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
        // Continue without throwing an error, as email is optional
      }
    }

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
    console.error("Error in POST /api/orders:", error); // Log the actual error
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

