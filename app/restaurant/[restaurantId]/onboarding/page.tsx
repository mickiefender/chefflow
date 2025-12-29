"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantEmail, setRestaurantEmail] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminName, setAdminName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const router = useRouter()
  const supabase = createClient()

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("User not authenticated")
        return
      }

      // Create restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .insert({
          super_admin_id: user.id,
          name: restaurantName,
          email: restaurantEmail,
        })
        .select()
        .single()

      if (restaurantError) {
        setError(restaurantError.message)
        return
      }

      // Create restaurant admin
      await supabase.from("restaurant_admins").insert({
        id: user.id,
        restaurant_id: restaurant.id,
        email: adminEmail,
        full_name: adminName,
      })

      // Create default departments
      const departments = ["Kitchen", "Bar", "Waiter", "Manager"]
      for (const dept of departments) {
        await supabase.from("departments").insert({
          restaurant_id: restaurant.id,
          name: dept,
        })
      }

      router.push(`/restaurant/${restaurant.id}/dashboard`)
    } catch (err) {
      setError("An error occurred during setup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Restaurant Setup</CardTitle>
          <CardDescription>Let's get your restaurant ready</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRestaurant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name *</Label>
              <Input
                id="restaurantName"
                placeholder="e.g., The Grill House"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantEmail">Restaurant Email *</Label>
              <Input
                id="restaurantEmail"
                type="email"
                placeholder="contact@restaurant.com"
                value={restaurantEmail}
                onChange={(e) => setRestaurantEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Your Full Name *</Label>
              <Input
                id="adminName"
                placeholder="John Doe"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Your Email *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@restaurant.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
