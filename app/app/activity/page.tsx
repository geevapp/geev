"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  DollarSign,
  Gift,
  Heart,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AuthGuard } from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { UserRankBadge } from "@/components/user-rank-badge";
import { useAppContext } from "@/contexts/app-context";

export default function ActivityPage() {
  const { posts, entries, contributions, user } = useAppContext();

  // Get user's activities
  const userPosts = posts.filter((post) => post.userId === user?.id);
  const userEntries = entries.filter((entry) => entry.userId === user?.id);
  const userContributions = contributions.filter(
    (contribution) => contribution.userId === user?.id,
  );

  // Get recent activities from all users
  const recentActivities = [
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      type: "post" as const,
      user: post.author,
      post,
      timestamp: post.createdAt,
    })),
    ...entries.map((entry) => ({
      id: `entry-${entry.id}`,
      type: "entry" as const,
      user: entry.user,
      entry,
      post: posts.find((p) => p.id === entry.postId),
      timestamp: entry.submittedAt,
    })),
    ...contributions.map((contribution) => ({
      id: `contribution-${contribution.id}`,
      type: "contribution" as const,
      user: contribution.user,
      contribution,
      post: posts.find((p) => p.id === contribution.postId),
      timestamp: contribution.contributedAt,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const ActivityItem = ({
    activity,
  }: {
    activity: (typeof recentActivities)[0];
  }) => (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${activity.user.id}`}>
            <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all">
              <AvatarImage
                src={activity.user.avatar || "/placeholder.svg"}
                alt={activity.user.name}
              />
              <AvatarFallback>
                {activity.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${activity.user.id}`}
                className="font-semibold hover:text-gray-600 transition-colors"
              >
                {activity.user.name}
              </Link>
              <UserRankBadge rank={activity.user.rank} showLevel={false} />
            </div>

            <div className="flex items-center gap-2 text-sm">
              {activity.type === "post" && (
                <>
                  {activity.post?.type === "giveaway" ? (
                    <Gift className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Heart className="w-4 h-4 text-gray-500" />
                  )}
                  <span>
                    Created a{" "}
                    {activity.post?.type === "giveaway"
                      ? "giveaway"
                      : "help request"}
                    :{" "}
                    <span className="font-medium">{activity.post?.title}</span>
                  </span>
                </>
              )}

              {activity.type === "entry" && (
                <>
                  <Trophy className="w-4 h-4 text-gray-500" />
                  <span>
                    Entered giveaway:{" "}
                    <span className="font-medium">{activity.post?.title}</span>
                  </span>
                </>
              )}

              {activity.type === "contribution" && (
                <>
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>
                    Contributed ${activity.contribution?.amount.toFixed(2)} to:{" "}
                    <span className="font-medium">{activity.post?.title}</span>
                  </span>
                </>
              )}
            </div>

            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {activity.timestamp.toLocaleDateString()} at{" "}
              {activity.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-gray-600" />
          <h1 className="text-3xl font-bold">Activity</h1>
        </div>

        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="posts">
              My Posts ({userPosts.length})
            </TabsTrigger>
            <TabsTrigger value="entries">
              My Entries ({userEntries.length})
            </TabsTrigger>
            <TabsTrigger value="contributions">
              My Contributions ({userContributions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Community Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities
                    .slice(0, 20)
                    .map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No activity yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Be the first to create some activity!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Your Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {post.type === "giveaway" ? (
                              <Gift className="w-5 h-5 text-gray-500" />
                            ) : (
                              <Heart className="w-5 h-5 text-gray-500" />
                            )}
                            <div>
                              <h3 className="font-semibold">{post.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {post.type === "giveaway"
                                  ? "Giveaway"
                                  : "Help Request"}{" "}
                                • {post.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={
                              post.status === "active"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {post.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Create your first giveaway or help request!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries" className="space-y-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Your Entries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userEntries.length > 0 ? (
                  userEntries.map((entry) => {
                    const post = posts.find((p) => p.id === entry.postId);
                    return (
                      <Card
                        key={entry.id}
                        className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Trophy className="w-5 h-5 text-gray-500" />
                              <div>
                                <h3 className="font-semibold">{post?.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Entered{" "}
                                  {entry.submittedAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {entry.isWinner && (
                              <Badge className="bg-gray-100 text-gray-700">
                                Winner!
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No entries yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Enter some giveaways to see them here!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle>Your Contributions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userContributions.length > 0 ? (
                  userContributions.map((contribution) => {
                    const post = posts.find(
                      (p) => p.id === contribution.postId,
                    );
                    return (
                      <Card
                        key={contribution.id}
                        className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-5 h-5 text-gray-500" />
                              <div>
                                <h3 className="font-semibold">{post?.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Contributed{" "}
                                  {contribution.contributedAt.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-gray-100 text-gray-700">
                              ${contribution.amount.toFixed(2)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No contributions yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Help others by contributing to their requests!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
