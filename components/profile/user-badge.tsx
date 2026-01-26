'use client'

import type { Badge as BadgeType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface UserBadgeProps {
  badge: BadgeType
  className?: string
  showName?: boolean
}

/**
 * UserBadge Component
 *
 * Displays a user's earned badge with icon and optional name.
 * Styled according to badge tier with appropriate colors.
 */
export function UserBadge({ badge, className, showName = false }: UserBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        badge.color || 'bg-[#364153] text-[#99A1AF]',
        className
      )}
      title={badge.description}
    >
      <span className="text-sm">{badge.icon}</span>
      {showName && <span>{badge.name}</span>}
    </div>
  )
}

interface BadgeGridProps {
  badges: BadgeType[]
  className?: string
  maxDisplay?: number
  showNames?: boolean
}

/**
 * BadgeGrid Component
 *
 * Displays a grid of user badges with optional limit and "more" indicator.
 */
export function BadgeGrid({ badges, className, maxDisplay, showNames = false }: BadgeGridProps) {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges
  const remainingCount = maxDisplay ? Math.max(0, badges.length - maxDisplay) : 0

  if (badges.length === 0) {
    return (
      <div className="text-sm text-[#99A1AF]">No badges earned yet</div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayBadges.map((badge) => (
        <UserBadge key={badge.id} badge={badge} showName={showNames} />
      ))}
      {remainingCount > 0 && (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#364153] text-[#99A1AF]">
          +{remainingCount} more
        </div>
      )}
    </div>
  )
}
