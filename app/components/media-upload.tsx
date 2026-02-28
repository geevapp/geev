"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ImageIcon, Video, FileText } from "lucide-react"
import type { PostMedia } from "@/lib/types"

interface MediaUploadProps {
  onMediaChange: (media: PostMedia[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function MediaUpload({ onMediaChange, maxFiles = 5, acceptedTypes = ["image/*", "video/*"] }: MediaUploadProps) {
  const [media, setMedia] = useState<PostMedia[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newMedia: PostMedia[] = []

    Array.from(files).forEach((file, index) => {
      if (media.length + newMedia.length >= maxFiles) return

      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")

      if (!isImage && !isVideo) return

      const url = URL.createObjectURL(file)
      const mediaItem: PostMedia = {
        id: `${Date.now()}-${index}`,
        type: isImage ? "image" : "video",
        url,
        thumbnail: isVideo ? url : undefined,
      }

      newMedia.push(mediaItem)
    })

    const updatedMedia = [...media, ...newMedia]
    setMedia(updatedMedia)
    onMediaChange(updatedMedia)
  }

  const removeMedia = (id: string) => {
    const updatedMedia = media.filter((item) => item.id !== id)
    setMedia(updatedMedia)
    onMediaChange(updatedMedia)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const getFileIcon = (type: string) => {
    if (type === "image") return <ImageIcon className="w-4 h-4" />
    if (type === "video") return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
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
          <p className="text-xs text-gray-500">Supports images and videos • Max {maxFiles} files</p>
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
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Media Preview */}
      {media.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Uploaded Media ({media.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {media.map((item) => (
              <Card key={item.id} className="relative group">
                <CardContent className="p-2">
                  {item.type === "image" ? (
                    <img
                      src={item.url || "/placeholder.svg"}
                      alt="Upload preview"
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs">
                      {getFileIcon(item.type)}
                      <span className="ml-1 capitalize">{item.type}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeMedia(item.id)
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
