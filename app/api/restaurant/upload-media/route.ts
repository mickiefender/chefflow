import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    // Pass cookieStore to createServerClient to enable authentication
    const supabase = await createServerClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = formData.get("bucket") as string
    const restaurantId = formData.get("restaurantId") as string
    const type = formData.get("type") as string | null

    if (!file || !bucket || !restaurantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `${timestamp}-${random}.${ext}`
    const filePath = type ? `${restaurantId}/${type}/${fileName}` : `${restaurantId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Storage upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    // Log the upload activity
    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      staff_id: user.id,
      action: "MEDIA_UPLOADED",
      details: {
        bucket,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        type: type || "other",
      },
    })

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      success: true,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
