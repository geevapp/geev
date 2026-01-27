"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageSquare,
  Home,
  Activity,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'Alex Chan',
    username: '@alexchan',
    avatar: '/avatars/alex.jpg',
    badge: 'Verified',
    stats: {
      totalContributions: 0,
      givenways: 2,
      badges: 2
    }
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    username: '@sarahj',
    avatar: '/avatars/sarah.jpg',
    badge: null,
    stats: {
      totalContributions: 0,
      givenways: 0,
      badges: 2
    }
  },
  {
    id: '3',
    name: 'Marcus Williams',
    username: '@marcusw',
    avatar: '/avatars/marcus.jpg',
    badge: 'Verified',
    stats: {
      totalContributions: 0,
      givenways: 0,
      badges: 3
    }
  },
  {
    id: '4',
    name: 'Emma Rodriguez',
    username: '@emmar',
    avatar: '/avatars/emma.jpg',
    badge: null,
    stats: {
      totalContributions: 0,
      givenways: 0,
      badges: 1
    }
  }
];

const currentUser = {
  name: 'Alex Chan',
  username: '@alexchan',
  avatar: '/avatars/alex.jpg',
  stats: {
    posts: 45,
    followers: 1250,
    badges: 3
  },
  walletBalance: 1500,
  level: 5,
  badgeCount: 3
};

type TimePeriod = 'week' | 'month' | 'alltime';
type Category = 'topgivers' | 'giveaways' | 'requestors' | 'requests' | 'trending';

export default function LeaderboardApp() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('alltime');
  const [category, setCategory] = useState<Category>('topgivers');
  const [users] = useState(mockUsers);

  const rankedUsers = [...users].sort(
    (a, b) => (b.stats?.totalContributions || 0) - (a.stats?.totalContributions || 0)
  );

  // Apply dark background to body
  React.useEffect(() => {
    document.body.style.backgroundColor = '#0d1425';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.backgroundColor = '#0d1425';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#0d1425] text-white" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0f1e] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800 flex justify-end">
          <img src="/logo-light.png" alt="Geev Logo" className="h-8" />
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-gray-800">
          <div className="bg-[#0d1425] rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback className="bg-gray-700">
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{currentUser.name}</p>
                <p className="text-xs text-gray-400">{currentUser.username}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-orange-600 rounded-md font-medium">
                  Level {currentUser.level}
                </span>
                <span className="px-2 py-1 bg-blue-600 rounded-md font-medium">
                  {currentUser.badgeCount} Badges
                </span>
              </div>
            </div>
            <button className="w-full mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md text-sm font-medium transition-colors">
              Wallet Balance
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Feed" />
            <NavItem icon={<Activity className="w-5 h-5" />} label="Activity" />
            <NavItem icon={<Trophy className="w-5 h-5" />} label="Leaderboard" active />
            <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" />
          </div>
        </nav>

        {/* Create Post Button */}
        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-5 h-5" />
            Create Post
          </button>
        </div>

        {/* User Stats */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-400 mb-2">YOUR STATS</div>
          <div className="space-y-2">
            <StatRow icon="📝" label="Posts" value={currentUser.stats.posts} />
            <StatRow icon="👥" label="Followers" value={currentUser.stats.followers} />
            <StatRow icon="🏆" label="Badges" value={currentUser.stats.badges} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Navbar */}
        <header className="bg-[#0a0f1e] border-b border-gray-800 px-6 py-4 flex items-center justify-end sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md text-sm font-medium transition-colors">
              1,500 XP
            </button>
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback className="bg-gray-700">
                {currentUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Leaderboard Content */}
        <div className="container max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-orange-500" />
              <h1 className="text-3xl font-bold">Leaderboards</h1>
            </div>
            <p className="text-gray-400">Celebrate the most active members of our community</p>
          </div>

          {/* Time Period Filter */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTimePeriod('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timePeriod === 'week'
                  ? 'bg-gray-700 text-white'
                  : 'bg-[#0a0f1e] text-gray-400 hover:bg-gray-800'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timePeriod === 'month'
                  ? 'bg-gray-700 text-white'
                  : 'bg-[#0a0f1e] text-gray-400 hover:bg-gray-800'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimePeriod('alltime')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timePeriod === 'alltime'
                  ? 'bg-orange-600 text-white'
                  : 'bg-[#0a0f1e] text-gray-400 hover:bg-gray-800'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <CategoryTab
              icon={<Trophy className="w-4 h-4" />}
              label="Top Givers"
              active={category === 'topgivers'}
              onClick={() => setCategory('topgivers')}
            />
            <CategoryTab
              icon={<Medal className="w-4 h-4" />}
              label="Giveaways"
              active={category === 'giveaways'}
              onClick={() => setCategory('giveaways')}
            />
            <CategoryTab
              icon={<Heart className="w-4 h-4" />}
              label="Requestors"
              active={category === 'requestors'}
              onClick={() => setCategory('requestors')}
            />
            <CategoryTab
              icon={<MessageSquare className="w-4 h-4" />}
              label="Requests"
              active={category === 'requests'}
              onClick={() => setCategory('requests')}
            />
            <CategoryTab
              icon={<TrendingUp className="w-4 h-4" />}
              label="Trending"
              active={category === 'trending'}
              onClick={() => setCategory('trending')}
            />
          </div>

          {/* Top Givers Section */}
          <div className="bg-[#0a0f1e] rounded-lg p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold">Top Givers</h2>
            </div>

            {/* Ranked User List */}
            <div className="space-y-3">
              {rankedUsers.map((user, index) => (
                <RankCard
                  key={user.id}
                  user={user}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatRow({ icon, label, value }: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-gray-400">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function CategoryTab({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-gray-700 text-white'
          : 'bg-transparent text-gray-400 hover:bg-gray-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function RankCard({ user, rank }: {
  user: typeof mockUsers[0];
  rank: number;
}) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-700" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = () => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-500';
      case 2:
        return 'bg-gray-500/20 text-gray-400';
      case 3:
        return 'bg-orange-700/20 text-orange-600';
      default:
        return 'bg-gray-700/50 text-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-[#0d1425] rounded-lg hover:bg-[#111a2e] transition-colors border border-gray-800">
      {/* Rank */}
      <div className="flex items-center justify-center w-12">
        {rank <= 3 ? (
          getRankIcon()
        ) : (
          <span className={`text-lg font-bold px-3 py-1 rounded-md ${getRankBadgeColor()}`}>
            #{rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-gray-700">
          {user.name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-white truncate">{user.name}</p>
          {user.badge && (
            <Badge className="bg-blue-600 text-white text-xs">
              {user.badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-400">{user.username}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-gray-400">Giveaways</p>
          <p className="font-semibold text-orange-500">{user.stats.givenways}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">Badges</p>
          <p className="font-semibold text-blue-500">{user.stats.badges}</p>
        </div>
      </div>
    </div>
  );
}