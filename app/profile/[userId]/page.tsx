import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileCardSkeleton } from "@/components/skeletons/profile-card-skeleton";
import { PostCardSkeleton } from "@/components/skeletons/post-card-skeleton";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: `Profile ${userId} | Geev`,
    description: "View user profile",
  };
}

async function ProfileContent({ params }: PageProps) {
  const { userId } = await params;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <p className="text-muted-foreground mb-4">User ID: {userId}</p>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Profile content will be implemented here
        </p>
      </div>
    </div>
  );
}

function ProfileLoadingFallback() {
  return (
    <div className="container py-8">
      <div className="h-10 bg-muted rounded w-48 mb-6 animate-pulse" />
      <div className="space-y-4">
        <ProfileCardSkeleton />
        <div className="h-5 bg-muted rounded w-32 mb-4 animate-pulse" />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}

export default function ProfilePage({ params }: PageProps) {
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      <ProfileContent params={params} />
    </Suspense>
  );
}
