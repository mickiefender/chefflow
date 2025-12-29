"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Loader2, Upload, ImageIcon } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useMediaUpload } from "@/lib/hooks/use-media-upload"

interface RestaurantSettings {
  id: string
  name: string
  email: string
  phone: string
  address: string
  description: string
  is_active: boolean
  logo_url: string | null
  banner_url: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const supabase = createClient()
  const { upload, loading: uploadLoading, error: mediaUploadError } = useMediaUpload()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("restaurants").select("*").eq("id", restaurantId).single()

      if (data) {
        setSettings(data)
        setLogoUrl(data.logo_url)
        setBannerUrl(data.banner_url)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      await supabase
        .from("restaurants")
        .update({
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          description: settings.description,
        })
        .eq("id", restaurantId)

      await supabase.from("activity_logs").insert({
        restaurant_id: restaurantId,
        action: "SETTINGS_UPDATED",
        details: {
          updated_fields: ["name", "email", "phone", "address", "description"],
        },
      })

      alert("Settings saved successfully!")
    } catch (err) {
      console.error("[v0] Error saving settings:", err)
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File, type: "logo" | "banner") => {
    setUploadError(null)
    const imageUrl = await upload(file, {
      bucket: type === "logo" ? "restaurant-logos" : "restaurant-banners",
      restaurantId,
      type,
    })

    if (imageUrl) {
      if (type === "logo") {
        setLogoUrl(imageUrl)
      } else {
        setBannerUrl(imageUrl)
      }
      const updateField = type === "logo" ? { logo_url: imageUrl } : { banner_url: imageUrl }
      const { error } = await supabase.from("restaurants").update(updateField).eq("id", restaurantId)

      if (error) {
        const errorMessage = "Failed to save the uploaded image. Please try again."
        setUploadError(errorMessage)
        console.error("[v0] Error updating restaurant image URL:", error)
        // Optional: revert local state if DB update fails
        if (type === "logo") setLogoUrl(settings?.logo_url)
        else setBannerUrl(settings?.banner_url)
      }
    } else {
      setUploadError(mediaUploadError)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href={`/restaurant/${restaurantId}/dashboard`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Restaurant Settings</h1>

        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{uploadError}</div>
        )}

        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Restaurant Logo</CardTitle>
            <CardDescription className="text-slate-400">Upload your restaurant logo for branding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 items-start">
              <div className="w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-32 h-32 object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button variant="outline" asChild disabled={uploadLoading} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white">
                    <span>
                      {uploadLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(e.target.files[0], "logo")
                    }
                  }}
                  disabled={uploadLoading}
                />
                <p className="text-sm text-slate-400 mt-2">PNG, JPG, WebP up to 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Restaurant Banner</CardTitle>
            <CardDescription className="text-slate-400">Upload a banner image for your restaurant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-40 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
              {bannerUrl ? (
                <img
                  src={bannerUrl || "/placeholder.svg"}
                  alt="Banner"
                  className="w-full h-40 object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-500" />
              )}
            </div>
            <Label htmlFor="banner-upload" className="cursor-pointer">
              <Button variant="outline" asChild disabled={uploadLoading} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white">
                <span>
                  {uploadLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Banner
                    </>
                  )}
                </span>
              </Button>
            </Label>
            <Input
              id="banner-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImageUpload(e.target.files[0], "banner")
                }
              }}
              disabled={uploadLoading}
            />
          </CardContent>
        </Card>

        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
            <CardDescription className="text-slate-400">Update your restaurant details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-400">Restaurant Name</Label>
                <Input
                  id="name"
                  value={settings?.name || ""}
                  onChange={(e) => settings && setSettings({ ...settings, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings?.email || ""}
                  onChange={(e) => settings && setSettings({ ...settings, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-400">Phone</Label>
                <Input
                  id="phone"
                  value={settings?.phone || ""}
                  onChange={(e) => settings && setSettings({ ...settings, phone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-400">Address</Label>
                <Input
                  id="address"
                  value={settings?.address || ""}
                  onChange={(e) => settings && setSettings({ ...settings, address: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-400">Description</Label>
              <textarea
                id="description"
                className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-white"
                rows={4}
                value={settings?.description || ""}
                onChange={(e) => settings && setSettings({ ...settings, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div>
                <p className="font-semibold text-white">Restaurant Status</p>
                <p className="text-sm text-slate-400">
                  {settings?.is_active ? "Your restaurant is active" : "Your restaurant is disabled"}
                </p>
              </div>
              <Badge variant={settings?.is_active ? "default" : "destructive"} className={settings?.is_active ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}>
                {settings?.is_active ? "Active" : "Disabled"}
              </Badge>
            </div>

            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
