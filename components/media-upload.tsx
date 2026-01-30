import React, { useCallback, useEffect, useState } from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import imageCompression from "browser-image-compression"
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface FileWithPreview extends File {
  preview: string
}

interface MediaUploadProps {
  onChange?: (files: FileWithPreview[]) => void
  initialFiles?: FileWithPreview[]
  maxFiles?: number
  maxSize?: number // in MB
  className?: string
}

export function MediaUpload({
  onChange,
  initialFiles = [],
  maxFiles = 10,
  maxSize = 10,
  className,
}: MediaUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(initialFiles)
  const [isCompressing, setIsCompressing] = useState(false)

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview))
  }, [files])

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Handle errors
      if (fileRejections.length > 0) {
        fileRejections.forEach(({ file, errors }) => {
          errors.forEach((e) => {
            if (e.code === "file-too-large") {
              toast.error(`File ${file.name} is too large. Max size is ${maxSize}MB`)
            } else if (e.code === "file-invalid-type") {
              toast.error(`File ${file.name} has invalid type. Supported: JPEG, PNG, GIF, WebP`)
            } else {
              toast.error(`Error with file ${file.name}: ${e.message}`)
            }
          })
        })
      }

      if (acceptedFiles.length === 0) return

      // Check remaining slots
      const remainingSlots = maxFiles - files.length
      if (acceptedFiles.length > remainingSlots) {
        toast.error(`You can only upload ${maxFiles} files in total`)
        return
      }

      const filesToProcess = acceptedFiles.slice(0, remainingSlots)
      setIsCompressing(true)

      try {
        const processedFiles = await Promise.all(
          filesToProcess.map(async (file) => {
            const options = {
              maxSizeMB: 1, // Target smaller size for web (maybe configurable?)
              maxWidthOrHeight: 1200,
              useWebWorker: true,
              fileType: file.type, // Maintain original type
            }

            try {
              // Only compress if it's an image
              let compressedFile = file
              if (file.type.startsWith("image/")) {
                compressedFile = await imageCompression(file, options)
              }
              
              const fileWithPreview = Object.assign(compressedFile, {
                preview: URL.createObjectURL(compressedFile),
              }) as FileWithPreview
              
              return fileWithPreview
            } catch (error) {
              console.error("Compression error:", error)
              toast.error(`Failed to process ${file.name}`)
              // Fallback to original file with preview if compression fails
              return Object.assign(file, {
                preview: URL.createObjectURL(file),
              }) as FileWithPreview
            }
          })
        )

        const newFiles = [...files, ...processedFiles]
        setFiles(newFiles)
        onChange?.(newFiles)
      } catch (error) {
        console.error("Processing error:", error)
        toast.error("An error occurred while processing files")
      } finally {
        setIsCompressing(false)
      }
    },
    [files, maxFiles, maxSize, onChange]
  )

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove)
    setFiles(newFiles)
    onChange?.(newFiles)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/gif": [],
      "image/webp": [],
    },
    maxSize: maxSize * 1024 * 1024,
    maxFiles: maxFiles,
    disabled: isCompressing || files.length >= maxFiles,
  })

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[160px] rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted/80 cursor-pointer",
          isDragActive && "border-primary bg-primary/5 ring-4 ring-primary/20",
          (isCompressing || files.length >= maxFiles) && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
          {isCompressing ? (
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Processing images...</p>
             </div>
          ) : (
            <>
              <div className="p-3 bg-background rounded-full shadow-sm">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {isDragActive ? "Drop the files here" : "Click or drag images to upload"}
                </p>
                <p className="text-xs text-muted-foreground">
                    Max {maxFiles} images. Up to {maxSize}MB each.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <Card key={index + file.name} className="relative group overflow-hidden border-none shadow-sm aspect-square bg-muted">
              <img
                src={file.preview}
                alt={file.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onLoad={() => {
                  // URL.revokeObjectURL(file.preview)
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove file</span>
              </Button>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <span className="text-[10px] text-white font-medium bg-black/50 px-1.5 py-0.5 rounded truncate max-w-[80%]">
                    {(file.size / 1024).toFixed(0)}KB
                 </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
