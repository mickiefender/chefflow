"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function InitPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleInit = async () => {
    setLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      const response = await fetch("/api/init/super-admin", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        setMessage(data.error || "Initialization failed")
        return
      }

      setStatus("success")
      setMessage(
        `${data.message}\n\nEmail: ${data.email}\nPassword: ${data.password}\n\nYou can now sign in at /super-admin/login`,
      )
    } catch (error) {
      setStatus("error")
      setMessage("An error occurred during initialization")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>RestaurantPOS - Initial Setup</CardTitle>
            <CardDescription>Set up the default super admin account for system access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Click the button below to create the default super admin account. This should only be done once during
                initial setup.
              </AlertDescription>
            </Alert>

            {status === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 whitespace-pre-line">{message}</AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{message}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleInit} disabled={loading || status === "success"} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Initialization Complete
                </>
              ) : (
                "Initialize Super Admin"
              )}
            </Button>

            {status === "success" && (
              <Button
                onClick={() => (window.location.href = "/super-admin/login")}
                variant="outline"
                className="w-full"
              >
                Go to Super Admin Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
