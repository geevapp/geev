"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ImageIcon, Video, FileText, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import type { PostMedia } from "@/lib/types"
import { validateMedia } from "@/lib/media-utils"
import { uploadFile } from "@/lib/storage"
import { compressImage, generateThumbnail, formatFileSize } from "@/lib/image-compression"

// ── Constants ─────────────────────────────────────────────────
const MAX_IMAGE_SIZE = 10  * 1024 * 1024  // 10 MB (before compression)
const MAX_VIDEO_SIZE = 100 * 1024 * 1024  // 100 MB
const ALLOWED_IMAGE  = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ALLOWED_VIDEO  = ["video/mp4", "video/webm", "video/quicktime"]

// ── Types ─────────────────────────────────────────────────────

interface CompressionInfo {
  originalSize: number
  compressedSize: number
  savedPercent: number
}

// Extends PostMedia with transient UI state that never leaves this component.
interface ExtendedPostMedia extends PostMedia {
  isUploading?:  boolean
  isCompressing?: boolean
  error?:        string
  compressionInfo?: CompressionInfo
}

interface MediaUploadProps {
  onMediaChange:  (media: PostMedia[]) => void
  maxFiles?:      number
  acceptedTypes?: string[]
}

// ── Component ─────────────────────────────────────────────────

export function MediaUpload({
  onMediaChange,
  maxFiles      = 5,
  acceptedTypes = ["image/*", "video/*"],
}: MediaUploadProps) {
  const [media,      setMedia]      = useState<ExtendedPostMedia[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Upload handler ─────────────────────────────────────────

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    if (media.length >= maxFiles) {
      toast.error("Limit reached", {
        description: `You can only upload up to ${maxFiles} files.`,
      })
      return
    }

    const candidates = Array.from(files).slice(0, maxFiles - media.length)

    for (const file of candidates) {
      // 1. Magic-byte + type validation via shared util
      const validation = await validateMedia(file)
      if (!validation.isValid) {
        toast.error(`Invalid file: ${file.name}`, { description: validation.error })
        continue
      }

      const isImage = ALLOWED_IMAGE.includes(file.type)
      const isVideo = ALLOWED_VIDEO.includes(file.type)
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
      const label   = isVideo ? "100 MB" : "10 MB"

      if (file.size > maxSize) {
        toast.error("File too large", {
          description: `${file.name} exceeds the ${label} limit.`,
        })
        continue
      }

      const tempId = `${Date.now()}-${file.name}`

      // 2. Add compressing placeholder for images
      const placeholder: ExtendedPostMedia = {
        id:            tempId,
        type:          isImage ? "image" : "video",
        url:           URL.createObjectURL(file),
        thumbnail:     isImage ? URL.createObjectURL(file) : undefined,
        isUploading:   false,
        isCompressing: isImage,
      }

      setMedia((prev) => {
        const updated = [...prev, placeholder]
        onMediaChange(updated)
        return updated
      })

      // 3. Compress images before upload (Issue #64)
      let fileToUpload = file
      let compressionInfo: CompressionInfo | undefined

      if (isImage) {
        try {
          const result = await compressImage(file)
          const thumb  = await generateThumbnail(result.file)

          fileToUpload   = result.file
          compressionInfo = {
            originalSize:    result.originalSize,
            compressedSize:  result.compressedSize,
            savedPercent:    result.savedPercent,
          }

          // Update preview to the compressed + thumbnail versions
          setMedia((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    url:           URL.createObjectURL(result.file),
                    thumbnail:     thumb.dataUrl,
                    isCompressing: false,
                    isUploading:   true,
                    compressionInfo,
                  }
                : item,
            ),
          )
        } catch {
          // Compression failed — proceed with original, clear compressing flag
          setMedia((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? { ...item, isCompressing: false, isUploading: true }
                : item,
            ),
          )
        }
      } else {
        setMedia((prev) =>
          prev.map((item) =>
            item.id === tempId ? { ...item, isUploading: true } : item,
          ),
        )
      }

      // 4. Real upload via /api/uploads (S3-backed)
      try {
        const form = new FormData()
        form.append("file",   fileToUpload)
        form.append("folder", isVideo ? "videos" : "images")

        const res = await fetch("/api/uploads", { method: "POST", body: form })

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(body.error ?? "Upload failed")
        }

        const { url } = await res.json() as { url: string; key: string }

        setMedia((prev) => {
          const updated = prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  url,
                  thumbnail:   isImage ? url : undefined,
                  isUploading: false,
                  compressionInfo: item.compressionInfo,
                }
              : item,
          )
          onMediaChange(updated)
          return updated
        })

        if (compressionInfo && compressionInfo.savedPercent > 0) {
          toast.success("Image optimised", {
            description: `Saved ${compressionInfo.savedPercent}% — ${formatFileSize(compressionInfo.originalSize)} → ${formatFileSize(compressionInfo.compressedSize)}`,
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Please try again."
        toast.error("Upload failed", { description: message })
        setMedia((prev) => {
          const updated = prev.filter((item) => item.id !== tempId)
          onMediaChange(updated)
          return updated
        })
      }
    }
  }

  // ── Remove ─────────────────────────────────────────────────

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      onMediaChange(updated)
      return updated
    })
  }

  // ── Drag-and-drop ──────────────────────────────────────────

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    void handleFileSelect(e.dataTransfer.files)
  }

  // ── Helpers ────────────────────────────────────────────────

  const getFileIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="w-4 h-4" />
    if (type === "video") return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const getStatusLabel = (item: ExtendedPostMedia) => {
    if (item.isCompressing) return "Optimising…"
    if (item.isUploading)   return "Uploading…"
    return item.type
  }

  const isProcessing = (item: ExtendedPostMedia) =>
    item.isCompressing || item.isUploading

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        } ${media.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => media.length < maxFiles && fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Drag and drop media files here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Images auto-optimised to &lt;500 KB · Videos up to 100 MB · Max {maxFiles} files
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 bg-transparent"
            disabled={media.length >= maxFiles}
            type="button"
          >
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
            Media ({media.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {media.map((item) => (
              <Card key={item.id} className="relative group overflow-hidden">
                <CardContent className="p-2">
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                    {/* Processing overlay */}
                    {isProcessing(item) && (
                      <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center text-white p-2">
                        <Loader2 className="w-6 h-6 animate-spin mb-1" />
                        <span className="text-[10px] font-medium">
                          {item.isCompressing ? "Optimising…" : "Uploading…"}
                        </span>
                      </div>
                    )}

                    {item.type === "image" ? (
                      <img
                        src={item.thumbnail ?? item.url ?? "/placeholder.svg"}
                        alt="Upload preview"
                        className={`w-full h-full object-cover transition-opacity ${
                          isProcessing(item) ? "opacity-50" : "opacity-100"
                        }`}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        isProcessing(item) ? "opacity-50" : "opacity-100"
                      }`}>
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1">
                      {isProcessing(item)
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : item.compressionInfo
                          ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                          : getFileIcon(item.type)
                      }
                      <span className="capitalize">{getStatusLabel(item)}</span>
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      disabled={isProcessing(item)}
                      onClick={(e) => { e.stopPropagation(); removeMedia(item.id) }}
                      className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Compression info badge */}
                  {item.compressionInfo && item.compressionInfo.savedPercent > 0 && (
                    <p className="text-[9px] text-green-600 dark:text-green-400 mt-0.5 leading-tight">
                      {formatFileSize(item.compressionInfo.originalSize)} → {formatFileSize(item.compressionInfo.compressedSize)} (−{item.compressionInfo.savedPercent}%)
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
