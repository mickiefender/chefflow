"use client"

import { useEffect, useState, useRef, useTransition } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  LogOut,
  Settings,
  Users,
  ShoppingCart,
  UtensilsCrossed,
  BarChart3,
  Package,
  Home,
  QrCode,
  Menu, // Added Menu icon
  X,    // Added X icon
} from "lucide-react"

export default function RestaurantLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [staticData, setStaticData] = useState<{
    staffCount: number
    departmentCount: number
    menuItemCount: number
    sampleMenuItems: any[]
    restaurantName: string
    restaurantLogo?: string
  } | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const supabase = createClient()

  useEffect(() => {
    fetchInitialStaticData()
  }, [restaurantId])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }
  }

  const fetchInitialStaticData = async () => {
    await checkAuth()
    try {
      const { data: staff } = await supabase.from("staff_members").select("id").eq("restaurant_id", restaurantId)

      const { data: departments } = await supabase.from("departments").select("id").eq("restaurant_id", restaurantId)

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading restaurant data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside
        className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col fixed inset-y-0 z-50 w-64 ${sidebarCollapsed ? 'left-[-16rem]' : 'left-0'} md:left-0 ${!sidebarCollapsed ? 'md:w-64' : 'md:w-20'}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between"> {/* Modified to justify-between */}
          <div className="flex items-center gap-3">
            {staticData?.restaurantLogo ? (
              <img
                src={staticData.restaurantLogo || "/placeholder.svg"}
                alt={`${staticData.restaurantName} Logo`}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
            )}
            {!sidebarCollapsed && ( // Conditionally render name/admin text for mobile
              <div>
                <h2 className="text-sm font-bold text-white">{staticData?.restaurantName}</h2>
                <p className="text-xs text-slate-400">Admin</p>
              </div>
            )}
          </div>
          {/* Close button for mobile inside sidebar, only visible when sidebar is open */}
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(true)}
              className="md:hidden text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href={`/restaurant/${restaurantId}/dashboard`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname === `/restaurant/${restaurantId}/dashboard`
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } transition`}
          >
            <Home className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
          </Link>
          <Link
            href={`/restaurant/${restaurantId}/menu`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname.startsWith(`/restaurant/${restaurantId}/menu`)
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } transition`}
          >
            <Package className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Products</span>}
          </Link>
          <Link
            href={`/restaurant/${restaurantId}/orders`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname.startsWith(`/restaurant/${restaurantId}/orders`)
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } transition`}
          >
            <ShoppingCart className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Orders</span>}
          </Link>
          <Link
            href={`/restaurant/${restaurantId}/analytics`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname === `/restaurant/${restaurantId}/analytics`
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } transition`}
          >
            <BarChart3 className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Analytics</span>}
          </Link>
          <Link
            href={`/restaurant/${restaurantId}/staff`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname === `/restaurant/${restaurantId}/staff`
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } transition`}
          >
            <Users className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Staff</span>}
          </Link>
          <Link
            href={`/restaurant/${restaurantId}/qr-codes`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname === `/restaurant/${restaurantId}/qr-codes`
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } transition`}
          >
            <QrCode className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">QR Codes</span>}
          </Link>
          <Link
            href={`/restaurant/${restaurantId}/settings`}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname === `/restaurant/${restaurantId}/settings`
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            } transition`}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {!sidebarCollapsed && (
          <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarCollapsed(true)}
          ></div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${!sidebarCollapsed ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Toggle Button for Mobile */}
        <div className="md:hidden p-4 bg-slate-900 border-b border-slate-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-white"
          >
            {sidebarCollapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
          </Button>
        </div>
        {children}
      </main>
      </div>
  )
}