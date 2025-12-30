"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  human_readable_id: string
  created_at: string
  total_amount: number
  payment_status: string
  order_status: string // e.g., 'PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'
  customer_email: string
  items: OrderItem[] | null // Assuming items are stored as JSON or a linked table
  preparation_started_at?: string
  preparation_completed_at?: string
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000) % 60
  const minutes = Math.floor(ms / (1000 * 60))
  return `${minutes}m ${seconds}s`
}

function Timer({ startTime }: { startTime: string }) {
  const [elapsedTime, setElapsedTime] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const start = new Date(startTime).getTime()
      const duration = now - start
      setElapsedTime(formatDuration(duration))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  return <>{elapsedTime}</>
}

export default function OrderTrackingPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const params = useParams()

  const orderId = params.orderId as string
  const email = searchParams.get("email")

  useEffect(() => {
    if (!orderId || !email) {
      setError("Order ID and Email are required to track your order.")
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/track-order?orderId=${orderId}&email=${encodeURIComponent(email)}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch order details securely.")
        }

        const data = await response.json()

        if (!data) {
          throw new Error("Order not found or you do not have permission to view this order.")
        }

        setOrder(data as Order)
      } catch (err: any) {
        console.error("Error fetching order:", err)
        setError(err.message || "An error occurred while fetching your order.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    const orderSubscription = supabase
      .channel(`order_status_update:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Change received!", payload)
          setOrder((prevOrder) => (prevOrder ? { ...prevOrder, ...payload.new } : (payload.new as Order)))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderSubscription)
    }
  }, [orderId, email, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading order...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Order Tracking Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/track-order">
              <Button>Try Again</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The order you are looking for could not be found or you do not have permission to view it.</p>
          </CardContent>
          <CardFooter>
            <Link href="/track-order">
              <Button>Go Back</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/track-order">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracking
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Order #{order.human_readable_id}</CardTitle>
            <CardDescription>Placed on {format(new Date(order.created_at), "PPP p")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
              <p>
                <strong>Status:</strong>{" "}
                <span className="font-medium text-primary uppercase">{order.order_status}</span>
              </p>
              <p>
                <strong>Payment Status:</strong>{" "}
                <span className="font-medium text-green-600 uppercase">{order.payment_status}</span>
              </p>
              <p>
                <strong>Total Amount:</strong> ${(order.total_amount || 0).toFixed(2)}
              </p>
              <p>
                <strong>Customer Email:</strong> {order.customer_email}
              </p>
              {order.order_status && order.order_status.toLowerCase() === "in-progress" && order.preparation_started_at && (
                <p>
                  <strong>Preparation Time:</strong> <Timer startTime={order.preparation_started_at} />
                </p>
              )}
              {order.order_status && order.order_status.toLowerCase() === "completed" &&
                order.preparation_started_at &&
                order.preparation_completed_at && (
                  <p>
                    <strong>Preparation Time:</strong>{" "}
                    {formatDuration(
                      new Date(order.preparation_completed_at).getTime() -
                        new Date(order.preparation_started_at).getTime(),
                    )}
                  </p>
                )}
            </div>

            {order.items && order.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                <ul className="space-y-2">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>${item.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">You will see real-time updates to your order status here.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

