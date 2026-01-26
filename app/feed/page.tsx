"use client";

import { AuthNavbar } from "@/components/auth-navbar";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard, PostCardSkeleton } from "@/components/post-card";

// export const metadata: Metadata = {
//   title: 'Feed | Geev',
//   description: 'Browse giveaways and help requests',
// };

import { useAuth } from '@/hooks/use-auth'
import { AuthNavbar } from '@/components/auth-navbar'
import { useApp } from '@/contexts/app-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle2, Gift, Heart, MessageCircle, Share2, Flame } from 'lucide-react'

/**
 * Feed Page
 *
 * Main feed for authenticated users showing giveaways and help requests.
 * Protected route - redirects to login if not authenticated.
 */
export default function FeedPage() {
  const { user, posts, isHydrated } = useApp();

  // Show loading state while hydrating user from session
  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#101828]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF6900] border-t-transparent" />
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
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
        <AuthNavbar />

        <main className="container max-w-3xl mx-auto px-4 py-6">
          {/* Welcome Banner */}
          <Card className="mb-6 bg-linear-to-r from-[#FF6900] to-[#FF8533] text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-white/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-white/20 text-white text-xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
                  <p className="text-orange-100">
                    {user.rank.title} • {user.followersCount.toLocaleString()} followers
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1E2939]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-[#364153] dark:text-[#F3F4F6]">
                          {getInitials(post.author.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 dark:text-[#F3F4F6]">
                            {post.author.name}
                          </span>
                          {post.author.isVerified && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-[#99A1AF]">@{post.author.username}</p>
                      </div>
                    </div>
                    <Badge
                      variant={post.type === 'giveaway' ? 'default' : 'secondary'}
                      className={
                        post.type === 'giveaway'
                          ? 'bg-orange-100 text-orange-700 dark:bg-[#364153] dark:text-[#99A1AF] dark:border dark:border-[#364153]'
                          : 'bg-blue-100 text-blue-700 dark:bg-[#364153] dark:text-[#99A1AF] dark:border dark:border-[#364153]'
                      }
                    >
                      {post.type === 'giveaway' ? (
                        <>
                          <Gift className="h-3 w-3 mr-1" />
                          Giveaway
                        </>
                      ) : (
                        <>
                          <Heart className="h-3 w-3 mr-1" />
                          Help Request
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F3F4F6] mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 dark:text-[#D1D5DC] text-sm line-clamp-3 mb-4">
                    {post.description}
                  </p>

                  {/* Post Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1E2939]">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => burnPost(post.id)}
                        className="text-gray-500 dark:text-[#6A7282] hover:text-[#FF6900] dark:hover:text-[#FF6900]"
                      >
                        <Flame className="h-4 w-4 mr-1" />
                        {post.burnCount}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 dark:text-[#6A7282]">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.commentCount}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 dark:text-[#6A7282]">
                        <Share2 className="h-4 w-4 mr-1" />
                        {post.shareCount}
                      </Button>
                    </div>
                    {post.type === 'giveaway' ? (
                      <span className="text-sm font-medium text-[#FF6900]">
                        {post.prizeAmount} {post.currency}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-[#99A1AF]">
                        ${post.currentAmount?.toLocaleString()} / ${post.targetAmount?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
