"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function InitStoragePage() {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const supabase = createClient()

  const handleInitStorage = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/storage/init", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setCompleted(true)
      }
    } catch (err) {
      console.error("[v0] Init error:", err)
      alert("Failed to initialize storage")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Storage Setup</CardTitle>
          <CardDescription>Initialize Supabase storage buckets for your restaurant system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {completed ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="font-semibold text-lg">Setup Complete!</p>
              <p className="text-sm text-foreground/70">
                Storage buckets are now ready for logos, menus, banners, and staff photos.
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => (window.location.href = "/")}>
                Go to Home
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold">This setup will create:</p>
                <ul className="space-y-1 text-foreground/70">
                  <li>✓ restaurant-logos (public)</li>
                  <li>✓ menu-images (public)</li>
                  <li>✓ banners (public)</li>
                  <li>✓ staff-photos (private)</li>
                </ul>
              </div>
              <Button
                onClick={handleInitStorage}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Storage"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
