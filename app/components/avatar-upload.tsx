"use client";

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";

// ---------------------------------------------------------------------------
// AvatarUpload component
//
// Fix: pass the full nested { user: { image } } shape that the jwt callback
// expects so the update payload is not silently dropped.
// ---------------------------------------------------------------------------
export function AvatarUpload() {
  const { data: session, update: updateSession } = useSession();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // ── 1. Upload the file and get back a URL ─────────────────────────────
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const item: { url: string } = await uploadRes.json();

      // ── 2. Persist the new avatar URL in the database ────────────────────
      await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: item.url }),
      });

      // ── 3. Reflect the change in the live session without a full reload ───
      //
      // FIX (issue #345):
      //   Previously this called updateSession({ user: { ...session.user, image: item.url } })
      //   which spread fields like `id`, `walletAddress`, etc. at the top level
      //   of the payload.  The jwt callback only read `session.user.*`, so those
      //   extra top-level keys were ignored and `token.picture` was never updated.
      //
      //   The corrected call wraps the update inside `{ user: { image } }` so the
      //   jwt callback's `trigger === "update"` branch can read `session.user.image`
      //   and write it to `token.picture`, which the session callback then maps to
      //   `session.user.image` for all downstream consumers (e.g. the nav avatar).
      await updateSession({ user: { image: item.url } });
    } catch (err) {
      console.error("Avatar upload error:", err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Current avatar preview */}
      {session?.user?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt={session.user.name ?? "Avatar"}
          className="h-20 w-20 rounded-full object-cover"
        />
      )}

      <label
        htmlFor="avatar-upload"
        className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        aria-busy={uploading}
      >
        {uploading ? "Uploading…" : "Change avatar"}
        <input
          ref={inputRef}
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}