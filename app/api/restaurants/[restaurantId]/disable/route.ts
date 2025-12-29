import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!superAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { restaurantId } = await params;

    const { error } = await supabase
      .from("restaurants")
      .update({ is_active: false })
      .eq("id", restaurantId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to disable restaurant" },
      { status: 500 }
    );
  }
}
