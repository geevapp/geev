import { Suspense } from "react";
import type { Metadata } from "next";
import { PostCardSkeleton } from "@/components/skeletons/post-card-skeleton";
import { CommentSkeleton } from "@/components/skeletons/comment-skeleton";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { postId } = await params;
  return {
    title: `Post ${postId} | Geev`,
    description: "View post details",
  };
}

async function PostDetailContent({ params }: PageProps) {
  const { postId } = await params;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Post Detail</h1>
      <p className="text-muted-foreground mb-4">Post ID: {postId}</p>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Post content will be implemented here
        </p>
      </div>
    </div>
  );
}

function PostDetailLoadingFallback() {
  return (
    <div className="container py-8">
      <div className="h-10 bg-muted rounded w-48 mb-6 animate-pulse" />
      <div className="space-y-4">
        <PostCardSkeleton />
        <div className="bg-card border rounded-lg p-4">
          <div className="h-5 bg-muted rounded w-32 mb-4 animate-pulse" />
          <div className="space-y-2">
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<PostDetailLoadingFallback />}>
      <PostDetailContent params={params} />
    </Suspense>
  );
}
