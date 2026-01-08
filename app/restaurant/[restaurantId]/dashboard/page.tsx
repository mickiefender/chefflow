"use client"

import { useEffect, useState, useTransition, useCallback, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  LogOut,
  Settings,
  Users,
  ShoppingCart,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  UtensilsCrossed,
  MoreVertical,
  XCircle,
  BarChart3,
  Package,
  Home,
  QrCode,
} from "lucide-react"
import { useRealtimeOrders } from "@/lib/hooks/use-realtime-orders"
import { debounce } from "@/lib/utils"

interface RecentOrderItem {
  quantity: number
  menu_items: {
    name: string
    image_url: string | null
  } | null
}

interface RecentOrder {
  id: string
  created_at: string
  restaurant_tables: { table_number: string } | null
  status: "pending" | "completed" | "cancelled"
  payment_status: "PENDING" | "PAID" | "REFUNDED" | "FAILED" // Add payment_status
  order_items: RecentOrderItem[]
  total_amount: string
}

interface DashboardData {
  totalOrders: number
  totalRevenue: number
  totalStaff: number
  departmentCount: number
  pendingOrders: number
  completedOrders: number
  recentOrders: RecentOrder[]
  salesData: any[]
  restaurantName: string
  menuItemCount: number
  sampleMenuItems: { image_url: string | null }[]
  topDishes: { name: string; quantity: number; image_url: string | null }[]
  restaurantLogo?: string
}

