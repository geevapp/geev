'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';

import { AuthGuard } from '@/components/auth-guard';
import { AuthNavbar } from '@/components/auth-navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/post-card';
import { useAppContext } from '@/contexts/app-context';

const CATEGORIES = ['All', 'Electronics', 'Food', 'Services', 'Other'];

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
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
  const { user, posts, isHydrated } = useAppContext();
  const [activeTab, setActiveTab] = useState<
    'all' | 'giveaways' | 'help' | 'active'
  >('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [category, setCategory] = useState('All');

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    // Filter by tab
    let filtered = posts;
    if (activeTab === 'giveaways') {
      filtered = posts.filter((p) => p.type === 'giveaway');
    } else if (activeTab === 'help') {
      filtered = posts.filter((p) => p.type === 'help-request');
    } else if (activeTab === 'active') {
      filtered = posts.filter((p) => p.status === 'active');
    }

    // Filter by category
    if (category !== 'All') {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Sort by selected method
    if (sortBy === 'recent') {
      return filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      // Trending: sort by engagement (entries count)
      return filtered.sort((a, b) => {
        const scoreA = a.entries?.length || 0;
        const scoreB = b.entries?.length || 0;
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
  const giveawaysCount = posts.filter((p) => p.type === 'giveaway').length;
  const helpCount = posts.filter((p) => p.type === 'help-request').length;
  const activeCount = posts.filter((p) => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Main Content */}
      <div className="container py-8">
        {/* Tabs */}
        <div className="flex gap-2 bg-[#1a1a24] p-1 rounded-lg border border-[#2a2a34]">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[#2a2a34] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({allCount})
          </button>
          <button
            onClick={() => setActiveTab('giveaways')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'giveaways'
                ? 'bg-[#2a2a34] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Giveaways ({giveawaysCount})
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'help'
                ? 'bg-[#2a2a34] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Help Requests ({helpCount})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-[#2a2a34] text-white'
                : 'text-gray-400 hover:text-white'
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
              variant={category === cat ? 'default' : 'outline'}
              className={`cursor-pointer transition-all ${
                category === cat
                  ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                  : 'bg-transparent text-gray-400 border-[#2a2a34] hover:border-orange-500/50 hover:text-orange-500'
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
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    No posts found
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {category === 'All'
                      ? 'No posts yet. Be the first to create one!'
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
  );
}
