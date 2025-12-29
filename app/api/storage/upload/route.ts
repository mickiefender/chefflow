import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const buckets = [
      { name: "menu-items", isPublic: true },
      { name: "restaurant-logos", isPublic: true },
      { name: "restaurant-banners", isPublic: true },
      { name: "staff-photos", isPublic: false },
    ]

    for (const bucket of buckets) {
      const { data: existingBucket } = await supabase.storage.getBucket(bucket.name)

      if (!existingBucket) {
        await supabase.storage.createBucket(bucket.name, {
          public: bucket.isPublic,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Storage buckets initialized",
    })
  } catch (error) {
    console.error("[v0] Storage init error:", error)
    return NextResponse.json({ error: "Failed to initialize storage" }, { status: 500 })
  }
}
