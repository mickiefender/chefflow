"use client"

import { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { User, PlusCircle, Users, LogOut } from "lucide-react"

interface Staff {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "" })
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      const { data: admin, error: adminError } = await supabase
        .from("restaurant_admins")
        .select("restaurant_id")
        .eq("id", user.id)
        .single()

      if (adminError || !admin) {
        console.error("Error fetching admin data:", adminError)
        setError("Could not find your restaurant information.")
        setLoading(false)
        return
      }

      setRestaurantId(admin.restaurant_id)
      fetchStaff(admin.restaurant_id)
    } catch (e) {
      console.error(e)
      setError("An unexpected error occurred.")
      setLoading(false)
    }
  }

  const fetchStaff = async (currentRestaurantId: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("restaurant_id", currentRestaurantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching staff:", error)
      setError("Failed to load staff members.")
    } else {
      setStaffList(data)
    }
    setLoading(false)
  }

  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault()
    if (!newStaff.name || !newStaff.email || !newStaff.role || !restaurantId) {
      alert("Please fill all fields.")
      return
    }

    const { data, error } = await supabase
      .from("staff")
      .insert([{ ...newStaff, restaurant_id: restaurantId }])
      .select()

    if (error) {
      console.error("Error adding staff:", error)
      alert("Failed to add staff member.")
    } else if (data) {
      setStaffList([data[0], ...staffList])
      setIsDialogOpen(false)
      setNewStaff({ name: "", email: "", role: "" })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Staff Management</h1>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>Manage your restaurant's staff.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                  <DialogDescription>Enter the details for the new staff member.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddStaff}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">Email</Label>
                      <Input id="email" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">Role</Label>
                      <Input id="role" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} className="col-span-3" placeholder="e.g., Manager, Chef, Waiter" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Staff</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffList.length === 0 ? (
                <p className="text-center text-foreground/70 py-8">No staff members found. Add one to get started!</p>
              ) : (
                staffList.map((staff) => (
                  <div key={staff.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{staff.name}</p>
                      <p className="text-sm text-foreground/70">{staff.email}</p>
                    </div>
                    <div className="text-sm text-foreground/80 bg-secondary px-3 py-1 rounded-full capitalize">{staff.role}</div>
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