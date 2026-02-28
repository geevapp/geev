"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExternalLink,
  Flame,
  ImageIcon,
  Send,
  Trophy,
  Users,
} from "lucide-react";
import type { Post, Reply } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type React from "react";
import { Textarea } from "@/components/ui/textarea";
import { UserRankBadge } from "@/components/user-rank-badge";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommentsSectionProps {
  post: Post;
  showAll?: boolean;
  maxComments?: number;
}

interface ReplyFormProps {
  parentId: string;
  parentType: "entry" | "contribution";
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

function ReplyForm({
  parentId,
  parentType,
  onSubmit,
  onCancel,
}: ReplyFormProps) {
  const [content, setContent] = useState("");
  const { user } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent("");
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-3 pl-11">
      <div className="flex gap-2">
        <Avatar className="w-6 h-6">
          <AvatarImage
            src={user.avatar || "/placeholder.svg"}
            alt={user.name}
          />
          <AvatarFallback className="text-xs">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
          <div className="flex gap-2 mt-2">
            <Button type="submit" size="sm" disabled={!content.trim()}>
              <Send className="w-3 h-3 mr-1" />
              Reply
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

interface ReplyItemProps {
  reply: Reply;
}

function ReplyItem({ reply }: ReplyItemProps) {
  const { user } = useAppContext();
  const [isBurned, setIsBurned] = useState(false);
  const router = useRouter();

  const handleBurn = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isBurned) {
      setIsBurned(true);
    }
  };

  return (
    <div className="flex gap-2 py-2 pl-11">
      <Link href={`/profile/${reply.user.id}`}>
        <Avatar className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage
            src={reply.user.avatar || "/placeholder.svg"}
            alt={reply.user.name}
          />
          <AvatarFallback className="text-xs">
            {reply.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/profile/${reply.user.id}`}
            className="font-medium text-xs text-gray-900 dark:text-gray-100 hover:text-gray-600 transition-colors"
          >
            {reply.user.name}
          </Link>
          <UserRankBadge rank={reply.user.rank} showLevel={false} />
          <span className="text-xs text-gray-500">
            {reply.createdAt.toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {reply.content}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBurn}
            className={`h-5 px-1 text-xs transition-colors ${
              isBurned
                ? "text-red-600 hover:text-red-700"
                : "text-gray-500 hover:text-orange-500"
            }`}
          >
            <Flame
              className={`w-3 h-3 mr-1 ${isBurned ? "fill-current" : ""}`}
            />
            {reply.burnCount + (isBurned ? 1 : 0)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CommentsSection({
  post,
  showAll = false,
  maxComments = 3,
}: CommentsSectionProps) {
  const { user, addReply } = useAppContext();
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    type: "entry" | "contribution";
  } | null>(null);
  const [burnedComments, setBurnedComments] = useState<Set<string>>(new Set());
  const router = useRouter();

  const allComments = [
    ...(post.entries || []).map((entry) => ({
      ...entry,
      type: "entry" as const,
      message: entry.content,
      createdAt: entry.submittedAt,
    })),
    ...(post.contributions || []).map((contribution) => ({
      ...contribution,
      type: "contribution" as const,
      message: contribution.message || `Contributed $${contribution.amount}`,
      createdAt: contribution.contributedAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const displayComments = showAll
    ? allComments
    : allComments.slice(0, maxComments);

  const handleReply = (
    parentId: string,
    parentType: "entry" | "contribution",
  ) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setReplyingTo({ id: parentId, type: parentType });
  };

  const handleSubmitReply = (content: string) => {
    if (replyingTo && user) {
      addReply({
        content,
        userId: user.id,
        parentId: replyingTo.id,
        parentType: replyingTo.type,
      });
      setReplyingTo(null);
    }
  };

  const handleBurnComment = (commentId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!burnedComments.has(commentId)) {
      setBurnedComments((prev) => new Set([...prev, commentId]));
    }
  };

  return (
    <div className="space-y-3">
      {showAll && (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {post.type === "giveaway" ? "Entries" : "Contributions"} (
            {allComments.length})
          </span>
        </div>
      )}

      <div className="space-y-3">
        {displayComments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No {post.type === "giveaway" ? "entries" : "contributions"} yet
          </div>
        ) : (
          displayComments.map((comment) => {
            const isBurned = burnedComments.has(comment.id);
            const replyCount = comment.replies?.length || 0;

            return (
              <div key={comment.id} className="space-y-2">
                <div className="flex gap-3 py-2">
                  <Link href={`/profile/${comment.user.id}`}>
                    <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage
                        src={comment.user.avatar || "/placeholder.svg"}
                        alt={comment.user.name}
                      />
                      <AvatarFallback className="text-xs">
                        {comment.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/profile/${comment.user.id}`}
                        className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-gray-600 transition-colors"
                      >
                        {comment.user.name}
                      </Link>
                      <UserRankBadge
                        rank={comment.user.rank}
                        showLevel={false}
                      />
                      {comment.type === "entry" &&
                        "isWinner" in comment &&
                        comment.isWinner && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      <span className="text-xs text-gray-500">
                        {comment.createdAt.toLocaleDateString()}
                      </span>
                      {comment.type === "entry" && (
                        <>
                          {"proofImage" in comment && comment.proofImage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1 text-xs text-gray-500 hover:text-gray-700"
                              onClick={() =>
                                window.open(comment.proofImage, "_blank")
                              }
                            >
                              <ImageIcon className="w-3 h-3" />
                            </Button>
                          )}
                          {"proofUrl" in comment && comment.proofUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1 text-xs text-gray-500 hover:text-gray-700"
                              onClick={() =>
                                window.open(comment.proofUrl, "_blank")
                              }
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBurnComment(comment.id)}
                        className={`h-6 px-2 text-xs transition-colors ${
                          isBurned
                            ? "text-red-600 hover:text-red-700"
                            : "text-gray-500 hover:text-orange-500"
                        }`}
                      >
                        <Flame
                          className={`w-3 h-3 mr-1 ${
                            isBurned ? "fill-current" : ""
                          }`}
                        />
                        {Math.floor(Math.random() * 10) + (isBurned ? 1 : 0)}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReply(comment.id, comment.type)}
                        className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Reply {replyCount > 0 && `(${replyCount})`}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-1">
                    {comment.replies.map((reply) => (
                      <ReplyItem key={reply.id} reply={reply} />
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo?.id === comment.id && (
                  <ReplyForm
                    parentId={comment.id}
                    parentType={comment.type}
                    onSubmit={handleSubmitReply}
                    onCancel={() => setReplyingTo(null)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {!showAll && allComments.length > maxComments && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link href={`/post/${post.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              View all {allComments.length}{" "}
              {post.type === "giveaway" ? "entries" : "contributions"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
