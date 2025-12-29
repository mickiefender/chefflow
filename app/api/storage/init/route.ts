import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Create storage buckets
    const buckets = [
      { name: "restaurant-logos", public: true },
      { name: "menu-images", public: true },
      { name: "banners", public: true },
      { name: "staff-photos", public: false },
    ]

    for (const bucket of buckets) {
      try {
        await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
        })
      } catch (error: any) {
        if (error.statusCode !== 409) {
          throw error
        }
      }
    }

    return NextResponse.json({ success: true, message: "Storage buckets initialized" })
  } catch (error) {
    console.error("[v0] Storage init error:", error)
    return NextResponse.json({ error: "Failed to initialize storage" }, { status: 500 })
  }
}
