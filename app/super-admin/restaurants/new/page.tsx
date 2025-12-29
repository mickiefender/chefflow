"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



export default function NewRestaurantPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminName, setAdminName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [settlementBank, setSettlementBank] = useState("")
  const [country, setCountry] = useState("ghana") // Add country state
  const [providers, setProviders] = useState<{ code: string; name: string }[]>([]) // State for providers
  const [loadingProviders, setLoadingProviders] = useState(false) // State for loading providers
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

    // Fetch providers when country changes
  useEffect(() => {
    const fetchProviders = async () => {
      if (!country) return
      setLoadingProviders(true)
      try {
        const response = await fetch(`/api/payments/get-banks?country=${country}`)
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch providers");
        }
        const data = await response.json()
        setProviders(data)
        setSettlementBank("") // Reset settlement bank when country changes
      } catch (error: any) {
        setError(error.message || "Could not load payment providers. Please try again.")
        console.error(error)
      } finally {
        setLoadingProviders(false)
      }
    }
    fetchProviders()
  }, [country])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/super-admin/login")
      return
    }

    const { data } = await supabase.from("super_admins").select("id").eq("id", user.id).single()

    if (!data) {
      router.push("/super-admin/login")
      return
    }

    setAuthLoading(false)
  }

  const validateForm = () => {
    if (!name.trim()) return { isValid: false, message: "Restaurant Name is required." };
    if (!email.trim()) return { isValid: false, message: "Restaurant Email is required." };
    if (!adminName.trim()) return { isValid: false, message: "Admin Full Name is required." };
    if (!adminEmail.trim()) return { isValid: false, message: "Admin Email is required." };
    if (!adminPassword.trim()) return { isValid: false, message: "Admin Password is required." };
    if (!settlementBank.trim()) return { isValid: false, message: "Settlement Provider is required." };
    if (!accountNumber.trim()) return { isValid: false, message: "Account Number is required." };
    return { isValid: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.message);
      console.error("Form validation failed:", validation.message); // Added console.error
      setLoading(false);
      return;
    }


    try {
      // 1. Create Paystack Subaccount
      const subaccountResponse = await fetch('/api/payments/create-subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: name,
          settlementBankCode: settlementBank,
          accountNumber,
          country,
        }),
      });

      if (!subaccountResponse.ok) {
        const errorData = await subaccountResponse.json();
        console.error("Paystack Subaccount creation error:", errorData);
        throw new Error(errorData.error || 'Failed to create Paystack subaccount.');
      }

      const { subaccount_code: paystackSubaccountCode } = await subaccountResponse.json();

      if (!paystackSubaccountCode) {
        console.error("Paystack Subaccount code missing in response.");
        throw new Error('Subaccount code not received from Paystack.');
      }

      // 2. Get current super admin user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("Supabase authentication error: User not authenticated.");
        setError("User not authenticated")
        setLoading(false)
        return
      }

      // 3. Create the restaurant admin user in Supabase Auth
      const {
        data: adminAuthData,
        error: adminAuthError
      } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (adminAuthError) {
        console.error("Supabase Admin Auth signup error:", adminAuthError);
        throw new Error(`Error creating admin account: ${adminAuthError.message}`)
      }

      if (!adminAuthData.user) {
        console.error("Supabase Admin Auth signup failed, no user data returned.");
        throw new Error("Failed to create admin account")
      }

      // 4. Insert the new restaurant into the database
      const {
        data: restaurantData,
        error: restaurantError
      } = await supabase
        .from("restaurants")
        .insert({
          super_admin_id: user.id,
          name,
          email,
          phone,
          address,
          description,
          paystack_subaccount_code: paystackSubaccountCode,
        })
        .select()
        .single()

      if (restaurantError) {
        console.error("Supabase Restaurant insert error:", restaurantError);
        throw new Error(`Failed to insert restaurant: ${restaurantError.message}`)
      }

      // 5. Create the admin profile linked to the restaurant
      const { error: adminError } = await supabase.from("restaurant_admins").insert({
        id: adminAuthData.user.id,
        restaurant_id: restaurantData.id,
        email: adminEmail,
        name: adminName,
      })

      if (adminError) {
        console.error("Supabase Restaurant Admin insert error:", adminError);
        throw new Error(`Failed to create admin record: ${adminError.message}`)
      }

      // 6. Create default departments for the restaurant
      const departments = ["Kitchen", "Bar", "Waiter"]
      for (const dept of departments) {
        await supabase.from("departments").insert({
          restaurant_id: restaurantData.id,
          name: dept,
          description: `${dept} department`,
        })
      }

      // 7. Redirect on success
      router.push("/super-admin/dashboard")
    } catch (err: any) {
      console.error("General restaurant creation error:", err);
      setError(err.message || "An unexpected error occurred during restaurant creation.")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/super-admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Register New Restaurant</CardTitle>
            <CardDescription>
              Add a new restaurant to your RestaurantPOS system and create its admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Restaurant Information</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Pizza Palace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Restaurant Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="restaurant@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Restaurant description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Paystack Integration (for Online Payments)</h3>
                <p className="text-sm text-yellow-800">
                  A Paystack subaccount will be created to split payments. Bank details are required.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select onValueChange={setCountry} value={country} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ghana">Ghana</SelectItem>
                      <SelectItem value="nigeria">Nigeria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settlementBank">Settlement Provider *</Label>
                  <Select onValueChange={setSettlementBank} value={settlementBank} disabled={loading || loadingProviders}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingProviders ? "Loading providers..." : "Select a provider"} />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={`${provider.code}-${provider.name}`} value={provider.code}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Restaurant Admin Account</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Full Name *</Label>
                  <Input
                    id="adminName"
                    placeholder="John Smith"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-foreground/70">Minimum 8 characters recommended</p>
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

              <div className="flex gap-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Restaurant"
                  )}
                </Button>
                <Link href="/super-admin/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
