"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Download, Plus, QrCode, Copy, Check } from "lucide-react"

interface Table {
  id: string
  table_number: number
  capacity: number
  location: string
  created_at: string
}

export default function QRCodesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [newTableNumber, setNewTableNumber] = useState("")
  const [newTableCapacity, setNewTableCapacity] = useState("4")
  const [newTableLocation, setNewTableLocation] = useState("")
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const supabase = createClient()

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const { data } = await supabase
        .from("restaurant_tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("table_number")

      setTables(data || [])
    } finally {
      setLoading(false)
    }
  }

  const createTable = async () => {
    if (!newTableNumber.trim()) {
      alert("Please enter a table number")
      return
    }

    setCreating(true)
    try {
      const tableNumber = Number.parseInt(newTableNumber.trim(), 10)

      if (isNaN(tableNumber)) {
        alert("Please enter a valid table number")
        setCreating(false)
        return
      }

      // Check if table number already exists for this restaurant
      const { data: existingTable, error: existingTableError } = await supabase
        .from("restaurant_tables")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("table_number", tableNumber)
        .maybeSingle()

      if (existingTableError) throw existingTableError

      if (existingTable) {
        alert(`Error: Table number "${tableNumber}" already exists.`)
        return
      }

      const { data, error } = await supabase.from("restaurant_tables").insert({
        restaurant_id: restaurantId,
        table_number: tableNumber,
        capacity: Math.max(1, Number.parseInt(newTableCapacity) || 4),
        location: newTableLocation.trim() || "Main Area",
        is_active: true,
      })

      if (error) {
        console.error("[v0] Supabase error creating table:", error)
        // Provide a more specific error message for unique constraint violation
        if (error.code === "23505") { // 23505 is the PostgreSQL code for unique_violation
          throw new Error(`Table number "${tableNumber}" already exists.`)
        } else {
          throw new Error(error.message)
        }
      }

      await fetchTables()
      setNewTableNumber("")
      setNewTableCapacity("4")
      setNewTableLocation("")
      alert("Table created successfully!")
    } catch (err) {
      console.error("[v0] Error creating table:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create table"
      alert(`Error: ${errorMessage}`)
    } finally {
      setCreating(false) // This was moved from the try block to ensure it always runs
    }
  }

  const getMenuUrl = (tableId: string) => {
    return `${window.location.origin}/menu/${tableId}`
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const downloadQRCode = async (tableId: string, tableNumber: string) => {
    try {
      // This uses a QR code API - you can replace with your preferred service
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getMenuUrl(tableId))}`
      const link = document.createElement("a")
      link.href = url
      link.download = `qr-code-table-${tableNumber}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("[v0] Error downloading QR code:", err)
      alert("Failed to download QR code")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href={`/restaurant/${restaurantId}/dashboard`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Table Management & QR Codes</h1>
          <p className="text-slate-400">Create and manage tables, generate QR codes for customer ordering</p>
        </div>

        {/* Create New Table */}
        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Create New Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="table-number" className="text-sm font-medium text-slate-400 mb-2 block">
                  Table Number/Name
                </Label>
                <Input
                  id="table-number"
                  placeholder="e.g., Table 1, Window 5"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  disabled={creating}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="capacity" className="text-sm font-medium text-slate-400 mb-2 block">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  disabled={creating}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-sm font-medium text-slate-400 mb-2 block">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Outdoor, VIP Section"
                  value={newTableLocation}
                  onChange={(e) => setNewTableLocation(e.target.value)}
                  disabled={creating}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={createTable}
                  disabled={creating}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Table
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3 bg-slate-900 border-slate-800 border-dashed">
              <CardContent className="pt-12 text-center py-12">
                <QrCode className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                <p className="text-lg font-medium text-slate-400">No tables created yet</p>
                <p className="text-sm text-slate-500 mt-1">Create your first table above to get started</p>
              </CardContent>
            </Card>
          ) : (
            tables.map((table) => (
              <Card key={table.id} className="bg-slate-900 border-slate-800 hover:shadow-lg transition overflow-hidden">
                <CardHeader className="bg-slate-800 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">{table.table_number}</CardTitle>
                      <p className="text-sm text-slate-400 mt-1">Capacity: {table.capacity} persons</p>
                      <p className="text-sm text-slate-400">Location: {table.location}</p>
                    </div>
                    <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                      <QrCode className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* QR Code Preview */}
                    <div className="bg-slate-800 p-4 rounded-lg text-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getMenuUrl(table.id))}`}
                        alt="QR Code"
                        className="w-full h-auto"
                      />
                    </div>

                    {/* Menu URL */}
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2">Menu Link:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getMenuUrl(table.id)}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs border border-slate-700 rounded bg-slate-800 text-white"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(getMenuUrl(table.id), table.id)}
                          className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          {copiedId === table.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={() => downloadQRCode(table.id, table.table_number.toString())}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Instructions */}
        <Card className="mt-8 bg-slate-900 border-slate-800 border-l-4 border-purple-600 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-400 text-sm">
            <p>
              <strong>1. Create Tables:</strong> Add a table for each seat/area in your restaurant
            </p>
            <p>
              <strong>2. Generate QR Codes:</strong> Download the QR code for each table
            </p>
            <p>
              <strong>3. Print & Display:</strong> Print the QR codes and place them on each table using NFC stickers or
              laminated cards
            </p>
            <p>
              <strong>4. Customers Order:</strong> Customers scan the QR code with their phone to access the menu and
              place orders
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
