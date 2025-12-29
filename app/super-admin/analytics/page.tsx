"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface RestaurantAnalytics {
  id: string
  name: string
  totalIncome: number
  totalOrders: number
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
        <YAxis tickFormatter={(value) => `GH₵${value.toLocaleString()}`} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" formatter={(value) => `GH₵${value.toLocaleString()}`} />}
        />
        <Bar dataKey="income" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

export default function SuperAdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<RestaurantAnalytics[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()

    const subscription = supabase
      .channel("custom-all-channel-analytics")
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
  }, [])

  useEffect(() => {
    if (analytics.length > 0) {
      const best = analytics.reduce((prev, current) => (prev.totalIncome > current.totalIncome ? prev : current))
      const worst = analytics.reduce((prev, current) => (prev.totalIncome < current.totalIncome ? prev : current))
      if (best && worst) {
        setSelectedRestaurants([best.id, worst.id])
      }
    }
  }, [analytics])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      const data = await response.json()
      if (response.ok) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error("[v0] Analytics error:", error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handleRestaurantSelect = (restaurantId: string) => {
    setSelectedRestaurants((prev) =>
      prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId],
    )
  }

  const filteredAnalytics = analytics.filter((a) => selectedRestaurants.includes(a.id))

  return (
    <div className="p-8">
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
    </div>
  )
}
