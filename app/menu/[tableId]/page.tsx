"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client" // Corrected import path
import { useRealtimeMenu } from "@/lib/hooks/use-realtime-menu"
import { LogOut, Minus, Plus, Search, Send, ShoppingCart, Utensils } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCart } from "./use-cart"
import { Category, MenuItem } from "./types"

export default function MenuPage() {
  const router = useRouter()
  const params = useParams()
  const tableId = params.tableId as string
  const supabase = createClient()
  const { cartItems, addToCart, removeFromCart, clearCart, cartCount, cartTotal, tax, finalTotal } = useCart()
  const [activeCategory, setActiveCategory] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState("")
  const [customerEmail, setCustomerEmail] = useState("") // For Paystack

  const { menuItems, loading: menuLoading } = useRealtimeMenu(restaurantId)

  const [initialized, setInitialized] = useState(false)

  // Default images for categories if not provided in the database
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
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          total_amount: finalTotal,
          status: "Pending",
          customer_email: customerEmail,
        })
        .select("id")
        .single()

      if (orderError) throw orderError

      const newOrderId = orderData.id

      const orderItemsToInsert = cartItems.map((item) => ({
        order_id: newOrderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsToInsert)

      if (itemsError) throw itemsError

      return newOrderId
    } catch (error) {
      console.error("Error creating order:", JSON.stringify(error, null, 2))
      alert("There was an issue placing your order. Please try again.")
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
          body: JSON.stringify({ order_id: orderId }),
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
        typeof item.description === "string" && item.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Loading menu...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header with Restaurant Info */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurantLogo ? (
                <img
                  src={restaurantLogo}
                  alt={`${restaurantName} Logo`}
                  className="h-15 w-auto object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
                <p className="text-sm text-gray-600">Table {tableNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 px-4 py-2 rounded-full flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-600">{cartCount} items</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Menu Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    (() => {
                      const imageUrl = category.image_url || defaultCategoryImages[category.name.toLowerCase()]
                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                            activeCategory === category.id
                              ? "bg-green-600 text-white shadow-md"
                              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            {imageUrl ? (
                              <img src={imageUrl} alt={category.name} className="w-8 h-8 rounded-md object-cover" />
                            ) : (
                              <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md text-lg">
                                {category.icon || "🍽️"}
                              </span>
                            )}
                            {category.name}
                          </span>
                        </button>
                      )
                    })()
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center - Menu Items */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-base"
                />
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full">
                  <Card className="bg-white border-dashed">
                    <CardContent className="pt-12 text-center py-12 text-gray-500">
                      <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No items available</p>
                      <p className="text-sm text-gray-400">Try a different category</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition cursor-pointer border-gray-200 hover:border-green-300"
                  >
                    {/* Item Image */}
                    <div className="w-full h-40 bg-gray-200 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Utensils className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-9">{item.description}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">GH₵{item.price.toFixed(2)}</span>
                        <Button
                          size="sm"
                          disabled={!item.available}
                          onClick={() => addToCart(item)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      {!item.available && (
                        <Badge className="mt-2 w-full justify-center bg-red-100 text-red-800">Out of Stock</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Your Order
              </h3>

              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm">Cart is empty</p>
                  <p className="text-gray-400 text-xs mt-1">Add items to get started!</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pb-4 border-b border-gray-200">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            GH₵{item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-7 w-7 p-0 hover:bg-red-100"
                          >
                            <Minus className="w-3 h-3 text-red-600" />
                          </Button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const menuItem = menuItems.find((m) => m.id === item.id)
                              if (menuItem) addToCart(menuItem)
                            }}
                            className="h-7 w-7 p-0 hover:bg-green-100"
                          >
                            <Plus className="w-3 h-3 text-green-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-medium">GH₵{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Tax (10%)</span>
                      <span className="font-medium">GH₵{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold bg-green-50 p-3 rounded border border-green-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-green-600">GH₵{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Customer Email Input */}
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Email (for receipt)
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="text-base"
                    />
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-3 mt-4">
                    <Button
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white text-base font-bold py-6"
                      onClick={handlePayWithCash}
                      disabled={submittingOrder || !customerEmail || cartItems.length === 0}
                    >
                      {submittingOrder ? "Placing Order..." : "Pay with Cash"}
                    </Button>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-bold py-6"
                      onClick={handlePayOnline}
                      disabled={submittingOrder || !customerEmail || cartItems.length === 0}
                    >
                      {submittingOrder ? "Processing..." : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
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
