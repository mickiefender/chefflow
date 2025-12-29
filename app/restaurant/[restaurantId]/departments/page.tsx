"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

type Department = {
  id: number
  name: string
  description: string | null
}

export default function ManageDepartmentsPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string

  // It's good practice to ensure the ID exists before allowing actions.
  useEffect(() => {
    if (!restaurantId) {
      // Optionally, redirect or show an error if the ID is missing.
      console.error("Restaurant ID is missing from the URL.")
      // router.push('/some-error-page');
    }
  }, [restaurantId, router])

  const [departments, setDepartments] = useState<Department[]>([])
  const [newDepartmentName, setNewDepartmentName] = useState("")
  const [newDepartmentDescription, setNewDepartmentDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, description")
        .eq("restaurant_id", restaurantId)

      if (error) {
        setError(error.message)
      } else {
        setDepartments(data)
      }
      setLoading(false)
    }

    if (restaurantId) {
      fetchDepartments()
    }
  }, [restaurantId, supabase])

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from("departments")
      .insert({
        restaurant_id: restaurantId,
        name: newDepartmentName,
        description: newDepartmentDescription,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else if (data) {
      setDepartments([...departments, data])
      setNewDepartmentName("")
      setNewDepartmentDescription("")
    }
    setFormLoading(false)
  }

  const handleAddDefaultDepartments = async () => {
    setFormLoading(true)
    setError(null)
    const defaultDepartments = ["Kitchen", "Bar", "Finance", "Waiter"]
    const newDepartments = defaultDepartments.map((dept) => ({
      restaurant_id: restaurantId,
      name: dept,
      description: `${dept} department`,
    }))

    const { data, error } = await supabase.from("departments").insert(newDepartments).select()

    if (error) {
      setError(error.message)
    } else if (data) {
      setDepartments([...departments, ...data])
    }
    setFormLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Manage Departments</CardTitle>
          <CardDescription>Add, view, or remove departments for your restaurant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Existing Departments</h3>
            {departments.length > 0 ? (
              <ul className="space-y-2">
                {departments.map((dept) => (
                  <li key={dept.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-semibold">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    </div>
                    {/* Optional: Add a delete button if needed */}
                    {/* <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button> */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No departments found.</p>
            )}
          </div>

          <div className="space-y-4">
            <Button onClick={handleAddDefaultDepartments} disabled={formLoading}>
              {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Default Departments
            </Button>
          </div>

          <form onSubmit={handleAddDepartment} className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">Add New Department</h3>
            <div className="space-y-2">
              <Label htmlFor="departmentName">Department Name</Label>
              <Input id="departmentName" value={newDepartmentName} onChange={(e) => setNewDepartmentName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departmentDescription">Description</Label>
              <Textarea id="departmentDescription" value={newDepartmentDescription} onChange={(e) => setNewDepartmentDescription(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={formLoading}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Department
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}