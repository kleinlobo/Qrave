"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import type { MenuCategory } from "@/lib/menu/types"

interface Props {
  categories: Pick<MenuCategory, "id" | "name">[]
  activeId: string | null
  onSelect: (categoryId: string) => void
}

export default function CategoryChips({ categories, activeId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleSelect(id: string) {
    onSelect(id)
    // Auto-scroll the chip into view
    const chip = scrollRef.current?.querySelector(`[data-cat="${id}"]`) as HTMLElement | null
    chip?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hidden px-4 py-3"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-cat={cat.id}
          onClick={() => handleSelect(cat.id)}
          className={cn(
            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
            activeId === cat.id
              ? "bg-primary text-primary-foreground"
              : "bg-black/40 backdrop-blur-sm text-white"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
