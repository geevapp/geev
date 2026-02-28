import { Award, Crown, Star, Trophy, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { UserRank } from '@/lib/types';

interface UserRankBadgeProps {
  rank: UserRank;
  showLevel?: boolean;
}

export function UserRankBadge({ rank, showLevel = true }: UserRankBadgeProps) {
  const getRankIcon = (level: number) => {
    switch (level) {
      case 1:
        return <Star className="w-3 h-3" />;
      case 2:
        return <Award className="w-3 h-3" />;
      case 3:
        return <Trophy className="w-3 h-3" />;
      case 4:
        return <Crown className="w-3 h-3" />;
      case 5:
        return <Zap className="w-3 h-3" />;
      default:
        return <Star className="w-3 h-3" />;
    }
  };

  const getRankColors = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 2:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 3:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 4:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 5:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Badge
      className={`${getRankColors(rank?.level ?? 0)} flex items-center gap-1`}
    >
      {getRankIcon(rank?.level ?? 0)}
      {showLevel && `Level ${rank?.level ?? 0}`} {rank?.title}
    </Badge>
  );
}
