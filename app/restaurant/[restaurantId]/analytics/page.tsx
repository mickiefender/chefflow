"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client" // Import Supabase client

interface Order {
  total_amount: string
  created_at: string
  status: "pending" | "completed" | "cancelled"
  restaurant_id: string
}

interface Analytics {
  totalRevenue: number
  completedOrders: number
  pendingOrders: number
  totalOrders: number
  averageOrderValue: number
  dailyData: Array<{ date: string; amount: number }>
}

// Function to calculate analytics from a list of orders
const calculateAnalytics = (orders: Order[]): Analytics => {
  const days = 30 // hardcode for now, can be dynamic later

  // Get date range for the last 'days'
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at)
    return orderDate >= startDate
  })

  const totalRevenue =
    filteredOrders?.reduce((sum, order) => sum + (Number.parseFloat(order.total_amount || "0") || 0), 0) || 0
  const completedOrders = filteredOrders?.filter((o) => o.status === "completed").length || 0
  const pendingOrders = filteredOrders?.filter((o) => o.status === "pending").length || 0

  // Group by day for daily data
  const dailyDataMap: Record<string, number> = {}
  filteredOrders?.forEach((order) => {
    const date = new Date(order.created_at).toLocaleDateString("en-CA") // Use 'en-CA' for YYYY-MM-DD format
    dailyDataMap[date] = (dailyDataMap[date] || 0) + (Number.parseFloat(order.total_amount || "0") || 0)
  })

  // Ensure all last 'days' have an entry, even if 0
  const dailyData: Array<{ date: string; amount: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString("en-CA")
    dailyData.push({ date: dateStr, amount: dailyDataMap[dateStr] || 0 })
  }

  return {
    totalRevenue,
    completedOrders,
    pendingOrders,
    totalOrders: filteredOrders?.length || 0,
    averageOrderValue: filteredOrders && filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
    dailyData: dailyData,
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const restaurantId = params.restaurantId as string

  const supabase = createClient()

  const fetchAndCalculateAnalytics = useCallback(async () => {
    setLoading(true)
    const { data: orders, error } = await supabase
      .from("orders")
      .select("total_amount, created_at, status, restaurant_id")
      .eq("restaurant_id", restaurantId)
      // Orders from the last 30 days
      .gte("created_at", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())

    if (error) {
      console.error("Error fetching orders:", error)
      setLoading(false)
      return
    }
    setAnalytics(calculateAnalytics(orders || []))
    setLoading(false)
  }, [restaurantId, supabase, setLoading])

  useEffect(() => {
    fetchAndCalculateAnalytics()

    const channel = supabase
      .channel("orders_realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          // When a change occurs, refetch all orders and recalculate analytics
          // A more optimized approach would be to incrementally update the state
          // but for simplicity, we refetch all relevant data.
          fetchAndCalculateAnalytics()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, supabase, fetchAndCalculateAnalytics])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href={`/restaurant/${restaurantId}/dashboard`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Analytics & Reports</h1>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Revenue (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">GH¢{analytics?.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Link href={`/restaurant/${restaurantId}/orders?status=completed`}>
            <Card className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-700 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Completed Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white">{analytics?.completedOrders}</div>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/restaurant/${restaurantId}/orders?status=pending`}>
            <Card className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-700 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white">{analytics?.pendingOrders}</div>
              </CardContent>
            </Card>
          </Link>
           <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{analytics?.totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Average Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">GH¢{analytics?.averageOrderValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Daily Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#e2e8f0" }} />
                  <Line type="monotone" dataKey="amount" stroke="#8b5cf6" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Order Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white">Completed</span>
                    <span className="font-bold text-white">{analytics?.completedOrders}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${((analytics?.completedOrders || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white">Pending</span>
                    <span className="font-bold text-white">{analytics?.pendingOrders}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${((analytics?.pendingOrders || 0) / (analytics?.totalOrders || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
