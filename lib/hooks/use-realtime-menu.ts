"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface MenuItem {
  description: ReactNode
  id: string
  name: string
  price: number
  available: boolean
  image_url: string | null
  category_id: string
  ingredients: string[] | null
  preparation_time: number | null
}

export function useRealtimeMenu(restaurantId: string, options: { fetchUnavailable?: boolean } = {}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  let channel: RealtimeChannel | null = null

  const fetchMenu = async () => {
    setLoading(true) // Set loading to true when fetching starts
    try {
      let query = supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)

      if (!options.fetchUnavailable) {
        query = query.eq("available", true)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching menu:", error)
        setMenuItems([]) // Clear menu on error
        return
      }

      if (data) {
        setMenuItems(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!restaurantId) return

    fetchMenu() // Initial fetch

    // Subscribe to real-time changes
    channel = supabase
      .channel(`menu-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMenuItems((prev) => [...prev, payload.new as MenuItem])
          } else if (payload.eventType === "UPDATE") {
            setMenuItems((prev) => prev.map((item) => (item.id === payload.new.id ? (payload.new as MenuItem) : item)))
          } else if (payload.eventType === "DELETE") {
            setMenuItems((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      channel?.unsubscribe()
    }
  }, [restaurantId])

  return { menuItems, loading, refetch: fetchMenu }
}
