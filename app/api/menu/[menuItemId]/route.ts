import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { parseAndFormatIngredients } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  context: { params: { menuItemId: string } }
) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const menuItemId = pathParts[pathParts.length - 1];

    if (!menuItemId || typeof menuItemId !== 'string') {
      return NextResponse.json({ error: "menuItemId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .select(
        `
        id,
        name,
        description,
        price,
        image_url,
        available,
        ingredients,
        preparation_time
      `
      )
      .eq("id", menuItemId)
      .single();

    if (error) {
      console.error("Error fetching menu item:", error);
      throw error;
    }

    if (data) {
      data.ingredients = parseAndFormatIngredients(data.ingredients);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Catch-all error in GET handler:", error);
    return NextResponse.json({ error: "Failed to fetch menu item" }, { status: 500 });
  }
}

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
    const { name, price, description, phone, category_id, image_url, available, ingredients, preparation_time } = body;
    const updateData: { [key: string]: any } = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (available !== undefined) updateData.available = available;
    if (ingredients !== undefined) updateData.ingredients = parseAndFormatIngredients(ingredients);
    if (preparation_time !== undefined) updateData.preparation_time = preparation_time;

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

export async function DELETE(
  request: NextRequest,
  context: { params: { menuItemId: string } }
) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const menuItemId = pathParts[pathParts.length - 1];

    if (!menuItemId || typeof menuItemId !== 'string') {
      return NextResponse.json({ error: "menuItemId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", menuItemId);

    if (error) {
      console.error("Error deleting menu item:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Catch-all error in DELETE handler:", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
