import { useState, useEffect } from 'react';
import { LeaderboardResponse, LeaderboardEntry } from '@/lib/types';

interface UseLeaderboardOptions {
  period?: 'all-time' | 'monthly' | 'weekly';
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Custom hook for fetching leaderboard data
 */
export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const {
    period = 'all-time',
    page = 1,
    limit = 50,
    autoFetch = true,
  } = options;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/leaderboard?${params}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leaderboard');
      }

      const data: LeaderboardResponse = result.data;
      setLeaderboard(data.leaderboard);
      setTotalCount(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchLeaderboard();
    }
  }, [period, page, limit, autoFetch]);

  const hasMore = leaderboard.length < totalCount;

  return {
    leaderboard,
    loading,
    error,
    refetch: fetchLeaderboard,
    hasMore,
    totalCount,
  };
}