"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/currency"
import CategoryDialog from "./CategoryDialog"
import ItemDialog from "./ItemDialog"
import type { MgmtCategory, MgmtItem } from "./types"

interface Props {
  restaurantId: string
  currency: string
  initialCategories: MgmtCategory[]
  initialItems: MgmtItem[]
}

export default function MenuManager({ restaurantId, currency, initialCategories, initialItems }: Props) {
  const [categories, setCategories] = useState<MgmtCategory[]>(initialCategories)
  const [items, setItems] = useState<MgmtItem[]>(initialItems)

  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<MgmtCategory | null>(null)

  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MgmtItem | null>(null)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null)

  function openNewCategory() {
    setEditingCat(null)
    setCatDialogOpen(true)
  }

  function openEditCategory(cat: MgmtCategory) {
    setEditingCat(cat)
    setCatDialogOpen(true)
  }

  function openNewItem(categoryId: string) {
    setEditingItem(null)
    setDefaultCategoryId(categoryId)
    setItemDialogOpen(true)
  }

  function openEditItem(item: MgmtItem) {
    setEditingItem(item)
    setDefaultCategoryId(null)
    setItemDialogOpen(true)
  }

  function onCategorySaved(cat: MgmtCategory) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = cat
        return next
      }
      return [...prev, cat]
    })
  }

  function onItemSaved(item: MgmtItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = item
        return next
      }
      return [...prev, item]
    })
  }

  async function toggleCategoryActive(cat: MgmtCategory) {
    const res = await fetch(`/api/menu/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.is_active }),
    })
    if (res.ok) {
      const { category } = await res.json()
      onCategorySaved(category)
    }
  }

  async function deleteCategory(cat: MgmtCategory) {
    if (!confirm(`Delete category "${cat.name}" and all its items?`)) return
    const res = await fetch(`/api/menu/categories/${cat.id}`, { method: "DELETE" })
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id))
      setItems((prev) => prev.filter((i) => i.category_id !== cat.id))
    }
  }

  async function toggleItemAvailable(item: MgmtItem) {
    const res = await fetch(`/api/menu/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.is_available }),
    })
    if (res.ok) {
      const { item: updated } = await res.json()
      onItemSaved(updated)
    }
  }

  async function deleteItem(item: MgmtItem) {
    if (!confirm(`Delete "${item.name}"?`)) return
    const res = await fetch(`/api/menu/items/${item.id}`, { method: "DELETE" })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    }
  }

  const sorted = [...categories].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Menu</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} categories · {items.length} items
          </p>
        </div>
        <button
          onClick={openNewCategory}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:opacity-80 transition-opacity"
        >
          + Add category
        </button>
      </div>

      {/* Categories */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No categories yet.</p>
          <button onClick={openNewCategory} className="mt-2 text-sm text-primary underline">
            Add your first category
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((cat) => {
            const catItems = items
              .filter((i) => i.category_id === cat.id)
              .sort((a, b) => a.display_order - b.display_order)

            return (
              <div key={cat.id} className="rounded-xl border border-border overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    {!cat.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCategoryActive(cat)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {cat.is_active ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="text-xs text-destructive hover:opacity-80 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {catItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                      {item.thumbnail_url && (
                        <img
                          src={item.thumbnail_url}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          {!item.is_available && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              Off
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price, currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => toggleItemAvailable(item)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.is_available ? "Mark off" : "Mark on"}
                        </button>
                        <button
                          onClick={() => openEditItem(item)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="text-xs text-destructive hover:opacity-80 transition-opacity"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2.5">
                    <button
                      onClick={() => openNewItem(cat.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      + Add item
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <CategoryDialog
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        restaurantId={restaurantId}
        editing={editingCat}
        onSaved={onCategorySaved}
      />

      <ItemDialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        restaurantId={restaurantId}
        categories={categories}
        editing={editingItem}
        defaultCategoryId={defaultCategoryId}
        onSaved={onItemSaved}
      />
    </div>
  )
}
