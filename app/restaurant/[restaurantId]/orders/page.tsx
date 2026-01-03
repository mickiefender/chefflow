"use client"
import { useEffect, useState, useMemo, Suspense, useTransition } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, UtensilsCrossed, AlertCircle, MoreHorizontal, Clock, CheckCircle, XCircle, Loader2, CreditCard } from "lucide-react"
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
  payment_method: string
  total_amount: number
  created_at: string
  updated_at: string | null
  updated_by_name: string | null
  restaurant_tables: { table_number: string } | null
  order_items: OrderItem[]
  payments: any[]
}

function OrdersPageComponent() {
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(searchParams.get("status") || "all")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setActiveFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  const handleUpdateStatus = (orderId: string, status: string) => {
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Find the admin's name to log it
      const { data: admin, error: adminError } = await supabase.from("restaurant_admins").select("full_name").eq("id", user.id).single()
      
      if (adminError) {
        console.error("Error fetching admin full name:", adminError);
        alert(`Failed to update order status: Could not retrieve admin details. Error: ${adminError.message}`);
        return; // Abort if admin name cannot be fetched
      }
      const adminFullName = admin ? admin.full_name : "Unknown Admin";

      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString(), updated_by_name: adminFullName })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating order status:", error);
        alert(`Failed to update order status: ${error.message}`);
      } else {
        // Log activity
        await supabase.from("activity_logs").insert({
          restaurant_id: restaurantId,
          staff_id: user.id,
          action: "ORDER_STATUS_UPDATED",
          details: { order_id: orderId, new_status: status },
        });
        fetchOrders(); // Ensure UI refreshes
      }
    });
  };

  const handleMarkAsPaid = (orderId: string) => {
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // 1. Update order
      await supabase.from("orders").update({ payment_status: "PAID", payment_method: "CASH" }).eq("id", orderId)

      // 2. Create payment record
      const { data: order } = await supabase.from("orders").select("total_amount").eq("id", orderId).single()
      if (order) {
        await supabase.from("payments").insert({
          order_id: orderId,
          provider: "cash",
          status: "success",
          amount: order.total_amount,
          method: "CASH",
        })
      }

      // 3. Log activity
      await supabase.from("activity_logs").insert({
        restaurant_id: restaurantId,
        staff_id: user.id,
        action: "CASH_PAYMENT_MARKED",
        details: { order_id: orderId },
      })

      fetchOrders() // Refetch orders to update UI
    })
  }

  const handleRefund = (paymentId: string) => {
    startTransition(async () => {
      const response = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      })

      if (response.ok) {
        alert("Refund processed successfully!")
        fetchOrders()
      } else {
        const { error, details } = await response.json()
        alert(`Refund failed: ${error} - ${details}`)
      }
    })
  }

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel(`orders-page-realtime:${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchOrders(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

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
        payment_method,
        updated_at,
        updated_by_name,
        restaurant_tables ( table_number ),
        order_items ( menu_items ( image_url ) ),
        payments(*)
      `,
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })

    if (data) {
      console.log("Fetched Orders Data:", data);
      // Transform data to match OrderWithDetails type
      const transformed = data.map((order: any) => ({
        ...order,
        restaurant_tables: Array.isArray(order.restaurant_tables)
          ? order.restaurant_tables[0] || null
          : order.restaurant_tables || null,
        order_items: Array.isArray(order.order_items)
          ? order.order_items.map((item: any) => ({
              ...item,
              menu_items: Array.isArray(item.menu_items)
                ? item.menu_items[0] || null
                : item.menu_items || null,
            }))
          : [],
      }))
      setOrders(transformed)
    } else if (error) {
     console.error("Error fetching orders:", JSON.stringify(error, null, 2));
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "in-progress":
        return "bg-blue-500/20 text-blue-400"
      case "completed":
        return "bg-green-500/20 text-green-400"
      case "cancelled":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-slate-700/20 text-slate-400"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-green-500/20 text-green-400"
      case "UNPAID":
        return "bg-red-500/20 text-red-400"
      case "REFUNDED":
        return "bg-slate-700/20 text-slate-400"
      default:
        return "bg-slate-700/20 text-slate-400"
    }
  }

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders
    return orders.filter((order) => order.status.toLowerCase() === activeFilter.toLowerCase())
  }, [orders, activeFilter])

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: OrderWithDetails[] } = {}

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.created_at)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let dateKey: string
      if (orderDate.toDateString() === today.toDateString()) {
        dateKey = "Today"
      } else if (orderDate.toDateString() === yesterday.toDateString()) {
        dateKey = "Yesterday"
      } else {
        dateKey = orderDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(order)
    })

    return Object.entries(groups).map(([date, orders]) => ({ date, orders }))
  }, [filteredOrders])

  const ALL_STATUSES = ["Pending", "In-Progress", "Completed", "Cancelled"]

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/restaurant/${restaurantId}/dashboard`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/restaurant/${restaurantId}/orders/report`}>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white">
              View Report
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
          <p className="text-slate-400">Live order tracking with real-time updates</p>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{orders.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {orders.filter((o) => o.status.toLowerCase() === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {orders.filter((o) => o.status.toLowerCase() === "in-progress").length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {orders.filter((o) => o.status.toLowerCase() === "completed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {["all", "pending", "in-progress", "completed", "cancelled"].map((status) => (
            <Link key={status} href={`/restaurant/${restaurantId}/orders?status=${status}`} scroll={false}>
              <Button
                variant={activeFilter === status ? "default" : "outline"}
                className={`capitalize flex-shrink-0 ${activeFilter === status ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"}`}
              >
                {status.replace("-", " ")}
              </Button>
            </Link>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6 text-center text-slate-400 py-12">
                <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p>No {activeFilter === "all" ? "" : activeFilter} orders found.</p>
              </CardContent>
            </Card>
          ) : (
            groupedOrders.map((group) => (
              <div key={group.date}>
                <h2 className="text-lg font-bold text-white sticky top-16 bg-slate-950/90 backdrop-blur-sm py-2 my-4 z-10">
                  {group.date}
                </h2>
                <div className="space-y-4">
                  {group.orders.map((order) => (
                    <Card key={order.id} className="bg-slate-900 border-slate-800 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                            <p className="text-sm text-slate-400">
                              Table: {order.restaurant_tables?.table_number || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right space-y-2 flex items-center gap-2">
                            <div>
                              <div className="font-bold text-lg text-white">GH₵{order.total_amount?.toFixed(2) || "0.00"}</div>
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              <Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status || 'UNPAID'}</Badge>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isPending} className="text-slate-400 hover:text-white">
                                  {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                {ALL_STATUSES.map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    disabled={order.status === status || isPending}
                                    onClick={() => handleUpdateStatus(order.id, status)}
                                    className="text-slate-300 hover:bg-slate-700 hover:text-white"
                                  >
                                    {status === "Pending" && <Clock className="mr-2 h-4 w-4" />}
                                    {status === "In-Progress" && <Loader2 className="mr-2 h-4 w-4" />}
                                    {status === "Completed" && <CheckCircle className="mr-2 h-4 w-4" />}
                                    {status === "Cancelled" && <XCircle className="mr-2 h-4 w-4" />}
                                    <span>{status.replace("-", " ")}</span>
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="bg-slate-700" />
                                <DropdownMenuItem
                                  disabled={order.payment_status === "PAID" || isPending}
                                  onClick={() => handleMarkAsPaid(order.id)}
                                  className="text-slate-300 hover:bg-slate-700 hover:text-white"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Mark as Paid (Cash)</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={
                                    !order.payments.some(p => p.provider === "paystack" && p.status === "success") ||
                                    isPending
                                  }
                                  onClick={() => {
                                    const paymentToRefund = order.payments.find(
                                      p => p.provider === "paystack" && p.status === "success",
                                    )
                                    if (paymentToRefund) {
                                      handleRefund(paymentToRefund.id)
                                    }
                                  }}
                                  className="text-slate-300 hover:bg-slate-700 hover:text-white"
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  <span>Refund Online Payment</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <div className="flex justify-between items-center">
                            <div className="flex -space-x-2">
                              {order.order_items.slice(0, 5).map((item, index) =>
                                item.menu_items?.image_url ? (
                                  <img
                                    key={index}
                                    src={item.menu_items.image_url}
                                    alt="Menu item"
                                    className="w-20 h-20 rounded-full border-2 border-slate-900 object-cover"
                                  />
                                ) : (
                                  <div
                                    key={index}
                                    className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center"
                                  >
                                    <UtensilsCrossed className="w-4 h-4 text-slate-400" />
                                  </div>
                                ),
                              )}
                              {order.order_items.length > 5 && (
                                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                  +{order.order_items.length - 5}
                                </div>
                              )}
                            </div>
                            {order.updated_by_name && (
                              <p className="text-xs text-slate-500">
                                Last updated by {order.updated_by_name} at{" "}
                                {new Date(order.updated_at!).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <OrdersPageComponent />
    </Suspense>
  )
}
