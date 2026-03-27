'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { MediaUpload, type UploadedMedia } from './media-upload';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onSuccess?: (newUrl: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, onSuccess }: AvatarUploadProps) {
  const { data: session, update: updateSession } = useSession();
  const [avatarUrl, setAvatarUrl]   = useState(currentAvatarUrl ?? null);
  const [saving,    setSaving]      = useState(false);
  const [error,     setError]       = useState<string | null>(null);
  const [success,   setSuccess]     = useState(false);

  const handleUpload = async (media: UploadedMedia) => {
    if (!session?.user?.id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avatarUrl: media.url }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? 'Failed to save avatar');
      }

      setAvatarUrl(media.url);
      setSuccess(true);

      // Update the NextAuth session so the avatar updates in the nav
      await updateSession({ user: { ...session.user, image: media.url } });

      onSuccess?.(media.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save avatar');
    } finally {
      setSaving(false);
    }
  };

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
        folder="avatars"
        accept="image"
        onUpload={handleUpload}
        onError={setError}
      >
        <button
          type="button"
          disabled={saving}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Change Avatar'}
        </button>
      </MediaUpload>

      {error   && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Avatar updated!</p>}
    </div>
  );
}