"use client"

import { useEffect, useState, useTransition, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRealtimeOrders } from "@/lib/hooks/use-realtime-orders"
import { Clock, CheckCircle2, LogOut, AlertCircle, Utensils, XCircle, CheckCircle, Menu as MenuIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface OrderItemDetail {
  id: string
  quantity: number
  menu_items: {
    name: string
    image_url: string | null
    menu_categories: { type: string } | null
  } | null
  status: string
}

interface OrderDetail {
  id: string
  restaurant_tables: { table_number: string } | null
  status: string
  payment_status: string
  created_at: string
  order_items: OrderItemDetail[]
  total_amount: number
  preparation_started_at?: string
  preparation_completed_at?: string
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  available: boolean
}

interface MenuCategory {
  id: string
  name: string
  sort_order: number
  menu_items: MenuItem[]
}

export default function StaffDashboard() {
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const departmentId = params.departmentId as string
  const supabase = createClient()

  const [activeFilter, setActiveFilter] = useState("pending")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [departmentName, setDepartmentName] = useState<string | undefined>()
  const { orders: detailedOrders, loading: ordersLoading, refetch: refetchOrders } = useRealtimeOrders(
    restaurantId,
    departmentName,
  )
  const [loading, setLoading] = useState(true)
  const [staffInfo, setStaffInfo] = useState<any>(null)
  const [restaurantName, setRestaurantName] = useState("Dashboard")
  const [isPending, startTransition] = useTransition()
  const [activeView, setActiveView] = useState("orders")
  const [menu, setMenu] = useState<MenuCategory[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [lowStockLoading, setLowStockLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return null
      }

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", restaurantId)
        .single()

      if (restaurant) {
        setRestaurantName(restaurant.name)
      }

      const { data: department } = await supabase
        .from("departments")
        .select("name")
        .eq("id", departmentId)
        .single()
      if (department) {
        setDepartmentName(department.name)
      }

      const { data: staff } = await supabase.from("staff_members").select("*, departments(*)").eq("id", user.id).single()

      if (!staff || staff.restaurant_id !== restaurantId || staff.department_id !== departmentId) {
        router.push("/auth/login")
        return null
      }

      setStaffInfo(staff)
      setLoading(false)
      return department
    }

    const fetchMenu = async () => {
      if (!restaurantId) return
      setMenuLoading(true)
      try {
        const response = await fetch(`/api/menu?restaurantId=${restaurantId}`)
        if (response.ok) {
          const data = await response.json()
          setMenu(data)
        }
      } catch (error) {
        console.error("Failed to fetch menu:", error)
      } finally {
        setMenuLoading(false)
      }
    }

    const fetchLowStockItems = async () => {
      if (!restaurantId) return
      setLowStockLoading(true)
      try {
        const response = await fetch(`/api/menu/low-stock?restaurantId=${restaurantId}`)
        if (response.ok) {
          const data = await response.json()
          setLowStockItems(data)
        }
      } catch (error) {
        console.error("Failed to fetch low stock items:", error)
      } finally {
        setLowStockLoading(false)
      }
    }

    const init = async () => {
      const department = await checkAuth()
      await fetchMenu()
      if (department && department.name?.toLowerCase() === "bar") {
        await fetchLowStockItems()
      }
    }

    init()
  }, [restaurantId, departmentId, supabase, router])

  const toggleAvailability = async (menuItemId: string, available: boolean) => {
    try {
      const response = await fetch(`/api/menu/${menuItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !available }),
      })

      if (response.ok) {
        setMenu(prevMenu =>
          prevMenu.map(category => ({
            ...category,
            menu_items: category.menu_items.map(item =>
              item.id === menuItemId ? { ...item, available: !available } : item,
            ),
          })),
        )
      } else {
        console.error("Failed to update menu item availability")
      }
    } catch (error) {
      console.error("Error toggling availability:", error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        let updateData: any = {
          status: newStatus,
          updated_by_name: staffInfo?.full_name,
          updated_at: new Date().toISOString(),
        }

        if (newStatus === "In-Progress") {
          updateData.preparation_started_at = new Date().toISOString()
        } else if (newStatus === "Completed") {
          updateData.preparation_completed_at = new Date().toISOString()
        }

        const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

        if (!error) {
          await supabase.from("activity_logs").insert({
            restaurant_id: restaurantId,
            staff_id: staffInfo?.id,
            action: "ORDER_STATUS_UPDATED",
            details: {
              order_id: orderId,
              new_status: newStatus,
              department: staffInfo?.departments?.name,
            },
          })
          refetchOrders()
        }
      } catch (err) {
        console.error("Error updating order:", err)
      }
    })
  }

  const handleMarkAsPaid = (orderId: string, totalAmount: number) => {
    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("orders").update({ payment_status: "PAID", payment_method: "CASH" }).eq("id", orderId)

      await supabase.from("payments").insert({
        order_id: orderId,
        provider: "cash",
        status: "success",
        amount: totalAmount,
        method: "CASH",
      })

      await supabase.from("activity_logs").insert({
        restaurant_id: restaurantId,
        staff_id: user.id,
        action: "CASH_PAYMENT_MARKED",
        details: { order_id: orderId },
      })

      refetchOrders()
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
      case "in-progress":
        return "bg-blue-900/40 text-blue-300 border border-blue-700"
      case "pending":
        return "bg-amber-900/40 text-amber-300 border border-amber-700"
      case "cancelled":
        return "bg-red-900/40 text-red-300 border border-red-700"
      default:
        return "bg-slate-900/40 text-slate-300 border border-slate-700"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
      case "UNPAID":
        return "bg-red-900/40 text-red-300 border border-red-700"
      case "REFUNDED":
        return "bg-slate-900/40 text-slate-300 border border-slate-700"
      default:
        return "bg-slate-900/40 text-slate-300 border border-slate-700"
    }
  }

  const filteredOrders = useMemo(
    () => detailedOrders.filter((order) => order.status.toLowerCase() === activeFilter.toLowerCase()),
    [detailedOrders, activeFilter],
  )

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: OrderDetail[] } = {}
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
        dateKey = orderDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      }

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(order)
    })
    return Object.entries(groups).map(([date, orders]) => ({ date, orders }))
  }, [filteredOrders])

  if (loading || ordersLoading || menuLoading || lowStockLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-slate-400">Loading dashboard...</div>
    )
  }

  const stats = {
    pending: detailedOrders.filter((o) => o.status.toLowerCase() === "pending").length,
    inProgress: detailedOrders.filter((o) => o.status.toLowerCase() === "in-progress").length,
    completed: detailedOrders.filter((o) => o.status.toLowerCase() === "completed").length,
    total: detailedOrders.length,
  }

  const renderOrdersView = () => (
    <>
      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Orders" value={stats.pending} color="amber" icon="" />
        <StatCard label="In Progress" value={stats.inProgress} color="blue" icon="" />
        <StatCard label="Completed Today" value={stats.completed} color="emerald" icon="" />
        <StatCard label="Total Orders" value={stats.total} color="slate" icon="" />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {["pending", "in-progress", "completed"].map((status) => (
          <Button
            key={status}
            variant={activeFilter === status ? "default" : "outline"}
            onClick={() => setActiveFilter(status)}
            className={`capitalize flex-shrink-0 ${
              activeFilter === status
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            {status.replace("-", " ")}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No {activeFilter} orders at the moment</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          groupedOrders.map((group) => (
            <div key={group.date}>
              <h2 className="text-lg font-bold sticky top-20 bg-slate-950/90 backdrop-blur-sm py-2 my-4 z-10 text-slate-300">
                {group.date}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.orders.map((order) => (
                  <Card
                    key={order.id}
                    className="hover:shadow-lg transition bg-slate-900 border-slate-800 hover:border-slate-700"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl text-white">
                            Table {order.restaurant_tables?.table_number || "N/A"}
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            {new Date(order.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status || "UNPAID"}
                          </Badge>
                          {order.status.toLowerCase() === "in-progress" && order.preparation_started_at && (
                            <p className="text-xs text-blue-300">
                              Preparing for: <Timer startTime={order.preparation_started_at} />
                            </p>
                          )}
                          {order.status.toLowerCase() === "completed" &&
                            order.preparation_started_at &&
                            order.preparation_completed_at && (
                              <p className="text-xs text-emerald-300">
                                Prepared in:{" "}
                                {formatDuration(
                                  new Date(order.preparation_completed_at).getTime() -
                                    new Date(order.preparation_started_at).getTime(),
                                )}
                              </p>
                            )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6">
                        <h4 className="font-semibold text-white mb-2">Order Items ({order.order_items?.length})</h4>
                        <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-slate-300">
                              <div className="flex items-center gap-3 flex-1">
                                {item.menu_items?.image_url ? (
                                  <img
                                    src={item.menu_items.image_url || "/placeholder.svg"}
                                    alt={item.menu_items.name}
                                    className="w-10 h-10 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center">
                                    <Utensils className="w-5 h-5 text-slate-600" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium text-slate-200">
                                    {item.quantity}x {item.menu_items?.name || "Unknown Item"}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="capitalize bg-slate-800 text-slate-300 border-slate-700"
                              >
                                {item.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
                        {order.status.toLowerCase() === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "In-Progress")}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={isPending}
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              Start Preparing
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "Cancelled")}
                              className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-700"
                              disabled={isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {order.status.toLowerCase() === "in-progress" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "Completed")}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark Complete
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, "Cancelled")}
                              className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-700"
                              disabled={isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {order.status.toLowerCase() === "completed" && (
                          <div className="flex flex-col gap-2">
                            <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700 justify-center">
                              ✓ Completed
                            </Badge>
                            {order.payment_status !== "PAID" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(order.id, order.total_amount)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark as Paid (Cash)
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )

  const renderMenuView = () => (
    <div className="space-y-6">
      {menu.map(category => (
        <div key={category.id}>
          <h2 className="text-2xl font-bold text-white mb-4">{category.name}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.menu_items.map(item => (
              <Card key={item.id} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl text-white">{item.name}</CardTitle>
                    <Badge variant={item.available ? "default" : "destructive"}>
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    ${item.price}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 flex-1 mr-4">{item.description}</p>
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => toggleAvailability(item.id, item.available)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderStockAlertsView = () => (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Low Stock Items</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lowStockItems.length > 0 ? (
          lowStockItems.map((item: any) => (
            <Card key={item.id} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">{item.name}</CardTitle>
                <CardDescription className="text-slate-400">
                  In Stock: {item.quantity_in_stock} (Threshold: {item.low_stock_threshold})
                </CardDescription>
              </CardHeader>
            </Card>
          ))
        ) : (
          <p className="text-slate-400">No items are currently low in stock.</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 transition-transform duration-300 w-64 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white">{restaurantName}</h2>
          <p className="text-xs text-slate-400 mt-1">{staffInfo?.departments?.name} Dept.</p>
        </div>

        <nav className="space-y-2 px-4">
          <NavItem icon="📋" label="Orders" active={activeView === "orders"} onClick={() => setActiveView("orders")} />
          <NavItem icon="🍽️" label="Menu" active={activeView === "menu"} onClick={() => setActiveView("menu")} />
          {departmentName?.toLowerCase() === "bar" && (
            <NavItem
              icon="⚠️"
              label="Stock Alerts"
              active={activeView === "stock-alerts"}
              onClick={() => setActiveView("stock-alerts")}
            />
          )}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white capitalize">{activeView.replace("-", " ")}</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {staffInfo?.full_name} • {staffInfo?.departments?.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Today</p>
              <p className="text-lg font-semibold text-white">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeView === "orders" && renderOrdersView()}
          {activeView === "menu" && renderMenuView()}
          {activeView === "stock-alerts" && renderStockAlertsView()}
        </main>
      </div>
    </div>
  )
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

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-900/40 border-amber-700 text-amber-300",
    blue: "bg-blue-900/40 border-blue-700 text-blue-300",
    emerald: "bg-emerald-900/40 border-emerald-700 text-emerald-300",
    slate: "bg-slate-800/40 border-slate-700 text-slate-300",
  }

  return (
    <Card className={`border ${colorMap[color]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-3xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
        active ? "bg-blue-600/20 text-blue-300" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}
