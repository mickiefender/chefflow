"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useOrders(restaurantId: string) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchOrders()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [restaurantId])

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })

      if (data) {
        setOrders(data)
      }
    } finally {
      setLoading(false)
    }
  }

  return { orders, loading, refetch: fetchOrders }
}
