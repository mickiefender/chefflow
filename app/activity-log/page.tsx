"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { LogOut, Clock } from "lucide-react"

interface ActivityLog {
  id: string
  action: string
  details: any
  created_at: string
  staff_id: string
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchActivities(user.id)
  }

  const fetchActivities = async (userId: string) => {
    try {
      // Get user's restaurants
      const { data: admin } = await supabase.from("restaurant_admins").select("restaurant_id").eq("id", userId)

      if (admin && admin.length > 0) {
        const { data: logs } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("restaurant_id", admin[0].restaurant_id)
          .order("created_at", { ascending: false })
          .limit(100)

        if (logs) {
          setActivities(logs)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Activity Log</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Track all system actions and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center text-foreground/70 py-8">No activities yet</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-secondary transition"
                  >
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold capitalize">{activity.action.replace(/_/g, " ")}</p>
                        <p className="text-sm text-foreground/70">{new Date(activity.created_at).toLocaleString()}</p>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-foreground/70 mt-1">{JSON.stringify(activity.details)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
