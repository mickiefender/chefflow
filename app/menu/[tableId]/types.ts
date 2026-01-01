export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export interface Category {
  image_url: string
  id: string
  name: string
  icon?: string
}

export interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  image_url: string | null
  category_id: string
  available: boolean
  ingredients: string[] | null
  preparation_time: number | null
}