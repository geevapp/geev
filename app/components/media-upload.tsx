"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ImageIcon, Video, FileText, Loader2 } from "lucide-react"
import type { PostMedia } from "@/lib/types"
import { validateMedia } from "@/lib/media-utils"
import { uploadFile } from "@/lib/storage"
import { toast } from "sonner"

interface MediaUploadProps {
  onMediaChange: (media: PostMedia[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

interface ExtendedPostMedia extends PostMedia {
  isUploading?: boolean
  error?: string
}

export function MediaUpload({ onMediaChange, maxFiles = 5, acceptedTypes = ["image/*", "video/*"] }: MediaUploadProps) {
  const [media, setMedia] = useState<ExtendedPostMedia[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    
    // Quick check before processing anywhere
    if (media.length >= maxFiles) {
      toast.error("Limit reached", { description: `You can only upload up to ${maxFiles} files.` })
      return
    }

    for (const file of fileArray) {
      // Check limit again for each file in case multiple were dropped
      if (media.length >= maxFiles) break

      // 1. Validation (Size + Magic Bytes)
      const validation = await validateMedia(file)
      if (!validation.isValid) {
        toast.error(`Invalid file: ${file.name}`, { description: validation.error })
        continue
      }

      // 2. Create placeholder item
      const id = `${Date.now()}-${file.name}`
      const isImage = file.type.startsWith("image/")
      
      const newMediaItem: ExtendedPostMedia = {
        id,
        type: isImage ? "image" : "video",
        url: URL.createObjectURL(file), // Temporary preview
        thumbnail: isImage ? URL.createObjectURL(file) : undefined,
        isUploading: true,
      }

      setMedia((prev) => {
        const updated = [...prev, newMediaItem]
        onMediaChange(updated)
        return updated
      })

      // 3. Upload to simulated cloud storage
      try {
        const uploadResult = await uploadFile(file)
        
        setMedia((prev) => {
          const updated = prev.map((item) => 
            item.id === id 
              ? { ...item, url: uploadResult.url, thumbnail: uploadResult.thumbnail, isUploading: false }
              : item
          )
          onMediaChange(updated)
          return updated
        })
      } catch (error) {
        toast.error("Upload failed", { description: `Failed to upload ${file.name}.` })
        setMedia((prev) => prev.filter((item) => item.id !== id))
      }
    }
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
            Images (max 10MB) • Videos (max 50MB) • Max {maxFiles} files
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
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Media Preview */}
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
                    {item.isUploading && (
                      <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center text-white p-2">
                        <Loader2 className="w-6 h-6 animate-spin mb-1" />
                        <span className="text-[10px] font-medium">Uploading...</span>
                      </div>
                    )}
                    
                    {item.type === "image" ? (
                      <img
                        src={item.url || "/placeholder.svg"}
                        alt="Upload preview"
                        className={`w-full h-full object-cover transition-opacity ${item.isUploading ? "opacity-50" : "opacity-100"}`}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${item.isUploading ? "opacity-50" : "opacity-100"}`}>
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
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
                      className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500 transition-colors"
                      type="button"
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
