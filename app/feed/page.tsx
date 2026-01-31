"use client";

import { useState, useMemo } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AuthNavbar } from "@/components/auth-navbar";
import { useApp } from "@/contexts/app-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/post-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["All", "Electronics", "Food", "Services", "Other"];

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
 * Feed Page
 *
 * Main feed for authenticated users showing giveaways and help requests.
 * Protected route - redirects to login if not authenticated..
 */
export default function FeedPage() {
  const { user, posts, isHydrated } = useApp();
  const [activeTab, setActiveTab] = useState<"all" | "giveaways" | "help" | "active">("all");
  const [sortBy, setSortBy] = useState<"recent" | "trending">("recent");
  const [category, setCategory] = useState("All");

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    // Filter by tab
    let filtered = posts;
    if (activeTab === "giveaways") {
      filtered = posts.filter((p) => p.type === "giveaway");
    } else if (activeTab === "help") {
      filtered = posts.filter((p) => p.type === "help-request");
    } else if (activeTab === "active") {
      filtered = posts.filter((p) => p.status === "active");
    }

    // Filter by category
    if (category !== "All") {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Sort by selected method
    if (sortBy === "recent") {
      return filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // Trending: sort by engagement (entries count)
      return filtered.sort((a, b) => {
        const scoreA = (a.entries?.length || 0);
        const scoreB = (b.entries?.length || 0);
        return scoreB - scoreA;
      });
    }
  }, [posts, activeTab, sortBy, category]);

  // Show loading state while hydrating user from session
  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Get counts for tabs
  const allCount = posts.length;
  const giveawaysCount = posts.filter((p) => p.type === "giveaway").length;
  const helpCount = posts.filter((p) => p.type === "help-request").length;
  const activeCount = posts.filter((p) => p.status === "active").length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <AuthNavbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <aside className="col-span-3 space-y-6">
              {/* User Profile Card */}
              <Card className="bg-[#1a1a24] border-[#2a2a34] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-orange-500/20">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-orange-500/10 text-orange-500">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{user.name}</h3>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                    
                    <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20">
                      {user.rank.title}
                    </Badge>

                    <div className="pt-4 border-t border-[#2a2a34]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Wallet Balance</span>
                        <span className="font-semibold text-orange-500">
                          ${user.walletBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <Card className="bg-[#1a1a24] border-[#2a2a34]">
                <CardContent className="p-4 space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-[#2a2a34]"
                  >
                    <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Feed
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-400 hover:bg-[#2a2a34] hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Activity
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-400 hover:bg-[#2a2a34] hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Leaderboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-400 hover:bg-[#2a2a34] hover:text-white"
                  >
                    <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Create Post Button */}
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Post
              </Button>

              {/* Stats */}
              <Card className="bg-[#1a1a24] border-[#2a2a34]">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">YOUR STATS</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Posts</span>
                      <span className="font-semibold text-white">45</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Followers</span>
                      <span className="font-semibold text-white">{user.followersCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Badges</span>
                      <span className="font-semibold text-white">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Feed */}
            <div className="col-span-9 space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 bg-[#1a1a24] p-1 rounded-lg border border-[#2a2a34]">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "all"
                      ? "bg-[#2a2a34] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  All ({allCount})
                </button>
                <button
                  onClick={() => setActiveTab("giveaways")}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "giveaways"
                      ? "bg-[#2a2a34] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Giveaways ({giveawaysCount})
                </button>
                <button
                  onClick={() => setActiveTab("help")}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "help"
                      ? "bg-[#2a2a34] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Help Requests ({helpCount})
                </button>
                <button
                  onClick={() => setActiveTab("active")}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "active"
                      ? "bg-[#2a2a34] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Active ({activeCount})
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Badge
                    key={cat}
                    variant={category === cat ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      category === cat
                        ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                        : "bg-transparent text-gray-400 border-[#2a2a34] hover:border-orange-500/50 hover:text-orange-500"
                    }`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>

              {/* Posts */}
              <div className="space-y-4">
                {filteredAndSortedPosts.length === 0 ? (
                  <Card className="bg-[#1a1a24] border-[#2a2a34]">
                    <CardContent className="p-12 text-center">
                      <div className="max-w-sm mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-white">No posts found</h3>
                        <p className="text-gray-400 text-sm">
                          {category === "All"
                            ? "No posts yet. Be the first to create one!"
                            : `No posts in the ${category} category.`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAndSortedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}