"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Eye,
  RotateCcw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ModerationStatus =
  | "none"
  | "flagged"
  | "under_review"
  | "suspended"
  | "banned"
  | "approved";

type ModerationActionName =
  | "approve"
  | "review"
  | "suspend"
  | "ban"
  | "clear"
  | "verify_creator";

interface ModerationPost {
  id: string;
  title: string;
  description: string | null;
  type: "giveaway" | "request";
  status: string;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string | null;
    walletAddress?: string;
    isVerified: boolean;
    role: string;
  };
  contentFlags: Array<{
    id: string;
    reason: string;
    details: string | null;
    createdAt: string;
    flaggedBy: {
      id: string;
      name: string;
      username: string | null;
    };
  }>;
  moderationActions: Array<{
    id: string;
    action: ModerationStatus;
    note: string | null;
    createdAt: string;
    moderator: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  _count: {
    entries: number;
    comments: number;
    interactions: number;
    contributions?: number;
    contentFlags: number;
  };
}

interface ModerationResponse {
  posts: ModerationPost[];
  totals: Record<string, number>;
}

const statusStyles: Record<ModerationStatus, string> = {
  none: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
  flagged:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  under_review:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  suspended:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  banned:
    "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

const statusLabels: Record<ModerationStatus, string> = {
  none: "None",
  flagged: "Flagged",
  under_review: "Reviewing",
  suspended: "Suspended",
  banned: "Banned",
  approved: "Approved",
};

const filters = [
  { value: "all", label: "Queue" },
  { value: "under_review", label: "Review" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
  { value: "approved", label: "Approved" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortenWallet(wallet?: string) {
  if (!wallet) return "No wallet";
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function AdminModerationDashboard() {
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState<ModerationResponse>({
    posts: [],
    totals: {},
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const loadQueue = useCallback(async (nextFilter: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/moderation?status=${nextFilter}`,
        { cache: "no-store" },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load moderation queue");
      }

      setData(payload.data);
    } catch (error) {
      toast.error("Moderation queue unavailable", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue(filter);
  }, [filter, loadQueue]);

  const flaggedCount = useMemo(
    () => data.posts.filter((post) => post._count.contentFlags > 0).length,
    [data.posts],
  );

  const runAction = async (
    post: ModerationPost,
    action: ModerationActionName,
  ) => {
    setActingOn(`${post.id}:${action}`);
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          action,
          note: notes[post.id]?.trim() || undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Action failed");
      }

      setNotes((current) => ({ ...current, [post.id]: "" }));
      toast.success("Moderation action saved");
      await loadQueue(filter);
    } catch (error) {
      toast.error("Action failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </div>
          <h1 className="mt-1 text-3xl font-bold text-gray-950 dark:text-gray-50">
            Moderation
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={filter === item.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">Items</div>
          <div className="mt-1 text-2xl font-semibold">{data.posts.length}</div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <div className="text-sm text-amber-700 dark:text-amber-200">
            Flagged
          </div>
          <div className="mt-1 text-2xl font-semibold text-amber-900 dark:text-amber-100">
            {flaggedCount}
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="text-sm text-red-700 dark:text-red-200">
            Suspended
          </div>
          <div className="mt-1 text-2xl font-semibold text-red-900 dark:text-red-100">
            {data.totals.suspended ?? 0}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <div className="text-sm text-emerald-700 dark:text-emerald-200">
            Approved
          </div>
          <div className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
            {data.totals.approved ?? 0}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          Loading moderation queue...
        </div>
      ) : data.posts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          No content in this queue.
        </div>
      ) : (
        <div className="space-y-4">
          {data.posts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusStyles[post.moderationStatus]}>
                        {statusLabels[post.moderationStatus]}
                      </Badge>
                      <Badge variant="outline">{post.type}</Badge>
                      <Badge variant="outline">{post.status}</Badge>
                      {post._count.contentFlags > 0 && (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                          <AlertTriangle className="h-3 w-3" />
                          {post._count.contentFlags}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl leading-snug">
                      {post.title}
                    </CardTitle>
                    <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                      {post.description || "No description provided."}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
                    <div className="font-medium text-gray-950 dark:text-gray-50">
                      {post.user.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      @{post.user.username || "unknown"} ·{" "}
                      {shortenWallet(post.user.walletAddress)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        className={
                          post.user.isVerified
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                            : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {post.user.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                      <Badge variant="outline">{post.user.role}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Entries
                    </div>
                    <div className="font-semibold">{post._count.entries}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Comments
                    </div>
                    <div className="font-semibold">{post._count.comments}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Burns
                    </div>
                    <div className="font-semibold">
                      {post._count.interactions}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Updated
                    </div>
                    <div className="font-semibold">
                      {formatDate(post.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold">Flags</h2>
                    {post.contentFlags.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        No flags recorded.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {post.contentFlags.slice(0, 3).map((flag) => (
                          <div
                            key={flag.id}
                            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium capitalize text-amber-950 dark:text-amber-100">
                                {flag.reason.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-amber-700 dark:text-amber-200">
                                {formatDate(flag.createdAt)}
                              </span>
                            </div>
                            <div className="mt-1 text-amber-800 dark:text-amber-100">
                              {flag.details || "No extra details."}
                            </div>
                            <div className="mt-2 text-xs text-amber-700 dark:text-amber-200">
                              {flag.flaggedBy.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold">History</h2>
                    {post.moderationActions.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        No moderation actions yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {post.moderationActions.map((action) => (
                          <div
                            key={action.id}
                            className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium capitalize">
                                {statusLabels[action.action]}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(action.createdAt)}
                              </span>
                            </div>
                            <div className="mt-1 text-gray-600 dark:text-gray-300">
                              {action.note || "No note."}
                            </div>
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {action.moderator.name} · {action.moderator.role}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Textarea
                  value={notes[post.id] || ""}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [post.id]: event.target.value,
                    }))
                  }
                  placeholder="Internal moderation note"
                  className="min-h-20"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingOn !== null}
                    onClick={() => runAction(post, "review")}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                  <Button
                    size="sm"
                    disabled={actingOn !== null}
                    onClick={() => runAction(post, "approve")}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actingOn !== null}
                    onClick={() => runAction(post, "suspend")}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingOn !== null}
                    onClick={() => runAction(post, "ban")}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Ban
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingOn !== null || post.user.isVerified}
                    onClick={() => runAction(post, "verify_creator")}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Verify Creator
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actingOn !== null}
                    onClick={() => runAction(post, "clear")}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
