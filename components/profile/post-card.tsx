'use client'

import type { Post } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RankBadge } from './rank-badge'
import {
  CheckCircle2,
  Gift,
  Heart,
  MessageCircle,
  Share2,
  Flame,
  Target,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PostCardProps {
  post: Post
  className?: string
  showAuthor?: boolean
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format date to a readable string
 */
function formatDate(date: Date | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

/**
 * PostCard Component
 *
 * Displays a post card with author info, content, and stats.
 * Used in feed and profile pages.
 */
export function PostCard({ post, className, showAuthor = true }: PostCardProps) {
  const isGiveaway = post.type === 'giveaway'

  return (
    <Card
      className={cn(
        'overflow-hidden bg-[#101828] border-[#1E2939]',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {showAuthor && (
            <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback className="bg-[#364153] text-[#F3F4F6]">
                  {getInitials(post.author.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#F3F4F6]">{post.author.name}</span>
                  {post.author.isVerified && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  )}
                  <RankBadge rank={post.author.rank} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-sm text-[#99A1AF]">
                  <span>@{post.author.username}</span>
                  <span className="h-1 w-1 rounded-full bg-[#99A1AF]" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </Link>
          )}
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn(
                'rounded-full text-xs',
                post.status === 'active'
                  ? 'bg-[rgba(3,46,21,0.2)] border-[#016630] text-[#05DF72]'
                  : 'bg-[#364153] border-[#364153] text-[#99A1AF]'
              )}
            >
              {post.status}
            </Badge>
            {/* Type Badge */}
            <Badge
              variant="outline"
              className="rounded-full border-[#364153] text-[#99A1AF]"
            >
              {isGiveaway ? (
                <>
                  <Gift className="h-3 w-3 mr-1" />
                  Giveaway
                </>
              ) : (
                <>
                  <Target className="h-3 w-3 mr-1" />
                  Help Request
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="text-lg font-semibold text-[#F3F4F6] mb-2">{post.title}</h3>
        <p className="text-[#D1D5DC] text-sm line-clamp-3 mb-4">{post.description}</p>

        {/* Prize/Goal Banner */}
        {isGiveaway ? (
          <div className="p-4 rounded-xl mb-4 bg-gradient-to-r from-[rgba(22,37,86,0.2)] to-[rgba(60,3,102,0.2)] border border-[rgba(25,60,184,0.3)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#51A2FF]" />
                <span className="font-semibold text-[#F3F4F6]">
                  Prize: {post.prizeAmount} {post.currency}
                </span>
              </div>
              {post.endDate && (
                <div className="flex items-center gap-1 text-sm text-[#99A1AF]">
                  <Clock className="h-4 w-4" />
                  Ends {formatDate(post.endDate)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl mb-4 bg-gradient-to-r from-[rgba(3,46,21,0.2)] to-[rgba(0,44,34,0.2)] border border-[rgba(2,102,48,0.3)]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-[#05DF72]" />
              <span className="font-semibold text-[#F3F4F6]">
                Goal: ${post.targetAmount?.toLocaleString()} {post.currency}
              </span>
            </div>
            <div className="w-full h-2 bg-[#364153] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#E5E5E5] rounded-full"
                style={{
                  width: `${Math.min(100, ((post.currentAmount || 0) / (post.targetAmount || 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-[#99A1AF]">
              <span>
                {((post.currentAmount || 0) / (post.targetAmount || 1) * 100).toFixed(1)}% funded
              </span>
              <span>${(post.currentAmount || 0).toLocaleString()} raised</span>
            </div>
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E2939]">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#6A7282] hover:text-[#EB0005] px-2"
            >
              <Flame className="h-4 w-4 mr-1" />
              {post.burnCount}
            </Button>
            <Button variant="ghost" size="sm" className="text-[#6A7282] px-2">
              <MessageCircle className="h-4 w-4 mr-1" />
              {post.commentCount}
            </Button>
            <Button variant="ghost" size="sm" className="text-[#6A7282] px-2">
              <Share2 className="h-4 w-4 mr-1" />
              {post.shareCount}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-[#6A7282]">
            Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
