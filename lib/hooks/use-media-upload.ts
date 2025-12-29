"use client"

import { useState, useCallback } from "react"

interface UploadOptions {
  bucket: "menu-items" | "restaurant-logos" | "restaurant-banners" | "staff-photos"
  restaurantId: string
  type?: "logo" | "banner" | "menu" | "staff"
}

export function useMediaUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, options: UploadOptions): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!file) {
        throw new Error("No file selected")
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("bucket", options.bucket)
      formData.append("restaurantId", options.restaurantId)
      if (options.type) {
        formData.append("type", options.type)
      }

      const response = await fetch("/api/restaurant/upload-media", {
        method: "POST",
        body: formData,
      })

      let data
      try {
        data = await response.json()
      } catch {
        throw new Error(`Server error: ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`)
      }

      return data.url
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed"
      setError(message)
      console.error("[v0] Upload error:", message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { upload, loading, error }
}