export default function RestaurantDashboard() {
  const [staticData, setStaticData] = useState<{
    staffCount: number
    departmentCount: number
    menuItemCount: number
    sampleMenuItems: any[]
    restaurantName: string
    restaurantLogo?: string
  } | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const supabase = createClient()

  const { orders: allOrdersData, loading: ordersLoading, refetch: allOrdersRefetch } = useRealtimeOrders(restaurantId)
  const { orders: pendingOrdersData, refetch: pendingOrdersRefetch } = useRealtimeOrders(restaurantId, "pending")
  const { orders: completedOrdersData, refetch: completedOrdersRefetch } = useRealtimeOrders(restaurantId, "completed")

  useEffect(() => {
   

    const fetchInitialStaticData = async () => {
    
      try {
        const { data: staff } = await supabase.from("staff_members").select("id").eq("restaurant_id", restaurantId)

        const { data: departments } = await supabase
          .from("departments")
          .select("id")
          .eq("restaurant_id", restaurantId)

        const { data: menuItems, count: menuItemCount } = await supabase
          .from("menu_items")
          .select("image_url", { count: "exact" })
          .eq("restaurant_id", restaurantId)
          .limit(4)

        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("name, logo_url")
          .eq("id", restaurantId)
          .single()

        setStaticData({
          staffCount: staff?.length || 0,
          departmentCount: departments?.length || 0,
          menuItemCount: menuItemCount || 0,
          sampleMenuItems: menuItems || [],
          restaurantName: restaurant?.name || "Restaurant",
          restaurantLogo: restaurant?.logo_url,
        })
      } finally {
        setInitialLoading(false)
      }
    }
    fetchInitialStaticData()

    const pollingInterval = setInterval(() => {
      allOrdersRefetch()
      pendingOrdersRefetch()
      completedOrdersRefetch()
    }, 10000)

    return () => {
      clearInterval(pollingInterval)
    }
  }, [
    restaurantId,
    allOrdersRefetch,
    pendingOrdersRefetch,
    completedOrdersRefetch,
    supabase,
    router,
  ])

  const totalRevenue =
    allOrdersData?.reduce((sum, order) => sum + (Number.parseFloat(order.total_amount || "0") || 0), 0) || 0

  const salesData = []
  const today = new Date()
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const dailyOrders =
      allOrdersData?.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= date && orderDate < nextDate
      }) || []

    const dailyRevenue = dailyOrders.reduce(
      (sum, order) => sum + (Number.parseFloat(order.total_amount || "0") || 0),
      0,
    )
    salesData.push({ name: daysOfWeek[date.getDay()], sales: dailyOrders.length, revenue: dailyRevenue })
  }

  const topDishes = allOrdersData
    .flatMap(order => order.order_items)
    .reduce((acc, item) => {
      if (item.menu_items) {
        const existingItem = acc.find(i => i.name === item.menu_items!.name)
        if (existingItem) {
          existingItem.quantity += item.quantity
        } else {
          acc.push({
            name: item.menu_items.name,
            quantity: item.quantity,
            image_url: item.menu_items.image_url,
          })
        }
      }
      return acc
    }, [] as { name: string; quantity: number; image_url: string | null }[])
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3)

  const data: DashboardData | null = staticData
    ? {
        totalOrders: allOrdersData.length,
        totalRevenue,
        totalStaff: staticData.staffCount,
        departmentCount: staticData.departmentCount,
        pendingOrders: pendingOrdersData.length,
        completedOrders: completedOrdersData.length,
        recentOrders: allOrdersData.slice(0, 5),
        restaurantName: staticData.restaurantName,
        menuItemCount: staticData.menuItemCount,
        sampleMenuItems: staticData.sampleMenuItems,
        restaurantLogo: staticData.restaurantLogo,
        salesData: salesData,
        topDishes: topDishes,
      }
    : null

  const dailyDate = new Date()
  dailyDate.setHours(0, 0, 0, 0)

  const todaysOrders =
    allOrdersData?.filter((order) => {
      const orderDate = new Date(order.created_at)
      return orderDate >= dailyDate
    }) || []

  const paidToday = todaysOrders.filter(order => order.payment_status === "PAID").length
  const unpaidToday = todaysOrders.length - paidToday

  const todaysSales = todaysOrders
    .filter(order => order.payment_status === "PAID")
    .reduce((sum, order) => sum + (Number.parseFloat(order.total_amount || "0") || 0), 0)

  const dailyOrderData = [
    { name: 'Paid', value: paidToday, fill: '#4ade80' }, // green-400
    { name: 'Unpaid', value: unpaidToday, fill: '#f87171' }, // red-400
  ];


  const handleUpdateOrderStatus = async (orderId: string, status: "completed" | "cancelled") => {
    startTransition(async () => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) {
        console.error("Error updating order status:", error)
      }
    })
  }

  if (initialLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Welcome back to your restaurant dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <AlertCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <CardTitle className="text-sm font-medium text-slate-400">Total Sales</CardTitle>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">GH₵{data?.totalRevenue.toLocaleString()}</div>
                <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>↑ 12.08%</span>
                  <span className="text-slate-500">+130,254 today</span>
                </p>
              </CardContent>
            </Card>

            {/* Total Orders Card */}
            <Link href={`/restaurant/${restaurantId}/orders`}>
              <Card className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <CardTitle className="text-sm font-medium text-slate-400">Total Orders</CardTitle>
                    </div>
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{data?.totalOrders.toLocaleString()}</div>
                  <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>↑ 9.08%</span>
                    <span className="text-slate-500">+1,005 today</span>
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Top Countries Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <CardTitle className="text-sm font-medium text-slate-400">Top Dishes</CardTitle>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.topDishes.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                        <UtensilsCrossed className="w-3 h-3 text-slate-400" />
                      </div>
                    )}
                    <span className="text-sm text-slate-300 flex-1">{item.name}</span>
                    <span className="text-sm font-medium text-white">{item.quantity}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Active Staff Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <CardTitle className="text-sm font-medium text-slate-400">Active Staff</CardTitle>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{data?.totalStaff}</div>
                <p className="text-sm text-slate-500 mt-2">Across {data?.departmentCount} departments</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statistics Chart */}
            <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-white">Statistics</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        Current Week
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Current Week</DropdownMenuItem>
                      <DropdownMenuItem>Last Month</DropdownMenuItem>
                      <DropdownMenuItem>Last Year</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6" }}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Billing & Overview */}
            <div className="space-y-6">
              {/* Billing Card */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white">Daily Orders</CardTitle>
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={dailyOrderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {dailyOrderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

             
            </div>
          </div>

          {/* Today's Stats & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Today's Sales Card */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <CardTitle className="text-sm font-medium text-slate-400">Today's Sales</CardTitle>
                    </div>
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">GH₵{todaysSales.toLocaleString()}</div>
                  <p className="text-sm text-slate-500 mt-2">Total sales from paid orders today</p>
                </CardContent>
              </Card>

              {/* Today's Orders Card */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <CardTitle className="text-sm font-medium text-slate-400">Today's Orders</CardTitle>
                    </div>
                    <ShoppingCart className="w-4 h-4 text-slate-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{todaysOrders.length}</div>
                  <p className="text-sm text-slate-500 mt-2">{paidToday} paid, {unpaidToday} pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-slate-300">{order.restaurant_tables?.table_number || "?"}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex -space-x-2">
                        {order.order_items.slice(0, 3).map((item, index) =>
                          item.menu_items?.image_url ? (
                            <img
                              key={index}
                              src={item.menu_items.image_url || "/placeholder..svg"}
                              alt={item.menu_items.name}
                              className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
                            />
                          ) : (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center"
                            >
                              <UtensilsCrossed className="w-3 h-3 text-slate-400" />
                            </div>
                          ),
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString()}</p>
                        <div className="flex gap-1">
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              order.status === "pending"
                                ? "bg-amber-500/20 text-amber-400"
                                : order.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              order.payment_status === "PAID"
                                ? "bg-green-500/20 text-green-400"
                                : order.payment_status === "PENDING"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {order.status === "pending" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" disabled={isPending}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                            className="text-slate-300"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Mark as Completed</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400"
                            onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Cancel Order</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

