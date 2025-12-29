import { createClient } from "@/lib/supabase/server"

export async function logActivity(restaurantId: string, staffId: string | null, action: string, details?: any) {
  try {
    const supabase = await createClient()

    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      staff_id: staffId,
      action,
      details,
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}
