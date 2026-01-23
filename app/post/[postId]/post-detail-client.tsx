"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Edit, Share2 } from "lucide-react";

import { useAppContext } from "@/contexts/app-context";
import { MediaCarousel } from "@/components/media-carousel";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PostDetailClient({ postId }: { postId: string }) {
  const { posts, user, incrementShare } = useAppContext();

  const post = posts.find((p) => p.id === postId);
  if (!post) notFound();

  const creator = post.author;
  if (!creator) notFound();

  const isCreator = user?.id === creator.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <img src={creator.avatar} alt={creator.name} />
          </Avatar>

          <div>
            <Link href={`/profile/${creator.id}`}>
              <h2 className="text-xl font-bold hover:underline">
                {creator.name}
              </h2>
            </Link>
            <p className="text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isCreator && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => incrementShare(post.id)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Media (only if your Post actually has media) */}
      {"media" in post && post.media?.length > 0 && (
        <MediaCarousel images={post.media} />
      )}

      {/* Content */}
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary">
            {post.type === "giveaway" ? "Giveaway" : "Help Request"}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        <p className="text-lg whitespace-pre-wrap leading-relaxed">
          {post.description}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Entries" value={post.entriesCount} />
        <Stat label="Likes" value={post.likesCount} />
        <Stat label="Burns" value={post.burnCount} />
        <Stat label="Shared" value={post.shareCount} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center p-4 border rounded">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
