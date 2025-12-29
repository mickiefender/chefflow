"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRealtimeStaff } from "@/lib/hooks/use-realtime-staff"
import { Plus, ArrowLeft, Trash2, Upload } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface StaffMember {
  id: string
  full_name: string
  email: string
  position: string
  department_id: string
}

export default function StaffManagementPage() {
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const supabase = createClient()

  const { staff, loading } = useRealtimeStaff(restaurantId)

  const [showAddForm, setShowAddForm] = useState(false)
  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    position: "",
    department_id: "",
    password: "",
  })
  const [departments, setDepartments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await supabase
          .from("departments")
          .select("*")
          .eq("restaurant_id", restaurantId)

        if (data) {
          setDepartments(data)
        }
      } catch (err) {
        console.error("[v0] Error fetching departments:", err)
      }
    }

    if (restaurantId) {
      fetchDepartments()
    }
  }, [restaurantId])

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!staffForm.department_id) {
      alert("Please select a department")
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: staffForm.email,
        password: staffForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        alert(`Error creating account: ${authError.message}`)
        return
      }

      if (!authData.user) {
        alert("Failed to create staff account")
        return
      }

      const { error: staffError } = await supabase.from("staff_members").insert({
        id: authData.user.id,
        restaurant_id: restaurantId,
        department_id: staffForm.department_id,
        email: staffForm.email,
        full_name: staffForm.full_name,
        position: staffForm.position,
      })

      if (staffError) {
        alert(`Error creating staff record: ${staffError.message}`)
        return
      }

      await supabase.from("activity_logs").insert({
        restaurant_id: restaurantId,
        action: "STAFF_CREATED",
        details: {
          staff_name: staffForm.full_name,
          position: staffForm.position,
          department_id: staffForm.department_id,
        },
      })

      setStaffForm({
        full_name: "",
        email: "",
        position: "",
        department_id: "",
        password: "",
      })
      setShowAddForm(false)
    } catch (err) {
      alert("An error occurred while adding staff")
    }
  }

  const deleteStaff = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      await supabase.from("staff_members").delete().eq("id", id)
      await supabase.from("activity_logs").insert({
        restaurant_id: restaurantId,
        action: "STAFF_DELETED",
        details: { staff_id: id },
      })
    }
  }

  const handlePhotoUpload = async (staffId: string, file: File) => {
    setUploading(true)
    try {
      const fileName = `${restaurantId}/${staffId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from("staff-photos").upload(fileName, file)

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("staff-photos").getPublicUrl(fileName)

        // Store photo URL in staff record via activity log
        await supabase.from("activity_logs").insert({
          restaurant_id: restaurantId,
          staff_id: staffId,
          action: "PHOTO_UPDATED",
          details: { photo_url: publicUrl },
        })
      }
    } catch (err) {
      console.error("[v0] Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href={`/restaurant/${restaurantId}/dashboard`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Staff Management</h1>
            <p className="text-slate-400 mt-2">Manage your restaurant staff and their credentials</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-8 bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Add New Staff Member</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-400">
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="John Doe"
                      className="bg-slate-800 border-slate-700 text-white"
                      value={staffForm.full_name}
                      onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="bg-slate-800 border-slate-700 text-white"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      placeholder="e.g., Chef, Waiter"
                      className="bg-slate-800 border-slate-700 text-white"
                      value={staffForm.position}
                      onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      value={staffForm.department_id}
                      onChange={(e) => setStaffForm({ ...staffForm, department_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-slate-800 border-slate-700 text-white"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Add Staff
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {staff.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <p className="text-center text-slate-400 py-8">No staff members yet. Add one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {staff.map((member) => (
                <Card key={member.id} className="bg-slate-900 border-slate-800 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Label
                          htmlFor={`photo-${member.id}`}
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                        >
                          <Upload className="h-4 w-4 text-slate-400" />
                          <Input
                            id={`photo-${member.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handlePhotoUpload(member.id, e.target.files[0])
                              }
                            }}
                            disabled={uploading}
                          />
                        </Label>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-white">{member.full_name}</h3>
                        <p className="text-sm text-slate-400">{member.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="border-slate-700 text-slate-400">{member.position}</Badge>
                          <Badge className="bg-purple-500/20 text-purple-400 border-0">Staff</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteStaff(member.id)} className="bg-red-600 hover:bg-red-700 text-white">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
