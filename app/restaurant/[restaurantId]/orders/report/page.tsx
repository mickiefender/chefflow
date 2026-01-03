"use client"
import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, UtensilsCrossed } from "lucide-react"
import Link from "next/link"

interface OrderItem {
  menu_items: {
    image_url: string | null
  } | null
}

interface OrderWithDetails {
  id: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  restaurant_tables: { table_number: string } | null
  order_items: OrderItem[]
}

function OrderList({ title, orders }: { title: string; orders: OrderWithDetails[] }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "completed":
        return "bg-green-500/20 text-green-400"
      default:
        return "bg-slate-700/20 text-slate-400"
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      {orders.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6 text-center text-slate-400 py-12">
            <p>No orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-sm text-slate-400">
                      Table: {order.restaurant_tables?.table_number || "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-white">GH₵{order.total_amount.toFixed(2)}</div>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrdersReportPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const supabase = createClient()

  const [pendingOrders, setPendingOrders] = useState<OrderWithDetails[]>([])
  const [completedOrders, setCompletedOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          created_at,
          total_amount,
          status,
          payment_status,
          restaurant_tables ( table_number ),
          order_items ( menu_items ( image_url ) )
        `,
        )
        .eq("restaurant_id", restaurantId)
        .in("status", ["pending", "completed"])
        .order("created_at", { ascending: false })

      if (data) {
        const pending = data.filter(o => o.status === 'pending') as OrderWithDetails[]
        const completed = data.filter(o => o.status === 'completed') as OrderWithDetails[]
        setPendingOrders(pending)
        setCompletedOrders(completed)
      } else if (error) {
        console.error("Error fetching orders:", error)
      }
      setLoading(false)
    }

    fetchOrders()

    const channel = supabase
      .channel(`orders-report-realtime:${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchOrders(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, supabase])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href={`/restaurant/${restaurantId}/orders`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Orders Report</h1>
          <p className="text-slate-400">A summary of pending and completed orders.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <OrderList title="Pending Orders" orders={pendingOrders} />
          <OrderList title="Completed Orders" orders={completedOrders} />
        </div>
      </div>
    </div>
  )
}
