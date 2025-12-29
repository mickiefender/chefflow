"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  LogOut,
  Trash2,
  Power,
  AlertCircle,
  LayoutDashboard,
  LineChart,
  Users,
  FileText,
  HelpCircle,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { debounce } from "@/lib/utils"

interface Restaurant {
  id: string
  name: string
  email: string
  created_at: string
  is_active: boolean
}

interface RestaurantAnalytics {
  id: string
  name: string
  totalIncome: number
  totalOrders: number
}

interface NavItem {
  label: string
  icon: React.ReactNode
  href?: string
}

const AnalyticsChart = ({ data }: { data: RestaurantAnalytics[] }) => {
  if (data.length === 0) {
    return <p className="text-foreground/60">No restaurants selected.</p>
  }

  const chartData = data.map((item) => ({
    name: item.name,
    income: item.totalIncome,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
  }))

  const chartConfig = {
    income: {
      label: "Income",
    },
    ...data.reduce((acc, item) => {
      acc[item.name] = {
        label: item.name,
        color: chartData.find((d) => d.name === item.name)?.fill,
      }
      return acc
    }, {}),
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
        <YAxis />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="income" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const MetricCard = ({
  title,
  value,
  subtitle,
  chart,
  trend,
}: { title: string; value: string | number; subtitle?: string; chart?: React.ReactNode; trend?: string }) => (
  <Card className="border-0 shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-foreground/70">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-foreground/60">{subtitle}</p>}
        {trend && <p className="text-xs text-green-600">↑ {trend}</p>}
      </div>
      {chart && <div className="mt-4">{chart}</div>}
    </CardContent>
  </Card>
)

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [analytics, setAnalytics] = useState<RestaurantAnalytics[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [deleteRestaurantId, setDeleteRestaurantId] = useState<string | null>(null)
  const [disableRestaurantId, setDisableRestaurantId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Analytics", icon: <LineChart className="w-5 h-5" /> },
    { label: "Team Structure", icon: <Users className="w-5 h-5" /> },
    { label: "Reports", icon: <FileText className="w-5 h-5" /> },
    { label: "Support", icon: <HelpCircle className="w-5 h-5" /> },
  ]

  const fetchRestaurants = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.from("restaurants").select("*").eq("super_admin_id", userId)

      if (data) {
        setRestaurants(data)
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, setRestaurants, setLoading])

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/analytics")
      const data = await response.json()
      if (response.ok) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error(" Analytics error:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [setAnalytics, setAnalyticsLoading])

  useEffect(() => {
    const doCheckAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data } = await supabase.from("super_admins").select("id").eq("id", user.id).single()

      if (!data) {
        router.push("/auth/login")
        return
      }

      fetchRestaurants(user.id)
      fetchAnalytics()
    }

    doCheckAuth()

    const subscription = supabase
      .channel("custom-all-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        fetchAnalytics()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchAnalytics()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [supabase, router, fetchRestaurants, fetchAnalytics])

  const handleDeleteRestaurant = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/delete`, {
        method: "DELETE",
      })

      if (response.ok) {
        setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId))
        setAnalytics((prev) => prev.filter((a) => a.id !== restaurantId))
        setDeleteRestaurantId(null)
      }
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const handleToggleRestaurant = async (restaurantId: string, currentStatus: boolean) => {
    try {
      const endpoint = currentStatus ? "disable" : "enable"
      const response = await fetch(`/api/restaurants/${restaurantId}/${endpoint}`, {
        method: "POST",
      })

      if (response.ok) {
        setRestaurants((prev) => prev.map((r) => (r.id === restaurantId ? { ...r, is_active: !currentStatus } : r)))
        setDisableRestaurantId(null)
      }
    } catch (error) {
      console.error("Toggle error:", error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleRestaurantSelect = (restaurantId: string) => {
    setSelectedRestaurants((prev) =>
      prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId],
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const filteredAnalytics = analytics.filter((a) => selectedRestaurants.includes(a.id))
  const activeRestaurants = restaurants.filter((r) => r.is_active).length
  const disabledRestaurants = restaurants.filter((r) => !r.is_active).length

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-teal-900 text-white p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <img src="/images/logo/Brown_and_White_SImple_Modern_Professional_Catering_Logo-removebg-preview.png" alt="Foodops logo" className="w-6 h-6" />
            ChefFlow
          </h1>
        </div>

        <nav className="space-y-1 mb-12">
          <p className="text-xs uppercase text-teal-200 font-semibold mb-4">Navigation</p>
          {navItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                idx === 0 ? "bg-teal-700" : "hover:bg-teal-800"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </nav>

        {/* User Account */}
        <div className="border-t border-teal-700 pt-4 space-y-3">
          <p className="text-xs uppercase text-teal-200 font-semibold">User Account</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-full" />
            <div className="text-sm">
              <p className="font-medium">Admin User</p>
              <p className="text-teal-200 text-xs">super-admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-teal-200 hover:bg-teal-800 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <Link href="/super-admin/restaurants/new">
              <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add New Restaurant  
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard title="Total Restaurants" value={restaurants.length} subtitle="All registered restaurants" />
            <MetricCard
              title="Active Restaurants"
              value={activeRestaurants}
              subtitle="Currently operational"
              trend="↑ 23% from last month"
            />
            <MetricCard
              title="Restaurant Revenue"
              value={`GH₵${analytics.reduce((sum, a) => sum + a.totalIncome, 0).toLocaleString()}`}
              subtitle="Total income"
            />
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Chart */}
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Restaurant Performance</CardTitle>
                <CardDescription>Select restaurants to compare their income.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-6">
                  {analytics.map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={restaurant.id}
                        checked={selectedRestaurants.includes(restaurant.id)}
                        onCheckedChange={() => handleRestaurantSelect(restaurant.id)}
                      />
                      <label
                        htmlFor={restaurant.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {restaurant.name}
                      </label>
                    </div>
                  ))}
                </div>
                {analyticsLoading ? (
                  <p className="text-foreground/60">Loading...</p>
                ) : (
                  <AnalyticsChart data={filteredAnalytics} />
                )}
              </CardContent>
            </Card>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm bg-teal-50">
                <CardHeader>
                  <CardTitle className="text-lg">Status Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-3xl font-bold text-teal-900">{activeRestaurants}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Disabled</p>
                    <p className="text-3xl font-bold text-orange-600">{disabledRestaurants}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-700 to-teal-900 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/super-admin/restaurants/new" className="w-full">
                    <Button className="w-full bg-white text-teal-900 hover:bg-gray-100 font-semibold">
                      <Plus className="mr-2 h-4 w-4" />
                      Register Restaurant
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Restaurants List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Restaurants</h3>
            {restaurants.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-center text-foreground/70 py-8">
                    No restaurants registered yet. Create one to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {restaurants.map((restaurant) => (
                  <Card
                    key={restaurant.id}
                    className={`hover:shadow-lg transition-shadow border-0 ${!restaurant.is_active ? "opacity-60" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                            {!restaurant.is_active && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                Disabled
                              </span>
                            )}
                          </div>
                          <CardDescription>{restaurant.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        <Link href={`/restaurant/${restaurant.id}/dashboard`}>
                          <Button variant="outline" size="sm" disabled={!restaurant.is_active}>
                            View Dashboard
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => setDisableRestaurantId(restaurant.id)}>
                          <Power className="mr-2 h-4 w-4" />
                          {restaurant.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteRestaurantId(restaurant.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteRestaurantId !== null} onOpenChange={() => setDeleteRestaurantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Restaurant
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All restaurant data, staff, orders, and settings will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteRestaurantId && handleDeleteRestaurant(deleteRestaurantId)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable/Enable Confirmation Dialog */}
      <AlertDialog open={disableRestaurantId !== null} onOpenChange={() => setDisableRestaurantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {restaurants.find((r) => r.id === disableRestaurantId)?.is_active
                ? "Disable Restaurant"
                : "Enable Restaurant"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {restaurants.find((r) => r.id === disableRestaurantId)?.is_active
                ? "The restaurant will be disabled and staff will not be able to access it."
                : "The restaurant will be re-enabled and staff can access it again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              disableRestaurantId &&
              handleToggleRestaurant(
                disableRestaurantId,
                restaurants.find((r) => r.id === disableRestaurantId)?.is_active ?? true,
              )
            }
          >
            {restaurants.find((r) => r.id === disableRestaurantId)?.is_active ? "Disable" : "Enable"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
