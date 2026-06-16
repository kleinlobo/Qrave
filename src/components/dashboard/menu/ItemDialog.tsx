"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { DIETARY_OPTIONS, type MgmtCategory, type MgmtItem } from "./types"

interface Props {
  open: boolean
  onClose: () => void
  restaurantId: string
  categories: MgmtCategory[]
  editing: MgmtItem | null
  defaultCategoryId: string | null
  onSaved: (item: MgmtItem) => void
}

export default function ItemDialog({
  open,
  onClose,
  restaurantId,
  categories,
  editing,
  defaultCategoryId,
  onSaved,
}: Props) {
  const [categoryId, setCategoryId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [dietaryTags, setDietaryTags] = useState<string[]>([])
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isAvailable, setIsAvailable] = useState(true)
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const thumbRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setCategoryId(editing?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? "")
      setName(editing?.name ?? "")
      setDescription(editing?.description ?? "")
      setPrice(editing ? String(editing.price) : "")
      setDietaryTags(editing?.dietary_tags ?? [])
      setDisplayOrder(editing?.display_order ?? 0)
      setIsAvailable(editing?.is_available ?? true)
      setThumbnailUrl(editing?.thumbnail_url ?? "")
      setVideoUrl(editing?.video_url ?? "")
      setError(null)
    }
  }, [open, editing, defaultCategoryId, categories])

  async function uploadFile(file: File, type: "thumbnail" | "video") {
    const setLoading = type === "thumbnail" ? setThumbnailUploading : setVideoUploading
    const setUrl = type === "thumbnail" ? setThumbnailUrl : setVideoUrl
    setLoading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() ?? (type === "thumbnail" ? "jpg" : "mp4")
      const path = `${restaurantId}/${Date.now()}-${type}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("menu-media")
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("menu-media").getPublicUrl(path)
      setUrl(publicUrl)
    } catch (e) {
      setError(`Upload failed: ${e instanceof Error ? e.message : "unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  function toggleTag(tag: string) {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSave() {
    if (!categoryId || !name.trim() || !price) {
      setError("Category, name, and price are required")
      return
    }
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid price")
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      categoryId,
      name,
      description: description || null,
      price: parsedPrice,
      videoUrl: videoUrl || null,
      thumbnailUrl: thumbnailUrl || null,
      dietaryTags,
      displayOrder,
      isAvailable,
    }

    try {
      let res: Response
      if (editing) {
        res = await fetch(`/api/menu/items/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/menu/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId, ...payload }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? "Failed to save")
        return
      }

      const { item } = await res.json()
      onSaved(item)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit item" : "New item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="item-category">Category</Label>
            <select
              id="item-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Salmon"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — short description"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Price + display order */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-price">Price</Label>
              <Input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-order">Display order</Label>
              <Input
                id="item-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Available toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="item-available">Available</Label>
            <button
              id="item-available"
              type="button"
              onClick={() => setIsAvailable((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAvailable ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <Separator />

          {/* Dietary tags */}
          <div className="space-y-2">
            <Label>Dietary tags</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTag(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    dietaryTags.includes(opt.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Thumbnail upload */}
          <div className="space-y-1.5">
            <Label>Thumbnail image</Label>
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="h-24 w-24 rounded-lg object-cover border border-border"
              />
            )}
            <div className="flex items-center gap-2">
              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadFile(file, "thumbnail")
                }}
              />
              <button
                type="button"
                onClick={() => thumbRef.current?.click()}
                disabled={thumbnailUploading}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors disabled:opacity-60"
              >
                {thumbnailUploading ? "Uploading…" : "Choose image"}
              </button>
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setThumbnailUrl("")}
                  className="text-xs text-destructive"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Video upload */}
          <div className="space-y-1.5">
            <Label>Video clip (5–10s)</Label>
            {videoUrl && (
              <p className="text-xs text-muted-foreground truncate">{videoUrl.split("/").pop()}</p>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadFile(file, "video")
                }}
              />
              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                disabled={videoUploading}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors disabled:opacity-60"
              >
                {videoUploading ? "Uploading…" : "Choose video"}
              </button>
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setVideoUrl("")}
                  className="text-xs text-destructive"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || thumbnailUploading || videoUploading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add item"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
