"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRealtimeMenu } from "@/lib/hooks/use-realtime-menu"
import { Plus, ArrowLeft, Upload, Trash2, Edit2, ImageIcon, Loader2, X, Sparkles, Save, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useMediaUpload } from "@/lib/hooks/use-media-upload"
import { parseAndFormatIngredients } from "@/lib/utils"

interface MenuItem {
  id: string
  name: string
  price: number
  description: string
  available: boolean
  phone: string | null
  image_url: string | null
  category_id: string
  ingredients: string[] | null
  preparation_time: number | null
}

interface Category {
  id: string
  name: string
  description: string | null
}

export default function MenuManagementPage() {
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.restaurantId as string
  const supabase = createClient()
  const { upload, loading: uploadLoading, error: uploadError } = useMediaUpload()

  const { menuItems, loading, refetch } = useRealtimeMenu(restaurantId, { fetchUnavailable: true })

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newItem, setNewItem] = useState({ name: "", price: "", description: "", phone: "", category_id: "", ingredients: "", preparation_time: "" })
  const [newItemImage, setNewItemImage] = useState<File | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [restaurantId])

  const fetchCategories = async () => {
    const { data } = await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId)
    if (data) {
      setCategories(data)
      if (data.length > 0) {
        setSelectedCategory(data[0].id)
        setNewItem((prev) => ({ ...prev, category_id: data[0].id }))
      }
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name || !newItem.price || !selectedCategory) return

    let imageUrl: string | null = null

    try {
      if (newItemImage) {
        imageUrl = await upload(newItemImage, {
          bucket: "menu-items",
          restaurantId,
          type: "menu",
        })
      }

      const { error } = await supabase.from("menu_items").insert({
        restaurant_id: restaurantId,
        name: newItem.name,
        price: Number.parseFloat(newItem.price) * 1.1,
        phone: newItem.phone,
        description: newItem.description,
        image_url: imageUrl,
        category_id: selectedCategory,
        available: true,
        preparation_time: newItem.preparation_time ? Number.parseInt(newItem.preparation_time) : null,
        ingredients: parseAndFormatIngredients(newItem.ingredients),
      })

      if (!error) {
        setNewItem({ name: "", price: "", description: "", phone: "", category_id: newItem.category_id, ingredients: "", preparation_time: "" })
        setNewItemImage(null)
        refetch() // Refresh menu after adding item
      } else {
        throw new Error(error.message)
      }
    } catch (err) {
      console.error("[v0] Error adding menu item:", err)
      alert(`Failed to add menu item. Please try again. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return

    setCreatingCategory(true)
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .insert({
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
          sort_order: categories.length,
          restaurant_id: restaurantId,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setCategories((prev) => [...prev, data])
        setNewCategory({ name: "", description: "" })
        setSelectedCategory(data.id) // Select the new category
        setNewItem((prev) => ({ ...prev, category_id: data.id })) // Update new item form
      }
    } catch (err) {
      console.error("[v0] Error creating category:", err)
      alert(`Failed to create category. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !editingId) return

    try {
      const response = await fetch(`/api/menu/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingItem.name,
          price: Number(editingItem.price),
          description: editingItem.description,
          phone: editingItem.phone,
          category_id: editingItem.category_id,
          preparation_time: editingItem.preparation_time,
          ingredients: editingItem.ingredients,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update menu item")
      } else {
        await refetch() // Refresh menu after updating item
      }

      // Close the edit form
      setEditingId(null)
      setEditingItem(null)
    } catch (err) {
      console.error("[v0] Error updating menu item:", err)
      alert(`Failed to update menu item. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const addDefaultCategories = async () => {
    const defaultCategories = [
      { name: "Starters", description: "Light bites to begin your meal.", sort_order: 0 },
      { name: "Main Course", description: "The heart of your dining experience.", sort_order: 1 },
      { name: "Desserts", description: "Sweet treats to end on a high note.", sort_order: 2 },
      { name: "Drinks", description: "Beverages to accompany your food.", sort_order: 3 },
    ]

    try {
      const { data: existingCategories, error: fetchError } = await supabase
        .from("menu_categories")
        .select("name")
        .eq("restaurant_id", restaurantId)

      if (fetchError) throw new Error(fetchError.message)

      const existingNames = new Set(existingCategories.map((c) => c.name))
      const categoriesToInsert = defaultCategories
        .filter((cat) => !existingNames.has(cat.name))
        .map((cat) => ({ ...cat, restaurant_id: restaurantId }))

      if (categoriesToInsert.length === 0) {
        alert("All default categories already exist.")
        await fetchCategories()
        return
      }

      const { data, error } = await supabase.from("menu_categories").insert(categoriesToInsert).select()

      if (error) throw new Error(error.message)

      if (data) {
        await fetchCategories()
        alert("Default categories added successfully!")
      }
    } catch (err) {
      console.error("[v0] Error adding default categories:", err)
      alert(`Failed to add default categories. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const toggleAvailability = async (itemId: string, available: boolean) => {
    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ available: !available }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to toggle availability")
      } else {
        refetch() // Refresh menu after toggling availability
      }
    } catch (err) {
      console.error("[v0] Error toggling item availability:", err)
      alert(`Failed to toggle item availability. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || typeof itemToDelete !== 'string' || itemToDelete === "undefined") {
      console.error("Attempted to delete with an invalid item ID:", itemToDelete);
      alert("Error: Cannot delete item. Invalid item ID provided.");
      setItemToDelete(null); // Clear the state for safety
      return;
    }
    try {
      const response = await fetch(`/api/menu/${itemToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete menu item")
      } else {
        refetch() // Refresh menu after deleting item
      }
    } catch (err) {
      console.error("[v0] Error deleting menu item:", err)
      alert(`Failed to delete menu item. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setItemToDelete(null)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/menu/categories/${categoryId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to delete category")
        }

        // On successful deletion, update UI
        if (selectedCategory === categoryId) {
          const remainingCategories = categories.filter((c) => c.id !== categoryId)
          setSelectedCategory(remainingCategories.length > 0 ? remainingCategories[0].id : "")
        }
        await fetchCategories()
        alert("Category deleted successfully!")
      } catch (err) {
        console.error("[v0] Error deleting category:", err)
        alert(`Failed to delete category. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }
  }

  const handleImageUpload = async (itemId: string, file: File) => {
    try {
      const imageUrl = await upload(file, {
        bucket: "menu-items",
        restaurantId,
        type: "menu",
      })
      if (imageUrl) {
        const response = await fetch(`/api/menu/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_url: imageUrl }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to update menu item image")
        } else {
          refetch() // Refresh menu after image upload
        }
      }
    } catch (err) {
      console.error("[v0] Error updating menu item image:", err)
      alert(`Failed to update menu item image. Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const filteredItems = menuItems.filter((item) => item.category_id === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]"> {/* Adjusted height to account for header in layout */}
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the menu item and its image from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Yes, delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Menu Management</h1>
          <p className="text-slate-400">Add, edit, and manage your restaurant menu items</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <Label className="text-sm font-semibold text-slate-400 block mb-3">Filter by Category</Label>
          <div className="flex flex-wrap gap-2 pb-2">
            {categories.map((category) => (
              <div key={category.id} className="relative group">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`pl-4 pr-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    selectedCategory === category.id
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {category.name}
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Delete category"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {categories.length === 0 && !loading && (
              <Card className="bg-slate-900 border-slate-800 border-dashed col-span-full">
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-slate-400 font-medium mb-4">No categories found. Get started by creating one or adding defaults.</p>
                  <Button onClick={addDefaultCategories} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Add Default Categories
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create New Category */}
        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Create New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Category Name (e.g., Appetizers)"
                  className="flex-grow bg-slate-800 border-slate-700 text-white"
                  disabled={creatingCategory}
                  required
                />
                <Input
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Optional: Category Description"
                  className="flex-grow bg-slate-800 border-slate-700 text-white"
                  disabled={creatingCategory}
                />
              </div>
              <Button type="submit" disabled={creatingCategory} className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto">
                {creatingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create New Category
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Add New Item Form */}
        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Add New Menu Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddItem} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-slate-400">
                    Item Name
                  </Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Caesar Salad"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-slate-400">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="0.00"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                  {newItem.price && !isNaN(parseFloat(newItem.price)) && (
                    <p className="text-xs text-slate-400 mt-1">
                      Customer price will be GH₵{(parseFloat(newItem.price) * 1.1).toFixed(2)} (includes 10% commission).
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-400">
                    Phone (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newItem.phone}
                    onChange={(e) => setNewItem({ ...newItem, phone: e.target.value })}
                    placeholder="For phone orders"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-slate-400">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Item description"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="preparation_time" className="text-sm font-medium text-slate-400">
                    Preparation Time (minutes, optional)
                  </Label>
                  <Input
                    id="preparation_time"
                    type="number"
                    value={newItem.preparation_time}
                    onChange={(e) => setNewItem({ ...newItem, preparation_time: e.target.value })}
                    placeholder="e.g., 15"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="ingredients" className="text-sm font-medium text-slate-400">
                    Ingredients (comma-separated, optional)
                  </Label>
                  <Input
                    id="ingredients"
                    value={newItem.ingredients}
                    onChange={(e) => setNewItem({ ...newItem, ingredients: e.target.value })}
                    placeholder="e.g., Chicken, Lettuce, Tomato"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="image" className="text-sm font-medium text-slate-400">
                    Image (Optional)
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setNewItemImage(e.target.files[0])
                      else setNewItemImage(null)
                    }}
                    className="mt-1 file:text-slate-400 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Button type="submit" disabled={uploadLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                {uploadLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Display for Upload Errors */}
        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{uploadError}</div>
        )}

        {/* Menu Items Grid */}
        <div className="grid gap-4">
          {filteredItems.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 border-dashed">
              <CardContent className="pt-6 text-center py-12">
                <ImageIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-400 font-medium">No items in this category</p>
                <p className="text-slate-500 text-sm mt-1">Add your first item above!</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-slate-900 border-slate-800 hover:shadow-lg transition overflow-hidden">
                {editingId === item.id ? (
                  <CardContent className="pt-6 bg-slate-900">
                    <form onSubmit={handleUpdateItem}>
                      <div className="flex gap-4">
                        {/* Image Section (non-editable here) */}
                        <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-28 h-28 object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        {/* Edit Fields */}
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={editingItem?.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                              placeholder="Item Name"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              value={editingItem?.price}
                              onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                              placeholder="Price"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <Input
                            value={editingItem?.description || ""}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            placeholder="Description"
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              type="number"
                              value={editingItem?.preparation_time || ""}
                              onChange={(e) => setEditingItem({ ...editingItem, preparation_time: Number.parseInt(e.target.value) || null })}
                              placeholder="Prep time (mins)"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                            <Input
                              value={parseAndFormatIngredients(editingItem?.ingredients).join(", ")}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditingItem({ ...editingItem, ingredients: parseAndFormatIngredients(value) })
                              }}
                              placeholder="Ingredients (comma-separated)"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={editingItem?.phone || ""}
                              onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                              placeholder="Phone (Optional)"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                            <select
                              value={editingItem?.category_id}
                              onChange={(e) => setEditingItem({ ...editingItem, category_id: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-700 rounded bg-slate-800 text-white"
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null)
                                setEditingItem(null)
                              }}
                              className="text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                              <XCircle className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                              <Save className="w-4 h-4 mr-2" /> Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                ) : (
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Image Section */}
                      <div className="w-28 h-28 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative group">
                        {item.image_url ? (
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.name}
                            className="w-28 h-28 object-cover group-hover:opacity-75 transition"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                          {uploadLoading ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5 text-white" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleImageUpload(item.id, e.target.files[0])
                              }
                            }}
                            disabled={uploadLoading}
                          />
                        </label>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-white">{item.name}</h3>
                            <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                            {parseAndFormatIngredients(item.ingredients).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {parseAndFormatIngredients(item.ingredients).map((ingredient) => (
                                  <Badge key={ingredient} variant="secondary" className="text-xs">
                                    {ingredient}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">GH₵{item.price.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant={item.available ? "default" : "outline"}
                            onClick={() => toggleAvailability(item.id, item.available)}
                            className={item.available ? "bg-green-600 hover:bg-green-700" : "border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"}
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                            onClick={() => {
                              setEditingId(item.id)
                              setEditingItem({
                                ...item,
                                description: typeof item.description === "string" ? item.description : String(item.description ?? ""),
                              })
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                                                      <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => setItemToDelete(item.id)}
                                                      className="border-slate-700 text-red-400 hover:bg-red-700 hover:text-white"
                                                    >                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}
