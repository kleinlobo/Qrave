import type { Tables } from "@/types"

export type MenuItem = Pick<
  Tables<"menu_items">,
  | "id"
  | "category_id"
  | "name"
  | "description"
  | "price"
  | "video_url"
  | "thumbnail_url"
  | "dietary_tags"
  | "display_order"
>

export type MenuCategory = Pick<
  Tables<"menu_categories">,
  "id" | "name" | "display_order"
> & {
  items: MenuItem[]
}
