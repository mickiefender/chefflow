"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface UploadOptions {
  bucket: "menu-items" | "restaurant-logos" | "restaurant-banners" | "staff-photos"
  folder?: string
}

export function useStorageUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const upload = useCallback(
    async (file: File, options: UploadOptions): Promise<string | null> => {
      setLoading(true)
      setError(null)

      try {
        if (!file) {
          throw new Error("No file selected")
        }

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          throw new Error("File size must be less than 5MB")
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if (!allowedTypes.includes(file.type)) {
          throw new Error("Invalid file type. Please upload an image (JPG, PNG, WebP, or GIF)")
        }

        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const fileName = `${timestamp}-${random}-${file.name}`
        const filePath = options.folder ? `${options.folder}/${fileName}` : fileName

        const { data, error: uploadError } = await supabase.storage.from(options.bucket).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data: publicUrlData } = supabase.storage.from(options.bucket).getPublicUrl(filePath)

        return publicUrlData.publicUrl
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        setError(message)
        console.error("[v0] Upload error:", message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  return { upload, loading, error }
}
