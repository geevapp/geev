"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Crown,
  Gift,
  Heart,
  Medal,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPosts, mockUsers } from "@/lib/mock-data";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppContext } from "@/contexts/app-context";
import { useState } from "react";

type FilterPeriod = "week" | "month" | "all-time";

export default function LeaderboardPage() {
  const { user } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] =
    useState<FilterPeriod>("all-time");

  // Calculate top givers (by number of giveaways created)
  const topGivers = mockUsers
    .map((u) => ({
      ...u,
      giveawayCount: mockPosts.filter(
        (p) => p.userId === u.id && p.type === "giveaway",
      ).length,
    }))
    .sort((a, b) => b.giveawayCount - a.giveawayCount)
    .slice(0, 20);

  // Get top giveaways (by entries and engagement)
  const topGiveaways = mockPosts
    .filter((p) => p.type === "giveaway")
    .sort(
      (a, b) =>
        (b.entriesCount || 0) +
        (b.likesCount || 0) -
        ((a.entriesCount || 0) + (a.likesCount || 0)),
    )
    .slice(0, 20);

  // Calculate top requestors (by number of help requests created)
  const topRequestors = mockUsers
    .map((u) => ({
      ...u,
      requestCount: mockPosts.filter(
        (p) => p.userId === u.id && p.type === "help-request",
      ).length,
    }))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, 20);

  // Get top requests (by responses and engagement)
  const topRequests = mockPosts
    .filter((p) => p.type === "help-request")
    .sort(
      (a, b) =>
        (b.entriesCount || 0) +
        (b.likesCount || 0) -
        ((a.entriesCount || 0) + (a.likesCount || 0)),
    )
    .slice(0, 20);

  // Get trending (most active in the last period)
  const trendingUsers = mockUsers
    .map((u) => ({
      ...u,
      activityScore: (u.postsCount || 0) + (u.followersCount || 0) / 100,
    }))
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 20);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <Star className="w-5 h-5 text-gray-300" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-8">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Leaderboards
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Celebrate the most active members of our community
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex gap-2">
          {(["week", "month", "all-time"] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              onClick={() => setSelectedPeriod(period)}
              className={
                selectedPeriod === period
                  ? "bg-orange-600 hover:bg-orange-700"
                  : ""
              }
            >
              {period === "week"
                ? "This Week"
                : period === "month"
                  ? "This Month"
                  : "All Time"}
            </Button>
          ))}
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <Tabs defaultValue="givers" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white dark:bg-gray-800">
            <TabsTrigger value="givers" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Top Givers</span>
            </TabsTrigger>
            <TabsTrigger value="giveaways" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Giveaways</span>
            </TabsTrigger>
            <TabsTrigger value="requestors" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Requestors</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Trending</span>
            </TabsTrigger>
          </TabsList>

          {/* Top Givers Tab */}
          <TabsContent value="givers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-600" />
                  Top Givers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topGivers.map((giver, idx) => (
                    <Link key={giver.id} href={`/profile/${giver.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getMedalIcon(idx + 1)}
                        </div>
                        <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-8">
                          #{idx + 1}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={giver.avatar || "/placeholder.svg"}
                            alt={giver.name}
                          />
                          <AvatarFallback className="bg-orange-500 text-white">
                            {giver.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                              {giver.name}
                            </p>
                            {giver.isVerified && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{giver.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-600">
                            {giver.giveawayCount}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Giveaways
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {giver.badges?.length || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Badges
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Giveaways Tab */}
          <TabsContent value="giveaways">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Trending Giveaways
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topGiveaways.map((post, idx) => {
                    const creator = mockUsers.find((u) => u.id === post.userId);
                    return (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                          <div className="flex items-center justify-center w-8 h-8 mt-1">
                            {getMedalIcon(idx + 1)}
                          </div>
                          <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-8">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors line-clamp-1">
                              {post.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {creator?.name || "Unknown"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-orange-600">
                              {post.entriesCount || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Entries
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">
                              {post.likesCount || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Likes
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Requestors Tab */}
          <TabsContent value="requestors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Top Requestors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topRequestors.map((requestor, idx) => (
                    <Link key={requestor.id} href={`/profile/${requestor.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getMedalIcon(idx + 1)}
                        </div>
                        <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-8">
                          #{idx + 1}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={requestor.avatar || "/placeholder.svg"}
                            alt={requestor.name}
                          />
                          <AvatarFallback className="bg-red-500 text-white">
                            {requestor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                              {requestor.name}
                            </p>
                            {requestor.isVerified && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{requestor.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            {requestor.requestCount}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Requests
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {requestor.badges?.length || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Badges
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Trending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topRequests.map((post, idx) => {
                    const creator = mockUsers.find((u) => u.id === post.userId);
                    return (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                          <div className="flex items-center justify-center w-8 h-8 mt-1">
                            {getMedalIcon(idx + 1)}
                          </div>
                          <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-8">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors line-clamp-1">
                              {post.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {creator?.name || "Unknown"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-600">
                              {post.entriesCount || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Responses
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">
                              {post.likesCount || 0}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Likes
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Trending Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingUsers.map((trendingUser, idx) => (
                    <Link
                      key={trendingUser.id}
                      href={`/profile/${trendingUser.id}`}
                    >
                      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getMedalIcon(idx + 1)}
                        </div>
                        <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-8">
                          #{idx + 1}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={trendingUser.avatar || "/placeholder.svg"}
                            alt={trendingUser.name}
                          />
                          <AvatarFallback className="bg-yellow-500 text-white">
                            {trendingUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                              {trendingUser.name}
                            </p>
                            {trendingUser.isVerified && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{trendingUser.username}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-600">
                            {trendingUser.postsCount}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Posts
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">
                            {(trendingUser.followersCount / 1000).toFixed(1)}K
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Followers
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
