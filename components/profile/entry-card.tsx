'use client'

import type { Entry } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, MessageCircle, ExternalLink, Trophy } from 'lucide-react'
import Link from 'next/link'

interface EntryCardProps {
  entry: Entry
  className?: string
  showUser?: boolean
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
 * Format date to a relative or readable string
 */
function formatDate(date: Date | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * EntryCard Component
 *
 * Displays an entry/submission card with user info and content.
 * Used in profile pages to show user's entries to posts.
 */
export function EntryCard({ entry, className, showUser = true }: EntryCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden bg-[#101828] border-[#1E2939]',
        className
      )}
    >
      <CardContent className="p-4">
        {/* Header with user info */}
        {showUser && entry.user && (
          <div className="flex items-start justify-between mb-3">
            <Link href={`/profile/${entry.user.id}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                <AvatarFallback className="bg-[#364153] text-[#F3F4F6]">
                  {getInitials(entry.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#F3F4F6]">{entry.user.name}</span>
                  {entry.isWinner && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#7E2A0C] text-[#FFD6A7]">
                      <Trophy className="h-3 w-3" />
                      Winner
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#99A1AF]">@{entry.user.username}</span>
              </div>
            </Link>
            <span className="text-sm text-[#99A1AF]">
              {formatDate(entry.submittedAt)}
            </span>
          </div>
        )}

        {/* Entry Content */}
        {(entry.message || entry.content) && (
          <p className="text-[#D1D5DC] text-sm mb-3">
            {entry.message || entry.content}
          </p>
        )}

        {/* Proof Link */}
        {(entry.proofUrl || entry.proofImage) && (
          <a
            href={entry.proofUrl || entry.proofImage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#51A2FF] hover:underline mb-3"
          >
            <ExternalLink className="h-3 w-3" />
            View proof
          </a>
        )}

        {/* Entry Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-[#1E2939]">
          <Button variant="ghost" size="sm" className="text-[#6A7282] px-2">
            <Heart className="h-4 w-4 mr-1" />
            {entry.likes || 0}
          </Button>
          <Button variant="ghost" size="sm" className="text-[#6A7282] px-2">
            <MessageCircle className="h-4 w-4 mr-1" />
            {entry.replyCount || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
