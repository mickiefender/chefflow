"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!orderId.trim() || !email.trim()) {
      setError("Please enter both your Order ID and Email.")
      setLoading(false)
      return
    }

    try {
      // We will navigate to a dynamic route like /track-order/[orderId]?email=[email]
      // Or we can fetch data directly here after creating an API endpoint
      // For now, let's navigate to a new page that will display the order.
      router.push(`/track-order/${orderId}?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      console.error("Error tracking order:", err)
      setError(err.message || "An unexpected error occurred while trying to track your order.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Track Your Order</CardTitle>
          <CardDescription>
            Enter your Order ID and the email used for payment to view your order status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrackOrder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                placeholder="e.g., ORD-123456"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tracking...
                </>
              ) : (
                "Track Order"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
