"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface StaffMember {
  id: string
  email: string
  full_name: string
  position: string
  department_id: string
}

export function useRealtimeStaff(restaurantId: string) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  let channel: RealtimeChannel | null = null

  useEffect(() => {
    if (!restaurantId) return

    const fetchStaff = async () => {
      try {
        const { data } = await supabase.from("staff_members").select("*").eq("restaurant_id", restaurantId)

        if (data) {
          setStaff(data)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()

    // Subscribe to real-time changes
    channel = supabase
      .channel(`staff-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_members",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setStaff((prev) => [...prev, payload.new as StaffMember])
          } else if (payload.eventType === "UPDATE") {
            setStaff((prev) =>
              prev.map((member) => (member.id === payload.new.id ? (payload.new as StaffMember) : member)),
            )
          } else if (payload.eventType === "DELETE") {
            setStaff((prev) => prev.filter((member) => member.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      channel?.unsubscribe()
    }
  }, [restaurantId])

  return { staff, loading }
}
