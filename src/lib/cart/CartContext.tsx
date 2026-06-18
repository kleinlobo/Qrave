"use client"

import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from "react"

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

interface CartState {
  items: CartItem[]
}

type Action =
  | { type: "ADD"; menuItemId: string; name: string; price: number }
  | { type: "DECREMENT"; menuItemId: string }
  | { type: "REMOVE"; menuItemId: string }
  | { type: "SET_NOTES"; menuItemId: string; notes: string }
  | { type: "CLEAR" }
  | { type: "RESTORE"; items: CartItem[] }

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD": {
      const idx = state.items.findIndex((i) => i.menuItemId === action.menuItemId)
      if (idx >= 0) {
        const items = [...state.items]
        items[idx] = { ...items[idx], quantity: items[idx].quantity + 1 }
        return { items }
      }
      return {
        items: [
          ...state.items,
          { menuItemId: action.menuItemId, name: action.name, price: action.price, quantity: 1 },
        ],
      }
    }
    case "DECREMENT": {
      const idx = state.items.findIndex((i) => i.menuItemId === action.menuItemId)
      if (idx < 0) return state
      if (state.items[idx].quantity <= 1) {
        return { items: state.items.filter((i) => i.menuItemId !== action.menuItemId) }
      }
      const items = [...state.items]
      items[idx] = { ...items[idx], quantity: items[idx].quantity - 1 }
      return { items }
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.menuItemId !== action.menuItemId) }
    case "SET_NOTES": {
      const items = state.items.map((i) =>
        i.menuItemId === action.menuItemId ? { ...i, notes: action.notes } : i
      )
      return { items }
    }
    case "CLEAR":
      return { items: [] }
    case "RESTORE":
      return { items: action.items }
  }
}

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  subtotal: number
  ready: boolean
  getQuantity: (menuItemId: string) => number
  addItem: (menuItemId: string, name: string, price: number) => void
  decrementItem: (menuItemId: string) => void
  removeItem: (menuItemId: string) => void
  setNotes: (menuItemId: string, notes: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "qrave-cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { items: CartItem[] }
        if (Array.isArray(parsed.items)) {
          dispatch({ type: "RESTORE", items: parsed.items })
        }
      }
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  // Persist to localStorage after every change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }))
    } catch { /* ignore */ }
  }, [state.items, hydrated])

  const value: CartContextValue = {
    items: state.items,
    totalItems: state.items.reduce((s, i) => s + i.quantity, 0),
    subtotal: state.items.reduce((s, i) => s + i.price * i.quantity, 0),
    ready: hydrated,
    getQuantity: (id) => state.items.find((i) => i.menuItemId === id)?.quantity ?? 0,
    addItem: (id, name, price) => dispatch({ type: "ADD", menuItemId: id, name, price }),
    decrementItem: (id) => dispatch({ type: "DECREMENT", menuItemId: id }),
    removeItem: (id) => dispatch({ type: "REMOVE", menuItemId: id }),
    setNotes: (id, notes) => dispatch({ type: "SET_NOTES", menuItemId: id, notes }),
    clear: () => dispatch({ type: "CLEAR" }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within <CartProvider>")
  return ctx
}
