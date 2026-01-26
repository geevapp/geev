"use client";

import { use, useMemo } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { AuthNavbar } from "@/components/auth-navbar";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/profile/stat-card";
import { RankBadge } from "@/components/profile/rank-badge";
import { PostCard } from "@/components/profile/post-card";
import { EntryCard } from "@/components/profile/entry-card";
import {
  CheckCircle2,
  Calendar,
  Settings,
  Gift,
  FileText,
  UserX,
  Inbox,
} from "lucide-react";

interface PageProps {
  params: Promise<{ userId: string }>;
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format a date to a readable month/year string
 */
function formatJoinDate(date: Date | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/**
 * EmptyState Component
 *
 * Displays when there's no content to show.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-gray-100 dark:bg-[#1E2939] p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-500 dark:text-[#99A1AF]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F3F4F6] mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-[#99A1AF] max-w-md">
        {description}
      </p>
    </div>
  );
}

/**
 * UserNotFound Component
 *
 * Displays when the requested user doesn't exist.
 */
function UserNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center p-8">
        <div className="rounded-full bg-gray-100 dark:bg-[#1E2939] p-6 mb-6">
          <UserX className="h-12 w-12 text-gray-500 dark:text-[#99A1AF]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F3F4F6] mb-2">
          User Not Found
        </h1>
        <p className="text-gray-500 dark:text-[#99A1AF] mb-6 max-w-md">
          The user you're looking for doesn't exist or may have been removed.
        </p>
        <Link href="/feed">
          <Button className="bg-[#FF6900] hover:bg-[#FF6900]/90 text-white">
            Back to Feed
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Profile Page
 *
 * Displays a user's profile including:
 * - Profile header with avatar, name, bio, and rank
 * - Stats section (followers, following, gives, takes, badges)
 * - Tabbed content (Posts, Gives/Giveaways, Takes/Entries)
 */
export default function ProfilePage({ params }: PageProps) {
  const { userId } = use(params);
  const { user: currentUser, users, posts } = useApp();

  // Find the profile user
  const profileUser = useMemo(() => {
    return users.find((u) => u.id === userId);
  }, [users, userId]);

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === userId;

  // Get user's posts (giveaways and help requests they created)
  const userPosts = useMemo(() => {
    return posts.filter((p) => p.authorId === userId || p.author.id === userId);
  }, [posts, userId]);

  // Get user's giveaways (posts with type 'giveaway')
  const userGiveaways = useMemo(() => {
    return userPosts.filter((p) => p.type === "giveaway");
  }, [userPosts]);

  // Get user's entries (submissions to other posts)
  // Entries are stored within posts, so we need to aggregate them
  const userEntries = useMemo(() => {
    const allEntries = posts.flatMap((p) => p.entries || []);
    // Get top-level entries only (not replies) for this user
    return allEntries.filter((e) => e.userId === userId && !e.parentId);
  }, [posts, userId]);

  // If user not found, show error state (AuthGuard ensures we're hydrated)
  if (!profileUser) {
    return (
      <AuthGuard>
        <AuthNavbar />
        <UserNotFound />
      </AuthGuard>
    );
  }

  // Calculate stats
  const stats = {
    followers: profileUser.followersCount,
    following: profileUser.followingCount,
    gives: userGiveaways.length,
    takes: userEntries.length,
    badges: profileUser.badges.length,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-[#101828]">
        <AuthNavbar />

        <main className="container max-w-2xl mx-auto px-4 py-6">
          {/* Profile Card */}
          <Card className="bg-white dark:bg-[#101828] border-gray-200 dark:border-[#1E2939] shadow-sm rounded-[14px] mb-6 overflow-hidden">
            <CardContent className="p-6 md:p-12 relative">
              {/* Avatar - Centered at top */}
              <div className="flex flex-col items-center">
                {/* Large Avatar */}
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                    <AvatarImage
                      src={profileUser.avatar}
                      alt={profileUser.name}
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="bg-orange-100 dark:bg-[#364153] text-orange-700 dark:text-[#F3F4F6] text-2xl">
                      {getInitials(profileUser.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Name, Verified Badge, and Settings */}
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[22px] font-bold text-gray-900 dark:text-[#FAFAFA]">
                    {profileUser.name}
                  </h1>
                  {profileUser.isVerified && (
                    <Badge className="bg-blue-600 dark:bg-[#073EB8] text-white dark:text-[#BEDBFF] text-[8px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {isOwnProfile && (
                    <Link href="/settings">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full border border-gray-400 dark:border-[#99A1AF] p-0"
                      >
                        <Settings className="h-3 w-3 text-gray-700 dark:text-[#FAFAFA]" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Username */}
                <p className="text-[15px] text-gray-500 dark:text-[#99A1AF] mb-2">
                  @{profileUser.username}
                </p>

                {/* Rank Badge */}
                <RankBadge rank={profileUser.rank} size="md" className="mb-4" />

                {/* Bio */}
                {profileUser.bio && (
                  <p className="text-[15px] text-gray-600 dark:text-[#D1D5DC] text-center max-w-md mb-4 leading-relaxed">
                    {profileUser.bio}
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-8 mb-4">
                  <StatCard label="Followers" value={stats.followers} />
                  <StatCard label="Following" value={stats.following} />
                  <StatCard label="Gives" value={stats.gives} />
                  <StatCard label="Takes" value={stats.takes} />
                  <StatCard label="Badges" value={stats.badges} />
                </div>

                {/* Joined Date */}
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#99A1AF] mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatJoinDate(profileUser.joinedAt)}</span>
                </div>

                {/* Follow Button (for other users) */}
                {!isOwnProfile && (
                  <Button className="bg-gray-200 dark:bg-[#E5E5E5] hover:bg-gray-300 dark:hover:bg-[#D5D5D5] text-gray-900 dark:text-[#171717] font-medium px-4 py-2 rounded-lg">
                    Follow
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <div className="space-y-2">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full bg-gray-100 dark:bg-[#262626] rounded-[10px] p-[3px] h-auto">
                <TabsTrigger
                  value="posts"
                  className="flex-1 rounded-lg py-1 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[rgba(255,255,255,0.045)] data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#FAFAFA] data-[state=active]:border data-[state=active]:border-gray-200 dark:data-[state=active]:border-[rgba(255,255,255,0.15)] data-[state=active]:shadow-sm text-gray-500 dark:text-[#A1A1A1]"
                >
                  Posts ({userPosts.length})
                </TabsTrigger>
                <TabsTrigger
                  value="gives"
                  className="flex-1 rounded-lg py-1 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[rgba(255,255,255,0.045)] data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#FAFAFA] data-[state=active]:border data-[state=active]:border-gray-200 dark:data-[state=active]:border-[rgba(255,255,255,0.15)] data-[state=active]:shadow-sm text-gray-500 dark:text-[#A1A1A1]"
                >
                  Gives ({userGiveaways.length})
                </TabsTrigger>
                <TabsTrigger
                  value="takes"
                  className="flex-1 rounded-lg py-1 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[rgba(255,255,255,0.045)] data-[state=active]:text-gray-900 dark:data-[state=active]:text-[#FAFAFA] data-[state=active]:border data-[state=active]:border-gray-200 dark:data-[state=active]:border-[rgba(255,255,255,0.15)] data-[state=active]:shadow-sm text-gray-500 dark:text-[#A1A1A1]"
                >
                  Takes ({userEntries.length})
                </TabsTrigger>
              </TabsList>

              {/* Posts Tab Content */}
              <TabsContent value="posts" className="mt-4 space-y-4">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <PostCard key={post.id} post={post} showAuthor={true} />
                  ))
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No posts yet"
                    description={
                      isOwnProfile
                        ? "You haven't created any posts yet. Create your first giveaway or help request!"
                        : "This user hasn't created any posts yet."
                    }
                  />
                )}
              </TabsContent>

              {/* Gives Tab Content */}
              <TabsContent value="gives" className="mt-4 space-y-4">
                {userGiveaways.length > 0 ? (
                  userGiveaways.map((post) => (
                    <PostCard key={post.id} post={post} showAuthor={true} />
                  ))
                ) : (
                  <EmptyState
                    icon={Gift}
                    title="No giveaways yet"
                    description={
                      isOwnProfile
                        ? "You haven't created any giveaways yet. Start giving back to the community!"
                        : "This user hasn't created any giveaways yet."
                    }
                  />
                )}
              </TabsContent>

              {/* Takes Tab Content */}
              <TabsContent value="takes" className="mt-4 space-y-4">
                {userEntries.length > 0 ? (
                  userEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} showUser={false} />
                  ))
                ) : (
                  <EmptyState
                    icon={Inbox}
                    title="No entries yet"
                    description={
                      isOwnProfile
                        ? "You haven't entered any giveaways yet. Explore the feed and find something exciting!"
                        : "This user hasn't entered any giveaways yet."
                    }
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
