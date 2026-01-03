"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Order {
  id: string
  created_at: string
  total_amount: string
  status: "pending" | "completed" | "cancelled" | "in-progress"
  payment_status: "PENDING" | "PAID" | "REFUNDED" | "FAILED"
  restaurant_tables: { table_number: string } | null
  order_items: {
    id: string
    quantity: number
    status: string
    menu_items: {
      name: string
      image_url: string | null
      menu_categories: {
        type: string
      } | null
    } | null
  }[]
  preparation_started_at?: string
  preparation_completed_at?: string
  notes?: string
  human_readable_id?: string
  payments?: any[] // Add payments property here
}

export function useRealtimeOrders(restaurantId: string, departmentName?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [refetchCounter, setRefetchCounter] = useState(0)
  const { toast } = useToast()

  const getDepartmentType = (name?: string): "food" | "drink" | "all" => {
    if (!name) return "all"
    if (name.toLowerCase() === "kitchen") return "food"
    if (name.toLowerCase() === "bar") return "drink"
    return "all"
  }

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)

    try {
      const selectStatement = `
        id, created_at, total_amount, status, payment_status, updated_at, updated_by_name, notes, human_readable_id,
        preparation_started_at, preparation_completed_at,
        restaurant_tables ( table_number ),
        order_items ( id, quantity, status, menu_items ( name, image_url, menu_categories ( type ) ) ),
        payments(*)
      `

      const { data, error } = await supabase
        .from("orders")
        .select(selectStatement)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching orders:", error)
        setOrders([])
        return
      }

      if (data) {
        let mappedOrders = data.map((order: any) => ({
          ...order,
          restaurant_tables: order.restaurant_tables
            ? Array.isArray(order.restaurant_tables)
              ? order.restaurant_tables[0]
              : order.restaurant_tables
            : null,
          order_items: Array.isArray(order.order_items)
            ? order.order_items.map((item: any) => ({
                ...item,
                menu_items: item.menu_items
                  ? Array.isArray(item.menu_items)
                    ? item.menu_items[0]
                    : item.menu_items
                  : null,
              }))
            : [],
        }))

        /*
        const departmentType = getDepartmentType(departmentName)
        if (departmentType === "food" || departmentType === "drink") {
          mappedOrders = mappedOrders
            .map(order => ({
              ...order,
              order_items: order.order_items.filter(
                item => item.menu_items?.menu_categories?.type === departmentType,
              ),
            }))
            .filter(order => order.order_items.length > 0)
        }
        */

        setOrders(mappedOrders)
      }
    } finally {
      setLoading(false)
    }
  }, [restaurantId, departmentName, supabase, refetchCounter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    if (!restaurantId) return

    const channelName = `orders-${restaurantId}`
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          // Trigger a refetch to update the UI
          setRefetchCounter((prev) => prev + 1)

          const newOrder = payload.new as Order
          const oldOrder = payload.old as Order

          if (payload.eventType === "INSERT") {
            const tableNumber = newOrder.restaurant_tables?.table_number || "N/A"
            toast({
              title: "🚀 New Order Received!",
              description: `Order #${newOrder.human_readable_id} just placed from Table ${tableNumber}.`,
              variant: "default",
            })
          } else if (payload.eventType === "UPDATE") {
            // Check if status or payment_status has changed
            if (oldOrder?.status !== newOrder.status) {
              const tableNumber = newOrder.restaurant_tables?.table_number || "N/A"
              toast({
                title: "🔔 Order Status Updated",
                description: `Order #${newOrder.human_readable_id} from Table ${tableNumber} is now ${newOrder.status}.`,
                variant: "secondary",
              })
            } else if (oldOrder?.payment_status !== newOrder.payment_status) {
              const tableNumber = newOrder.restaurant_tables?.table_number || "N/A"
              toast({
                title: "💰 Order Payment Updated",
                description: `Order #${newOrder.human_readable_id} from Table ${tableNumber} is now ${newOrder.payment_status}.`,
                variant: "secondary",
              })
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, supabase])

  return { orders, loading, refetch: () => setRefetchCounter(prev => prev + 1) }
}