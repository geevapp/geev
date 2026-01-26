import { Trophy, Medal, Award, Crown } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard | Geev',
  description: 'Top contributors and community leaders',
};

// Mock data for demonstration
const mockUsers = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    stats: { totalContributions: 247, xp: 2470 },
    badges: [{ name: 'Top Contributor', color: 'gold' }]
  },
  {
    id: '2',
    name: 'Alex Rivera',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    stats: { totalContributions: 189, xp: 1890 },
    badges: [{ name: 'Rising Star', color: 'silver' }]
  },
  {
    id: '3',
    name: 'Jordan Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    stats: { totalContributions: 156, xp: 1560 },
    badges: [{ name: 'Dedicated', color: 'bronze' }]
  },
  {
    id: '4',
    name: 'Taylor Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
    stats: { totalContributions: 134, xp: 1340 },
    badges: [{ name: 'Active Member', color: 'blue' }]
  },
  {
    id: '5',
    name: 'Morgan Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
    stats: { totalContributions: 98, xp: 980 },
    badges: [{ name: 'Contributor', color: 'green' }]
  },
  {
    id: '6',
    name: 'Casey Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
    stats: { totalContributions: 87, xp: 870 },
    badges: [{ name: 'Helper', color: 'purple' }]
  },
  {
    id: '7',
    name: 'Riley Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
    stats: { totalContributions: 76, xp: 760 },
    badges: [{ name: 'Enthusiast', color: 'indigo' }]
  },
  {
    id: '8',
    name: 'Jamie Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie',
    stats: { totalContributions: 65, xp: 650 },
    badges: [{ name: 'Member', color: 'gray' }]
  }
];

const currentUserId = '5'; // Morgan Davis is the current user

function Avatar({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`rounded-full overflow-hidden bg-gray-200 ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

function UserRankBadge({ badge }: { badge?: { name: string; color: string } }) {
  if (!badge) return null;
  
  const colorClasses: Record<string, string> = {
    gold: 'bg-yellow-500 text-yellow-900',
    silver: 'bg-gray-300 text-gray-800',
    bronze: 'bg-orange-600 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    gray: 'bg-gray-400 text-white'
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClasses[badge.color] || colorClasses.gray}`}>
      {badge.name}
    </div>
  );
}

function PodiumCard({ user, rank, isWinner = false }: { 
  user?: typeof mockUsers[0]; 
  rank: number; 
  isWinner?: boolean 
}) {
  if (!user) return <div className="flex flex-col items-center opacity-0"></div>;
  
  const heights: Record<number, string> = { 1: 'h-48', 2: 'h-40', 3: 'h-32' };
  const colors: Record<number, string> = { 
    1: 'bg-gradient-to-b from-yellow-400 to-yellow-600', 
    2: 'bg-gradient-to-b from-gray-300 to-gray-500', 
    3: 'bg-gradient-to-b from-orange-500 to-orange-700' 
  };
  const icons: Record<number, JSX.Element> = { 
    1: <Crown className="w-8 h-8 text-white" />, 
    2: <Medal className="w-7 h-7 text-white" />, 
    3: <Award className="w-6 h-6 text-white" /> 
  };
  const order: Record<number, string> = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };

  return (
    <div className={`flex flex-col items-center ${order[rank]}`}>
      <div className="relative mb-3">
        <Avatar 
          src={user.avatar} 
          alt={user.name}
          className={`${isWinner ? 'h-20 w-20' : 'h-16 w-16'} border-4 ${rank === 1 ? 'border-yellow-400' : rank === 2 ? 'border-gray-400' : 'border-orange-600'}`}
        />
        {isWinner && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
            <Crown className="w-5 h-5 text-yellow-900" />
          </div>
        )}
      </div>
      <p className={`font-semibold text-center ${isWinner ? 'text-lg' : 'text-sm'}`}>{user.name}</p>
      <p className="text-xs text-gray-600 mt-1">
        {user.stats?.totalContributions || 0} contributions
      </p>
      <p className="text-xs text-gray-500">
        {user.stats?.xp || 0} XP
      </p>
      <div
        className={`${heights[rank]} w-full mt-4 rounded-t-lg flex flex-col items-center justify-center ${colors[rank]} shadow-lg transition-transform hover:scale-105`}
      >
        {icons[rank]}
        <span className="text-5xl font-bold text-white mt-2">{rank}</span>
      </div>
    </div>
  );
}

function RankCard({ user, rank, isCurrentUser }: { 
  user: typeof mockUsers[0]; 
  rank: number; 
  isCurrentUser: boolean 
}) {
  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm transition-all hover:shadow-md ${isCurrentUser ? 'border-2 border-blue-500 bg-blue-50' : 'border border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-gray-400 w-8 flex-shrink-0">{rank}</span>
        <Avatar 
          src={user.avatar} 
          alt={user.name}
          className="h-12 w-12 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
            {isCurrentUser && (
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">You</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-600">
              {user.stats?.totalContributions || 0} contributions
            </p>
            <p className="text-sm text-gray-500">
              {user.stats?.xp || 0} XP
            </p>
          </div>
        </div>
        <UserRankBadge badge={user.badges?.[0]} />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  // Sort users by contribution count
  const rankedUsers = [...mockUsers].sort(
    (a, b) =>
      (b.stats?.totalContributions || 0) - (a.stats?.totalContributions || 0)
  );

  const top3 = rankedUsers.slice(0, 3);
  const rest = rankedUsers.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-gray-600">Top contributors in our community</p>
        </div>

        {/* Top 3 Podium */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {/* 2nd Place */}
            <PodiumCard user={top3[1]} rank={2} />

            {/* 1st Place - Taller */}
            <PodiumCard user={top3[0]} rank={1} isWinner />

            {/* 3rd Place */}
            <PodiumCard user={top3[2]} rank={3} />
          </div>
        </div>

        {/* Rest of Rankings */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 px-2">All Rankings</h2>
          {rest.map((user, index) => (
            <RankCard
              key={user.id}
              user={user}
              rank={index + 4}
              isCurrentUser={user.id === currentUserId}
            />
          ))}
        </div>

        {/* Footer Stats */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Total Contributors: {rankedUsers.length}</p>
        </div>
      </div>
    </div>
  );
}