'use client';

import { useState } from 'react';
import { useLeaderboard } from '@/hooks/use-leaderboard';
import { Trophy, Gift, Heart, Users, TrendingUp, Crown, Medal, Award } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'all-time', label: 'All Time' },
] as const;

const CATEGORY_TABS = [
  { id: 'top-givers', label: 'Top Givers', icon: Trophy },
  { id: 'giveaways', label: 'Giveaways', icon: Gift },
  { id: 'requestors', label: 'Requestors', icon: Heart },
  { id: 'requests', label: 'Requests', icon: Users },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
] as const;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');
  const [activeCategory, setActiveCategory] = useState('top-givers');
  const [page] = useState(1);

  const { leaderboard, loading, error, refetch } = useLeaderboard({
    period,
    page,
    limit: 50,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-orange-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-600" />;
      default: return null;
    }
  };

  const getRankNumber = (rank: number) => {
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-96 mb-8"></div>
            
            {/* Period Filter Skeleton */}
            <div className="flex gap-2 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-24"></div>
              ))}
            </div>
            
            {/* Category Tabs Skeleton */}
            <div className="flex gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-32"></div>
              ))}
            </div>
            
            {/* Leaderboard Content Skeleton */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded"></div>
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-12"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Unable to Load Leaderboard</h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <button 
            onClick={refetch}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Leaderboards
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Celebrate the most active members of our community
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-8">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                period === option.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeCategory === tab.id
                    ? 'bg-slate-800 dark:bg-slate-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Content */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {CATEGORY_TABS.find(tab => tab.id === activeCategory)?.label}
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No contributors found for this period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const rankIcon = getRankIcon(rank);
                
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-8">
                        {rankIcon || (
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                            {getRankNumber(rank)}
                          </span>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <div className="relative">
                        <img
                          src={entry.avatar_url}
                          alt={entry.name}
                          className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-600"
                        />
                        {/* Verified badge for some users */}
                        {rank <= 3 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{entry.name}</h3>
                          {rank <= 3 && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">@{entry.name.toLowerCase().replace(' ', '')}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <div className="text-orange-500 font-bold text-lg">
                          {activeCategory === 'top-givers' ? entry.post_count : entry.total_contributions}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">
                          {activeCategory === 'top-givers' ? 'Giveaways' : 'Total'}
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-500 font-bold text-lg">
                          {entry.badges.length}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">Badges</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
