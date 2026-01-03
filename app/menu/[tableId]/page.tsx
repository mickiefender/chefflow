"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRealtimeMenu } from "@/lib/hooks/use-realtime-menu"
import { LogOut, Minus, Plus, PackageSearch, Search, Send, ShoppingCart, Utensils } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "./use-cart"
import type { Category } from "./types"

export default function MenuPage() {
  const router = useRouter()
  const params = useParams()
  const tableId = params.tableId as string
  const supabase = createClient()
  const { cartItems, addToCart, removeFromCart, clearCart, cartCount, cartTotal } = useCart()
  const [activeCategory, setActiveCategory] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [orderNotes, setOrderNotes] = useState("")

  const { menuItems, loading: menuLoading } = useRealtimeMenu(restaurantId)

  const [initialized, setInitialized] = useState(false)

  const defaultCategoryImages: { [key: string]: string } = {
    starters: "/images/category_images/Starter.jpg",
    "main course": "/images/category_images/Main_course.jpg",
    desserts: "/images/category_images/Dessert.jpg",
    drinks: "/images/category_images/Drinks.jpg",
    appetizers: "/images/categories/appetizers.jpg",
  }

  const fetchInitialData = async () => {
    try {
      const { data: table } = await supabase
        .from("restaurant_tables")
        .select("restaurant_id, table_number")
        .eq("id", tableId)
        .single()

      if (!table) {
        router.push("/")
        return
      }

      setRestaurantId(table.restaurant_id)
      setTableNumber(table.table_number)

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name, logo_url")
        .eq("id", table.restaurant_id)
        .single()

      if (restaurant) {
        setRestaurantName(restaurant.name)
        setRestaurantLogo(restaurant.logo_url)
      }

      const { data: categoryData } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", table.restaurant_id)
        .order("sort_order")

      if (categoryData) {
        setCategories(categoryData)
        if (categoryData.length > 0) {
          setActiveCategory(categoryData[0].id)
        }
      }

      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialized) {
      fetchInitialData()
    }
  }, [initialized])

  const createOrder = async () => {
    if (!customerEmail) {
      alert("Please enter your email address to proceed.")
      return null
    }

    setSubmittingOrder(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          tableId,
          items: cartItems.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          customerEmail,
          notes: orderNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create order via API")
      }

      const orderData = await response.json()
      return orderData.id
    } catch (error) {
      console.error("Error creating order:", error)
      alert(
        `There was an issue placing your order: ${error instanceof Error ? error.message : String(error)}. Please try again.`,
      )
      return null
    } finally {
      setSubmittingOrder(false)
    }
  }

  const handlePayWithCash = async () => {
    const orderId = await createOrder()
    if (orderId) {
      alert("Your order has been placed successfully! Please pay at the counter.")
      clearCart()
      setCustomerEmail("")
    }
  }

  const handlePayOnline = async () => {
    const orderId = await createOrder()
    if (orderId) {
      try {
        setSubmittingOrder(true)
        const response = await fetch("/api/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, table_id: tableId }),
        })

        if (!response.ok) {
          const responseText = await response.text()
          let errorDetails = ""
          try {
            const errorJson = JSON.parse(responseText)
            errorDetails = errorJson.details || JSON.stringify(errorJson)
          } catch (e) {
            errorDetails = responseText
          }
          throw new Error("Failed to initialize payment", { cause: errorDetails })
        }

        const result = await response.json()
        router.push(result.authorization_url)
      } catch (error) {
        console.error("Payment initialization error:", error)
        let errorMessage = "Could not initiate online payment. Please try again or pay with cash."
        if (error instanceof Error) {
          errorMessage = `${error.message}${error.cause ? `\n\nDetails: ${error.cause}` : ""}`
        }
        alert(errorMessage)
      } finally {
        setSubmittingOrder(false)
      }
    }
  }

  const filteredItems = menuItems.filter(
    (item) =>
      item.category_id === activeCategory &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof item.description === "string" && item.description.toLowerCase().includes(searchTerm.toLowerCase()))),
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Loading menu...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header with Restaurant Info */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Logo and Restaurant Info */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              {restaurantLogo ? (
                <img
                  src={restaurantLogo || "/placeholder.svg"}
                  alt={`${restaurantName} Logo`}
                  className="h-15 sm:h-18 w-auto object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{restaurantName}</h1>
                <p className="text-xs sm:text-sm text-gray-600">Table {tableNumber}</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
              <Link href="/track-order" passHref className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm bg-transparent">
                  <PackageSearch className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Track Order</span>
                  <span className="sm:hidden">Track</span>
                </Button>
              </Link>

              {/* Cart Badge */}
              <button
                onClick={() => router.push("/cart")}
                className="bg-green-100 px-2 sm:px-4 py-2 rounded-full flex items-center gap-2 hover:bg-green-200 transition flex-1 sm:flex-none"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="font-semibold text-green-600 text-sm sm:text-base">{cartCount}</span>
              </button>

              <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="px-2 sm:px-3">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Left Sidebar - Categories */}
          <div className="md:col-span-1">
            <div className="md:sticky md:top-32 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 hidden md:block">
                Menu Categories
              </h3>

              {/* Categories Grid for Mobile, Stack for Desktop */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:space-y-2">
                {categories.map((category) =>
                  (() => {
                    const imageUrl = category.image_url || defaultCategoryImages[category.name.toLowerCase()]
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveCategory(category.id)
                        }}
                        className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg font-medium transition text-sm md:text-base ${
                          activeCategory === category.id
                            ? "bg-green-600 text-white shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <span className="flex items-center gap-2 md:gap-3 justify-center md:justify-start">
                          {imageUrl ? (
                            <img
                              src={imageUrl || "/placeholder.svg"}
                              alt={category.name}
                              className="w-6 h-6 md:w-8 md:h-8 rounded-md object-cover"
                            />
                          ) : (
                            <span className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-gray-100 rounded-md text-xs md:text-lg">
                              {category.icon || "🍽️"}
                            </span>
                          )}
                          <span className="hidden md:inline">{category.name}</span>
                          <span className="md:hidden text-xs">{category.name.substring(0, 8)}</span>
                        </span>
                      </button>
                    )
                  })(),
                )}
              </div>
            </div>
          </div>

          {/* Center - Menu Items */}
          <div className="md:col-span-3 lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-2 sm:py-3 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full">
                  <Card className="bg-white border-dashed">
                    <CardContent className="pt-8 sm:pt-12 text-center py-8 sm:py-12 text-gray-500">
                      <Utensils className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                      <p className="text-base sm:text-lg font-medium">No items available</p>
                      <p className="text-xs sm:text-sm text-gray-400">Try a different category</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu/${tableId}/${item.id}`}
                    className="overflow-hidden hover:shadow-lg transition cursor-pointer border-gray-200 hover:border-green-300 flex flex-col"
                  >
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition cursor-pointer border-gray-200 hover:border-green-300 flex flex-col"
                  >
                    {/* Item Image */}
                    <div className="w-full h-48 sm:h-56 bg-gray-200 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Utensils className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-sm sm:text-base">{item.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 h-8 sm:h-9">
                        {item.description}
                      </p>

                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl sm:text-2xl font-bold text-green-600">
                            GH₵{item.price.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            disabled={!item.available}
                            onClick={(e) => {
                              e.preventDefault()
                              addToCart(item)
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Add
                          </Button>
                        </div>

                        {!item.available && (
                          <Badge className="w-full justify-center bg-red-100 text-red-800 text-xs">Out of Stock</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar - Order Summary */}
          <div className="lg:col-span-1 md:col-span-4 lg:col-span-1">
            {/* Mobile Cart Toggle */}
            <div className="lg:hidden mb-4"></div>

            {/* Order Summary Card */}
            <div className="lg:sticky lg:top-32 bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-lg">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Your Order
              </h3>

              {cartItems.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2 sm:mb-3" />
                  <p className="text-gray-600 text-sm">Cart is empty</p>
                  <p className="text-gray-400 text-xs mt-1">Add items to get started!</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto mb-4 pb-4 border-b border-gray-200">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg text-sm sm:text-base"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            GH₵{item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-red-100"
                          >
                            <Minus className="w-3 h-3 text-red-600" />
                          </Button>
                          <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const menuItem = menuItems.find((m) => m.id === item.id)
                              if (menuItem) addToCart(menuItem)
                            }}
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-100"
                          >
                            <Plus className="w-3 h-3 text-green-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-medium">GH₵{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                      <span>Tax (0%)</span>
                      <span className="font-medium">GH₵0.00</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-lg font-bold bg-green-50 p-2 sm:p-3 rounded border border-green-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-green-600">GH₵{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Customer Email Input */}
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Your Email (for receipt)
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="text-xs sm:text-base py-2 sm:py-3"
                    />
                  </div>

                  {/* Order Notes Input */}
                  <div className="mb-4">
                    <label htmlFor="order-notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Notes for your order (e.g., "more pepper", "no onions")
                    </label>
                    <Textarea
                      id="order-notes"
                      placeholder="Add any special requests or notes here..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="text-xs sm:text-base py-2 sm:py-3 min-h-[80px]"
                    />
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-2 sm:space-y-3 mt-4">
                    <Button
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm sm:text-base font-bold py-4 sm:py-6"
                      onClick={handlePayWithCash}
                      disabled={submittingOrder || !customerEmail || cartItems.length === 0}
                    >
                      {submittingOrder ? "Placing Order..." : "Pay with Cash"}
                    </Button>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-bold py-4 sm:py-6"
                      onClick={handlePayOnline}
                      disabled={submittingOrder || !customerEmail || cartItems.length === 0}
                    >
                      {submittingOrder ? (
                        "Processing..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 h-4 sm:h-5 sm:w-5" />
                          Pay Now
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
