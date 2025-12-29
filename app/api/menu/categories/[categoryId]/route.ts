import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { categoryId: string } }) {
  try {
    const supabase = await createClient()
    const categoryId = params.categoryId

    // Before deleting the category, check if there are any menu items associated with it
    const { count, error: countError } = await supabase
      .from("menu_items")
      .select("id", { count: "exact" })
      .eq("category_id", categoryId)

    if (countError) throw countError

    if (count && count > 0) {
      return NextResponse.json({ error: "Cannot delete category with associated menu items. Please move or delete all items from this category first." }, { status: 400 })
    }

    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting menu category:", error)
    return NextResponse.json({ error: "Failed to delete menu category" }, { status: 500 })
  }
}
