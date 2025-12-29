"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { UserPlus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function RestaurantOnboarding() {
  const router = useRouter()
  const supabase = createClient()

  const [restaurantName, setRestaurantName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [cuisine, setCuisine] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: rpcError } = await supabase.rpc("create_restaurant_and_admin", {
      restaurant_name: restaurantName,
      admin_email: email,
      admin_password: password,
      admin_name: adminName,
      restaurant_address: address,
      restaurant_phone: phone,
      restaurant_website: website,
      restaurant_cuisine: cuisine,
    })

    if (rpcError) {
      console.error("Sign up error:", rpcError)
      setError(rpcError.message || "An unexpected error occurred during sign-up.")
    } else {
      setSuccess(true)
      // Optionally redirect after a delay or let the user click a link
      // router.push('/auth/login');
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Registration Successful!</CardTitle>
            <CardDescription>Please check your email to confirm your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>A confirmation link has been sent to <strong>{email}</strong>. Once you confirm your email, you can log in to your dashboard.</p>
            <Button onClick={() => router.push('/auth/login')} className="w-full mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-6 h-6" /> Create Your Restaurant Account
          </CardTitle>
          <CardDescription>Fill out the form below to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input id="restaurantName" type="text" placeholder="e.g., The Grand Bistro" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuisine">Cuisine Type</Label>
              <Input id="cuisine" type="text" placeholder="e.g., Italian, Mexican, Fusion" value={cuisine} onChange={(e) => setCuisine(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" type="text" placeholder="123 Main St, Anytown, USA" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="(123) 456-7890" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Your Name</Label>
              <Input id="adminName" type="text" placeholder="e.g., John Doe" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
