'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Crown,
  Gift,
  Heart,
  Medal,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
  
// ── Types ─────────────────────────────────────────────────────────────────────

type FilterPeriod = 'week' | 'month' | 'all-time';

/** Shape of each entry in the API response's `leaderboard` array. */
type LeaderboardUser = {
  id: string;
  name: string;
  avatar_url: string | null;
  xp: number;
  post_count: number;
  entry_count: number;
  total_contributions: number;
  badges: {
    id: string;
    name: string;
    tier: string;
  }[];
};

type LeaderboardResponse = {
  leaderboard: LeaderboardUser[];
  page: number;
  limit: number;
  period: string;
  total: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map the UI's period values to what the API expects.
 * The UI uses 'week'/'month'/'all-time'; the API uses 'weekly'/'monthly'/'all-time'.
 */
function toPeriodParam(period: FilterPeriod): string {
  if (period === 'week') return 'weekly';
  if (period === 'month') return 'monthly';
  return 'all-time';
}

function getMedalIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
  return <Star className="w-5 h-5 text-gray-300" />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('all-time');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from the live API whenever the period filter changes.
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/leaderboard?period=${toPeriodParam(selectedPeriod)}&page=1&limit=50`
        );
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        setData(json.data); // apiSuccess wraps the payload in { data: ... }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedPeriod]);

  // Derive the per-tab arrays from the single API response.
  // The API returns a unified list sorted by total_contributions.
  // We re-sort per tab to surface the right metric for each view.
  const users = data?.leaderboard ?? [];

  /** Top Givers — users who have created the most posts (giveaways). */
  const topGivers = [...users]
    .sort((a, b) => b.post_count - a.post_count)
    .slice(0, 20);

  /** Top Requestors — users who have made the most entries/requests. */
  const topRequestors = [...users]
    .sort((a, b) => b.entry_count - a.entry_count)
    .slice(0, 20);

  /** Trending — users with the highest overall activity (posts + entries). */
  const trendingUsers = [...users]
    .sort((a, b) => b.total_contributions - a.total_contributions)
    .slice(0, 20);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg animate-pulse"
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          </div>
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12 text-red-500">
      <p className="font-medium">Failed to load leaderboard</p>
      <p className="text-sm mt-1 text-gray-500">{error}</p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => setSelectedPeriod(selectedPeriod)} // re-triggers useEffect
      >
        Try again
      </Button>
    </div>
  );

  const renderUserRow = (
    u: LeaderboardUser,
    idx: number,
    metric: { value: number; label: string; colorClass: string },
  ) => (
    <Link key={u.id} href={`/profile/${u.id}`}>
      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
        <div className="flex items-center justify-center w-8 h-8">
          {getMedalIcon(idx + 1)}
        </div>
        <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-8">
          #{idx + 1}
        </span>
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={u.avatar_url || '/placeholder.svg'}
            alt={u.name}
          />
          <AvatarFallback className="bg-orange-500 text-white">
            {u.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
            {u.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {u.xp.toLocaleString()} XP
          </p>
        </div>
        <div className="text-right">
          <div className={`font-bold ${metric.colorClass}`}>{metric.value}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {metric.label}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-blue-600">{u.badges.length}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Badges</div>
        </div>
      </div>
    </Link>
  );

  // ── Markup ──────────────────────────────────────────────────────────────────

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
          {(['week', 'month', 'all-time'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod(period)}
              className={
                selectedPeriod === period
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : ''
              }
            >
              {period === 'week'
                ? 'This Week'
                : period === 'month'
                  ? 'This Month'
                  : 'All Time'}
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

          {/* Top Givers */}
          <TabsContent value="givers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-600" />
                  Top Givers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? renderSkeleton() : error ? renderError() : (
                  <div className="space-y-4">
                    {topGivers.map((u, idx) =>
                      renderUserRow(u, idx, {
                        value: u.post_count,
                        label: 'Giveaways',
                        colorClass: 'text-orange-600',
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Giveaways — requires a dedicated posts endpoint */}
          <TabsContent value="giveaways">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Trending Giveaways
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? renderSkeleton() : error ? renderError() : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Trending giveaways coming soon</p>
                    <p className="text-sm mt-1">
                      This tab will show top posts once the posts leaderboard endpoint is available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Requestors */}
          <TabsContent value="requestors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Top Requestors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? renderSkeleton() : error ? renderError() : (
                  <div className="space-y-4">
                    {topRequestors.map((u, idx) =>
                      renderUserRow(u, idx, {
                        value: u.entry_count,
                        label: 'Requests',
                        colorClass: 'text-red-600',
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Requests — requires a dedicated posts endpoint */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Trending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? renderSkeleton() : error ? renderError() : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Trending requests coming soon</p>
                    <p className="text-sm mt-1">
                      This tab will show top posts once the posts leaderboard endpoint is available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trending */}
          <TabsContent value="trending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Trending Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? renderSkeleton() : error ? renderError() : (
                  <div className="space-y-4">
                    {trendingUsers.map((u, idx) =>
                      renderUserRow(u, idx, {
                        value: u.total_contributions,
                        label: 'Activity',
                        colorClass: 'text-yellow-600',
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}