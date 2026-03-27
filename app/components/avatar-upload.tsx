"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { MediaUpload } from "./media-upload"
import type { PostMedia } from "@/lib/types"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onSuccess?: (newUrl: string) => void
}

export function AvatarUpload({ currentAvatarUrl, onSuccess }: AvatarUploadProps) {
  const { data: session, update: updateSession } = useSession()
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  // MediaUpload fires onMediaChange once the file is uploaded to S3.
  // media[0].url is a permanent CDN URL at this point — never a blob.
  const handleMediaChange = async (media: PostMedia[]) => {
    const item = media[0]
    if (!item?.url || !session?.user?.id) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatarUrl: item.url }),
      })

      if (!res.ok) {
        const body = await res.json() as { message?: string }
        throw new Error(body.message ?? 'Failed to save avatar')
      }

      setAvatarUrl(item.url)
      setSuccess(true)

      // Refresh the NextAuth session so the avatar updates in the nav immediately
      await updateSession({ user: { ...session.user, image: item.url } })

      onSuccess?.(item.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save avatar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Current avatar preview */}
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Your avatar"
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl text-gray-400">
            👤
          </span>
        )}
      </div>

      <MediaUpload
        onMediaChange={handleMediaChange}
        maxFiles={1}
        acceptedTypes={["image/*"]}
      />

      {saving  && <p className="text-sm text-gray-500">Saving…</p>}
      {error   && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Avatar updated!</p>}
    </div>
  )
}