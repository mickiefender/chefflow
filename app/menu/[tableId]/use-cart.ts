import { useState, useMemo } from "react"
import { MenuItem } from "./types"

export interface CartItem extends MenuItem {
  quantity: number
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((ci) => ci.id === item.id)
      if (existingItem) {
        return prevItems.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci,
        )
      }
      return [...prevItems, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((ci) => ci.id === itemId)
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map((ci) =>
          ci.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci,
        )
      }
      return prevItems.filter((ci) => ci.id !== itemId)
    })
  }

  const clearCart = () => {
    setCartItems([])
  }

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const tax = useMemo(() => cartTotal * 0.1, [cartTotal])

  const finalTotal = useMemo(() => cartTotal + tax, [cartTotal, tax])

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    tax,
    finalTotal,
  }
}