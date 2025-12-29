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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const imageType = formData.get("type") as "logo" | "banner"
    const restaurantId = formData.get("restaurantId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!imageType || !restaurantId) {
      return NextResponse.json({ error: "Missing type or restaurantId" }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    const fileName = `${restaurantId}/${imageType}/${Date.now()}-${file.name}`
    const bucketName = imageType === "logo" ? "restaurant-logos" : "restaurant-banners"

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Supabase upload error:", uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(fileName)

    // Update restaurant table with new image URL
    const columnToUpdate = imageType === "logo" ? "logo_url" : "banner_url"
    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ [columnToUpdate]: publicUrl })
      .eq("id", restaurantId)

    if (updateError) {
      console.error("[v0] Database update error:", updateError)
      return NextResponse.json({ error: `Database update failed: ${updateError.message}` }, { status: 500 })
    }

    await supabase.from("activity_logs").insert({
      restaurant_id: restaurantId,
      action: `${imageType.toUpperCase()}_UPLOADED`,
      details: { url: publicUrl, fileName },
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: `${imageType} uploaded successfully`,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 })
  }
}
