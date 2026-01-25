"use client";

import { AuthNavbar } from "@/components/auth-navbar";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard, PostCardSkeleton } from "@/components/post-card";

export default function FeedPage() {
  const { user, posts, isHydrated } = useApp();

  // Show loading state while hydrating user from session
  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AuthNavbar />

      <main className="container max-w-3xl mx-auto px-4 py-6">
        <Card className="mb-6 bg-linear-to-r from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white/20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-white/20 text-white text-xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {user.name.split(" ")[0]}!
                </h1>
                <p className="text-orange-100">
                  {user.rank.title} • {user.followersCount.toLocaleString()}{" "}
                  followers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No posts yet. Be the first to create one!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>
    </div>
  );
}
