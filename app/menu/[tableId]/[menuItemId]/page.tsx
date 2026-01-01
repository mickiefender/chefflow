"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, Flame } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { parseAndFormatIngredients } from "@/lib/utils"
import { useCart } from "@/app/menu/[tableId]/use-cart"
import type { MenuItem } from "@/app/menu/types"

export default function MenuItemPage() {
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const { menuItemId, tableId } = params
  const { addToCart } = useCart()

  useEffect(() => {
    if (menuItemId) {
      fetch(`/api/menu/${menuItemId}`)
        .then((res) => res.json())
        .then((data) => {
          setMenuItem(data)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [menuItemId])

  const handleAddToCart = () => {
    if (menuItem) {
      addToCart(menuItem)
      router.push(`/menu/${tableId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-muted rounded-full border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Item not found</h1>
          <p className="text-muted-foreground mb-6">The menu item you're looking for doesn't exist.</p>
          <Button onClick={() => router.push(`/menu/${tableId}`)} variant="default">
            Back to Menu
          </Button>
        </div>
      </div>
    )
  }

  const parsedIngredients = parseAndFormatIngredients(menuItem.ingredients)

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="hover:bg-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Image Section */}
        <div className="mb-8 sm:mb-12">
          <div className="relative h-96 sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-muted">
            {menuItem.image_url ? (
              <Image
                src={menuItem.image_url || "/placeholder.svg"}
                alt={menuItem.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                <div className="text-center">
                  <Flame className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No image available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          {/* Title and Price */}
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2 leading-tight">{menuItem.name}</h1>
              <p className="text-lg text-muted-foreground">{menuItem.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Price</p>
                <p className="text-5xl font-bold text-primary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "GHS",
                  }).format(menuItem.price)}
                </p>
              </div>

              {/* Availability Badge */}
              <div className="flex-shrink-0">
                {menuItem.available ? (
                  <Badge className="bg-green-100 text-green-800 px-4 py-2 text-base hover:bg-green-100">
                    ✓ Available
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 px-4 py-2 text-base hover:bg-red-100">Out of Stock</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Preparation Time */}
          {menuItem.preparation_time && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Preparation Time</h3>
              </div>
              <p className="text-base text-muted-foreground ml-8">Approximately {menuItem.preparation_time} minutes</p>
            </div>
          )}

          {/* Ingredients */}
          {parsedIngredients.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Ingredients</h3>
              <div className="flex flex-wrap gap-3">
                {parsedIngredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="outline"
                    className="px-4 py-2 text-sm border-border bg-secondary/50 text-foreground hover:bg-secondary"
                  >
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-8" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleAddToCart}
              disabled={!menuItem.available}
              size="lg"
              className="flex-1 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              Add to Order
            </Button>
            <Button
              onClick={() => router.push(`/menu/${tableId}`)}
              size="lg"
              variant="outline"
              className="flex-1 text-base"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
