"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ImageIcon, Video, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { PostMedia } from "@/lib/types"

interface MediaUploadProps {
  onMediaChange: (media: PostMedia[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024   // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024  // 100 MB
const ALLOWED_IMAGE  = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ALLOWED_VIDEO  = ["video/mp4", "video/webm", "video/quicktime"]

export function MediaUpload({
  onMediaChange,
  maxFiles = 5,
  acceptedTypes = ["image/*", "video/*"],
}: MediaUploadProps) {
  const [media,      setMedia]      = useState<PostMedia[]>([])
  const [isDragging, setIsDragging] = useState(false)
  // Track which item IDs are currently uploading
  const [uploading,  setUploading]  = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File, tempId: string): Promise<PostMedia | null> => {
    // ── Client-side validation ──────────────────────────────────────────────
    const isImage = ALLOWED_IMAGE.includes(file.type)
    const isVideo = ALLOWED_VIDEO.includes(file.type)

    if (!isImage && !isVideo) {
      toast.error("Unsupported file type", {
        description: "Please upload JPEG, PNG, WebP, GIF, MP4, WebM, or MOV files.",
      })
      return null
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    const label   = isVideo ? "100 MB" : "10 MB"
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: `${file.name} exceeds the ${label} limit.`,
      })
      return null
    }

    // ── Upload ──────────────────────────────────────────────────────────────
    const form = new FormData()
    form.append("file",   file)
    form.append("folder", isVideo ? "videos" : "images")

    const res = await fetch("/api/uploads", { method: "POST", body: form })

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      toast.error("Upload failed", { description: body.error ?? "Please try again." })
      return null
    }

    const { url, key } = await res.json() as { url: string; key: string }

    return {
      id:        tempId,
      type:      isImage ? "image" : "video",
      url,                                    // ← permanent CDN URL, never a blob
      thumbnail: isVideo ? undefined : url,
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const candidates = Array.from(files).slice(0, maxFiles - media.length)
    if (!candidates.length) return

    // Build placeholder items so the grid updates immediately
    const placeholders: PostMedia[] = candidates.map((file, i) => ({
      id:        `uploading-${Date.now()}-${i}`,
      type:      file.type.startsWith("video/") ? "video" : "image",
      url:       "",   // filled after upload
    }))

    const ids = new Set(placeholders.map((p) => p.id))
    setUploading((prev) => new Set([...prev, ...ids]))
    setMedia((prev) => {
      const updated = [...prev, ...placeholders]
      onMediaChange(updated)
      return updated
    })

    // Upload all files concurrently
    const results = await Promise.all(
      candidates.map((file, i) => uploadFile(file, placeholders[i].id)),
    )

    setMedia((prev) => {
      let updated = [...prev]

      results.forEach((result, i) => {
        const tempId = placeholders[i].id
        if (result) {
          // Replace placeholder with the real CDN-backed item
          updated = updated.map((item) => (item.id === tempId ? result : item))
        } else {
          // Upload failed — remove placeholder
          updated = updated.filter((item) => item.id !== tempId)
        }
      })

      onMediaChange(updated)
      return updated
    })

    setUploading((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }

  const removeMedia = (id: string) => {
    const updated = media.filter((item) => item.id !== id)
    setMedia(updated)
    onMediaChange(updated)
  }

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    void handleFileSelect(e.dataTransfer.files)
  }

  const getFileIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="w-4 h-4" />
    if (type === "video") return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Drag and drop media files here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Images up to 10 MB · Videos up to 100 MB · Max {maxFiles} files
          </p>
          <Button variant="outline" size="sm" className="mt-3 bg-transparent">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={(e) => void handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Preview grid */}
      {media.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Uploaded Media ({media.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {media.map((item) => {
              const isUploading = uploading.has(item.id)
              return (
                <Card key={item.id} className="relative group">
                  <CardContent className="p-2">
                    {/* Preview */}
                    <div className="relative w-full h-24">
                      {item.type === "image" && item.url ? (
                        <img
                          src={item.url}
                          alt="Upload preview"
                          className="w-full h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      {/* Upload progress overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {isUploading
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : getFileIcon(item.type)
                        }
                        <span className="ml-1 capitalize">
                          {isUploading ? "Uploading…" : item.type}
                        </span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isUploading}
                        onClick={(e) => { e.stopPropagation(); removeMedia(item.id) }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}