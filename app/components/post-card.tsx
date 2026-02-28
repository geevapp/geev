"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Flame,
  Gift,
  Play,
  Share2,
  Target,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/comments-section";
import { ContributionForm } from "@/components/contribution-form";
import { EntryForm } from "@/components/entry-form";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import type React from "react";
import { UserRankBadge } from "@/components/user-rank-badge";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { burnPost, user } = useAppContext();
  const router = useRouter();
  const [showStats, setShowStats] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [isBurned, setIsBurned] = useState(false);

  const handleAuthRequiredAction = (action: () => void) => {
    if (!user) {
      router.push("/login");
      return;
    }
    action();
  };

  const handleBurn = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAuthRequiredAction(() => {
      if (!isBurned) {
        burnPost(post.id);
        setIsBurned(true);
      }
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/post/${post.id}`,
      );
    }
  };

  const handleCommentsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleStatsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStats(!showStats);
  };

  const handleCardClick = () => {
    router.push(`/post/${post.id}`);
  };

  const handleInteractiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800";
      case "expired":
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getProgressPercentage = () => {
    if (
      post.type === "help-request" &&
      post.targetAmount &&
      post.currentAmount
    ) {
      return Math.min((post.currentAmount / post.targetAmount) * 100, 100);
    }
    return 0;
  };

  const canInteract = user && user.id !== post.userId;

  const handleMediaClick = (e: React.MouseEvent, media: any) => {
    e.stopPropagation();
    if (media.type !== "video") {
      router.push(`/post/${post.id}`);
    }
  };

  return (
    <>
      <Card
        className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div
              className="flex items-center gap-3"
              onClick={handleInteractiveClick}
            >
              <Link href={`/profile/${post.author.id}`}>
                <Avatar className="w-10 h-10 cursor-pointer">
                  <AvatarImage
                    src={post.author.avatar || "/placeholder.svg"}
                    alt={post.author.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    {post.author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${post.author.id}`}
                    className="font-medium text-gray-900 dark:text-gray-100"
                  >
                    {post.author.name}
                  </Link>
                  <UserRankBadge rank={post.author.rank} showLevel={false} />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>@{post.author.username}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>{post.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${getStatusColor(
                  post.status,
                )} text-xs font-medium border`}
              >
                {post.status}
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              >
                {post.type === "giveaway" ? (
                  <Gift className="w-3 h-3" />
                ) : (
                  <Target className="w-3 h-3" />
                )}
                {post.type === "giveaway" ? "Giveaway" : "Help Request"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              {post.title}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {post.description}
            </p>
          </div>

          {post.media && post.media.length > 0 && (
            <div className="space-y-3" onClick={handleInteractiveClick}>
              {post.media.length === 1 ? (
                <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {post.media[0].type === "image" ? (
                    <img
                      src={post.media[0].url || "/placeholder.svg"}
                      alt="Post media"
                      className="w-full aspect-square object-cover cursor-pointer"
                      onClick={(e) => handleMediaClick(e, post.media![0])}
                    />
                  ) : (
                    <div className="relative aspect-square">
                      <video
                        src={post.media[0].url}
                        controls
                        className="w-full h-full object-cover"
                        poster={post.media[0].thumbnail}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {post.media.slice(0, 4).map((media, index) => (
                    <div
                      key={media.id}
                      className="relative rounded-lg overflow-hidden aspect-square bg-gray-100 dark:bg-gray-800"
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.url || "/placeholder.svg"}
                          alt={`Post media ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={(e) => handleMediaClick(e, media)}
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            poster={media.thumbnail}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                            <Play className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      )}
                      {index === 3 && (post.media?.length ?? 0) > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-medium">
                            +{(post.media?.length ?? 0) - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Giveaway Details */}
          {post.type === "giveaway" && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-4 space-y-3 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Prize: {post.prizeAmount} {post.currency}
                  </span>
                </div>
                {post.endDate && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    Ends {post.endDate.toLocaleDateString()}
                  </div>
                )}
              </div>

              {post.entryRequirements && (
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Requirements:
                  </p>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {post.entryRequirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {post.status === "active" && (
                <Button
                  onClick={(e) => {
                    handleInteractiveClick(e);
                    handleAuthRequiredAction(() => setShowEntryForm(true));
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm"
                >
                  {user
                    ? canInteract
                      ? "Enter Giveaway"
                      : "Your Giveaway"
                    : "Sign in to Enter"}
                </Button>
              )}
            </div>
          )}

          {/* Help Request Details */}
          {post.type === "help-request" && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-4 space-y-3 border border-green-100 dark:border-green-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Goal: ${post.targetAmount} {post.currency}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ${post.currentAmount} raised
                </span>
              </div>

              <div className="space-y-2">
                <Progress
                  value={getProgressPercentage()}
                  className="h-2 bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{getProgressPercentage().toFixed(1)}% funded</span>
                  <span>{post.contributions?.length || 0} contributors</span>
                </div>
              </div>

              {post.status === "active" &&
                (post.currentAmount || 0) < (post.targetAmount || 0) && (
                  <Button
                    onClick={(e) => {
                      handleInteractiveClick(e);
                      handleAuthRequiredAction(() =>
                        setShowContributionForm(true),
                      );
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-sm"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {user
                      ? canInteract
                        ? "Contribute"
                        : "Your Request"
                      : "Sign in to Contribute"}
                  </Button>
                )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBurn}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isBurned
                    ? "text-red-600 bg-red-50 dark:bg-red-950/20"
                    : "text-gray-500"
                }`}
              >
                <Flame
                  className={`w-4 h-4 ${isBurned ? "fill-current" : ""}`}
                />
                <span className="text-sm font-medium">
                  {post.burnCount + (isBurned ? 1 : 0)}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">{post.shareCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentsClick}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  showComments
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                    : "text-gray-500"
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{post.commentCount}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleStatsClick}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-500"
            >
              <span className="text-sm">Stats</span>
              {showStats ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {showComments && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <CommentsSection post={post} maxComments={3} />
            </div>
          )}

          {showStats && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-4 space-y-4 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">
                    {post.entries?.length || 0} entries
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    Created {post.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>

              {post.type === "giveaway" && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Selection:</span>{" "}
                      {post.selectionType}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Winners:</span>{" "}
                      {post.winnerCount}
                    </div>
                  </div>
                  {post.proofRequired && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Proof required</span> for
                      entry
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Form Modal */}
      {post.type === "giveaway" && (
        <EntryForm
          open={showEntryForm}
          onOpenChange={setShowEntryForm}
          post={post}
        />
      )}

      {/* Contribution Form Modal */}
      {post.type === "help-request" && (
        <ContributionForm
          open={showContributionForm}
          onOpenChange={setShowContributionForm}
          post={post}
        />
      )}
    </>
  );
}
