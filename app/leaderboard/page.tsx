import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileCardSkeleton } from "@/components/skeletons/profile-card-skeleton";

export const metadata: Metadata = {
  title: "Leaderboard | Geev",
  description: "Top contributors and community leaders",
};

function LeaderboardContent() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <p className="text-muted-foreground mb-8">
        See the top contributors in the Geev community
      </p>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          Leaderboard rankings will be implemented here
        </p>
      </div>
    </div>
  );
}

function LeaderboardLoadingFallback() {
  return (
    <div className="container py-8">
      <div className="h-10 bg-muted rounded w-48 mb-6 animate-pulse" />
      <div className="h-4 bg-muted rounded w-64 mb-8 animate-pulse" />
      <div className="space-y-4">
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardLoadingFallback />}>
      <LeaderboardContent />
    </Suspense>
  );
}
