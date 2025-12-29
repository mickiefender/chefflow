"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function StaffLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      // Check user role and redirect accordingly
      const user = await supabase.auth.getUser()
      if (user.data.user) {
        const userId = user.data.user.id

        // Check if staff
        const { data: staff } = await supabase
          .from("staff_members")
          .select("restaurant_id, department_id")
          .eq("id", userId)
          .single()

        if (staff) {
          router.push(`/staff/${staff.restaurant_id}/${staff.department_id}/dashboard`)
          return
        }

        // If user is not staff, sign them out and show an error
        setError("Your account is not a staff account. Please use the general login.")
        await supabase.auth.signOut()
        return
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Staff Sign In</CardTitle>
        <CardDescription>Enter your staff credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
        <p className="text-sm text-center mt-4">
          If you are not staff, please use the <Link href="/auth/login" className="text-primary hover:underline">general login</Link>.
        </p>
      </CardContent>
    </Card>
  )
}
