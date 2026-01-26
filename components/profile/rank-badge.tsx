'use client'

import type { UserRank } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Crown, Award, Trophy, Star, Sparkles } from 'lucide-react'

interface RankBadgeProps {
  rank: UserRank
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Get the appropriate icon for a rank level
 */
function getRankIcon(level: number, size: number) {
  const iconClass = `h-${size} w-${size}`

  switch (level) {
    case 5:
      return <Crown className={iconClass} />
    case 4:
      return <Trophy className={iconClass} />
    case 3:
      return <Award className={iconClass} />
    case 2:
      return <Star className={iconClass} />
    default:
      return <Sparkles className={iconClass} />
  }
}

/**
 * Get the background color for a rank level based on Figma styles
 */
function getRankColors(level: number): { bg: string; text: string; border?: string } {
  switch (level) {
    case 5: // Legend - Diamond
      return { bg: '#073EB8', text: '#BEDBFF' }
    case 4: // Champion - Orange/Gold
      return { bg: '#7E2A0C', text: '#FFD6A7' }
    case 3: // Contributor - Blue
      return { bg: '#0D542B', text: '#B9F8CF' }
    case 2: // Helper - Green
      return { bg: '#0D542B', text: '#B9F8CF' }
    default: // Newcomer
      return { bg: '#364153', text: '#99A1AF' }
  }
}

/**
 * RankBadge Component
 *
 * Displays a user's rank with an appropriate icon and styled badge.
 * Colors and icons vary based on rank level.
 */
export function RankBadge({ rank, className, size = 'md' }: RankBadgeProps) {
  const colors = getRankColors(rank.level)
  const iconSize = size === 'sm' ? 3 : size === 'md' ? 3 : 4
  const paddingClass = size === 'sm' ? 'px-2 py-0.5' : size === 'md' ? 'px-2 py-0.5' : 'px-3 py-1'
  const textClass = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        paddingClass,
        textClass,
        className
      )}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {getRankIcon(rank.level, iconSize)}
      <span>Level {rank.level} {rank.title}</span>
    </div>
  )
}
