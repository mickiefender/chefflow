"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SuperAdminOnboarding() {
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Simulate completion after 2 seconds
    const timer = setTimeout(() => {
      setCompleted(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to RestaurantPOS</CardTitle>
          <CardDescription>Your super admin account is ready</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {[
              { title: "Account Created", desc: "Your super admin account is active" },
              { title: "Access Granted", desc: "Full system management capabilities enabled" },
              { title: "Ready to Manage", desc: "Start registering restaurants" },
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-foreground/70">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {completed ? (
            <Link href="/super-admin/dashboard" className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button className="w-full" disabled>
              Setting up...
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
