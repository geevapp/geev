'use client';

import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Heart, Flame, MessageCircle, Gift, CheckCircle2 } from 'lucide-react';
import { Post, PostStatus, PostCategory } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * PostCard Component
 * 
 * A reusable card component for displaying post information in the feed.
 * Shows creator info, title, description preview, category, media thumbnail,
 * stats, status, and CTA button.
 * 
 * @example
 * ```tsx
 * <PostCard post={post} />
 * ```
 */
export function PostCard({ post }: { post: Post }) {
  // Use post.author directly (required field in Post type)
  const creator = post.author;
  
  // Truncate description at 200 characters
  const truncatedDesc =
    post.description.length > 200
      ? post.description.slice(0, 200) + '...'
      : post.description;

  // Get first media image URL
  const firstImage = post.media?.find((m) => m.type === 'image')?.url;
  
  // Format timestamp
  const createdAt = post.createdAt instanceof Date 
    ? post.createdAt 
    : new Date(post.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  // Get status badge variant and label
  const getStatusBadge = () => {
    // Convert to string to avoid TypeScript narrowing issues
    const statusStr = String(post.status);
    
    if (statusStr === 'open' || statusStr === 'active') {
      return { variant: 'default' as const, label: 'Open', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' };
    }
    if (statusStr === 'in-progress') {
      return { variant: 'default' as const, label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' };
    }
    if (statusStr === 'completed') {
      return { variant: 'secondary' as const, label: 'Completed', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    }
    if (statusStr === 'cancelled') {
      return { variant: 'destructive' as const, label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' };
    }
    return { variant: 'outline' as const, label: statusStr, className: '' };
  };

  const statusBadge = getStatusBadge();

  // Get category display name
  const getCategoryName = () => {
    if (post.category) {
      switch (post.category) {
        case PostCategory.Giveaway:
          return 'Giveaway';
        case PostCategory.HelpRequest:
          return 'Help Request';
        case PostCategory.SkillShare:
          return 'Skill Share';
        default:
          return String(post.category);
      }
    }
    // Fallback to type if category not available
    return post.type === 'giveaway' ? 'Giveaway' : 'Help Request';
  };

  const categoryName = getCategoryName();
  const isGiveaway = post.type === 'giveaway';

  // Get creator initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-200 cursor-pointer",
        "border-border hover:border-primary/50",
        "overflow-hidden"
      )}
    >
      <Link href={`/post/${post.id}`} className="block">
        <CardContent className="p-4">
          {/* Creator info */}
          <div className="flex items-center gap-3 mb-3">
            <Link 
              href={`/profile/${creator.id || post.authorId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={creator.avatar} alt={creator.name} />
                <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {getInitials(creator.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {creator.name}
                  </p>
                  {creator.isVerified && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {timeAgo}
                </p>
              </div>
            </Link>
            
            {/* Category and Status badges */}
            <div className="flex items-center gap-2 shrink-0">
              <Badge 
                variant={isGiveaway ? 'default' : 'secondary'}
                className={cn(
                  "text-xs",
                  isGiveaway
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                )}
              >
                {isGiveaway ? (
                  <Gift className="h-3 w-3 mr-1" />
                ) : (
                  <Heart className="h-3 w-3 mr-1" />
                )}
                {categoryName}
              </Badge>
              <Badge 
                variant={statusBadge.variant}
                className={cn("text-xs", statusBadge.className)}
              >
                {statusBadge.label}
              </Badge>
            </div>
          </div>

          {/* Title and description */}
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {truncatedDesc}
          </p>

          {/* Media thumbnail */}
          {firstImage && (
            <div className="w-full aspect-video rounded-md overflow-hidden mb-3 bg-muted">
              <img
                src={firstImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {(() => {
                const count = post.entriesCount || post.entries?.length || 0;
                return `${count} ${count === 1 ? 'entry' : 'entries'}`;
              })()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {post.likesCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              {post.burnCount || 0}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t border-border">
          <Button
            className={cn(
              "w-full",
              isGiveaway 
                ? "bg-orange-500 hover:bg-orange-600 text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            )}
            onClick={(e) => {
              e.preventDefault();
              // Navigation handled by Link wrapper
            }}
          >
            {isGiveaway ? 'Enter Giveaway' : 'Offer Help'}
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}

/**
 * PostCardSkeleton Component
 * 
 * Loading skeleton state for PostCard component.
 * Matches the card layout for smooth loading transitions.
 */
export function PostCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Creator info skeleton */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1.5" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-muted rounded-full animate-pulse shrink-0" />
        </div>

        {/* Media thumbnail skeleton */}
        <div className="w-full aspect-video rounded-md bg-muted animate-pulse mb-3" />

        {/* Title skeleton */}
        <div className="h-5 w-full bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-2" />

        {/* Description skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-3 w-full bg-muted rounded animate-pulse" />
          <div className="h-3 w-full bg-muted rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t border-border">
        <div className="h-9 w-full bg-muted rounded animate-pulse" />
      </CardFooter>
    </Card>
  );
}
