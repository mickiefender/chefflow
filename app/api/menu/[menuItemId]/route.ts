import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: { menuItemId: string } }
) {
  try {
    const supabase = await createClient();
    // Workaround for a potential issue where context.params is not populated
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const menuItemId = pathParts[pathParts.length - 1];

    const body = await request.json();
    
    if (!menuItemId || typeof menuItemId !== 'string') {
      return NextResponse.json({ error: "menuItemId is required" }, { status: 400 });
    }

    // Creating a dynamic object for updates
    const { name, price, description, phone, category_id, image_url, available } = body;
    const updateData: { [key: string]: any } = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (available !== undefined) updateData.available = available;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", menuItemId)
      .select();

    if (error) {
      console.error("Error updating menu item:", error);
      throw error; // This will be caught by the outer try-catch
    }

    return NextResponse.json(data);
  } catch (error) {
    // Log the error for server-side debugging
    console.error("Catch-all error in PATCH handler:", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}