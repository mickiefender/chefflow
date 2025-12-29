"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface StaticData {
  staffCount: number
  departmentCount: number
  menuItemCount: number
  sampleMenuItems: any[]
  restaurantName: string
  restaurantLogo?: string
}

export function useRestaurantData(restaurantId: string) {
  const [staticData, setStaticData] = useState<StaticData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
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

    if (restaurantId) {
      fetchInitialStaticData()
    }
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

  return { staticData, initialLoading, checkAuth }
}