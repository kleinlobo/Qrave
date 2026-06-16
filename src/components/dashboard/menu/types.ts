export type MgmtCategory = {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export type MgmtItem = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  video_url: string | null
  thumbnail_url: string | null
  dietary_tags: string[]
  display_order: number
  is_available: boolean
}

export const DIETARY_OPTIONS = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "dairy_free", label: "Dairy Free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "nuts", label: "Contains Nuts" },
  { value: "spicy", label: "Spicy" },
] as const
