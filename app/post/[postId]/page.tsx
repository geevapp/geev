'use client';

import { use } from 'react';
import { useAppContext } from '@/contexts/app-context';
import { MediaCarousel } from '@/components/media-carousel';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Edit, Heart, Flame, MessageCircle, Gift, CheckCircle2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PostCategory } from '@/lib/types';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const { postId } = use(params);
  const { posts, users, user: currentUser, incrementShare } = useAppContext();

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    notFound();
  }

  const creator = post.author;
  const isCreator = currentUser?.id === post.authorId || currentUser?.id === post.creatorId;

  // Format dates
  const createdAt = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
  const endsAt = post.endsAt ? (post.endsAt instanceof Date ? post.endsAt : new Date(post.endsAt)) : null;

  // Get creator initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get status badge
  const getStatusBadge = () => {
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

  // Get category name
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
    return post.type === 'giveaway' ? 'Giveaway' : 'Help Request';
  };

  const categoryName = getCategoryName();
  const isGiveaway = post.type === 'giveaway';

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: url,
        });
        incrementShare(post.id);
      } catch (err) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        incrementShare(post.id);
      } catch (err) {
        console.error('Failed to copy link');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <Link
          href={`/profile/${creator.id || post.authorId}`}
          className="flex items-center gap-4 group"
        >
          <Avatar className="h-16 w-16 ring-2 ring-border group-hover:ring-primary transition-all">
            <AvatarImage src={creator.avatar} alt={creator.name} />
            <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xl font-bold">
              {getInitials(creator.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                {creator.name}
              </h2>
              {creator.isVerified && (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </Link>

        <div className="flex gap-2 w-full sm:w-auto">
          {isCreator && (
            <Link href={`/post/${post.id}/edit`}>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-none"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Media Carousel */}
      {post.media && post.media.length > 0 && (
        <MediaCarousel images={post.media} className="mb-6" />
      )}

      {/* Post content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge
              variant={isGiveaway ? 'default' : 'secondary'}
              className={cn(
                "text-sm",
                isGiveaway
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              )}
            >
              {isGiveaway ? (
                <Gift className="h-4 w-4 mr-1" />
              ) : (
                <Heart className="h-4 w-4 mr-1" />
              )}
              {categoryName}
            </Badge>
            <Badge
              variant={statusBadge.variant}
              className={cn("text-sm", statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {post.title}
          </h1>

          <p className="text-lg whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {post.description}
          </p>

          {/* Giveaway specific details */}
          {isGiveaway && post.prizeAmount && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-1">
                Prize Amount
              </p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {post.prizeAmount} {post.currency || 'XLM'}
              </p>
            </div>
          )}

          {/* Help request specific details */}
          {!isGiveaway && post.targetAmount && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Target Amount
                </p>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  {post.currentAmount || 0} / {post.targetAmount} {post.currency || 'XLM'}
                </p>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(((post.currentAmount || 0) / post.targetAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats and timeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{post.entriesCount || post.entries?.length || 0}</p>
            </div>
            <p className="text-sm text-muted-foreground">Entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{post.likesCount || 0}</p>
            </div>
            <p className="text-sm text-muted-foreground">Likes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{post.burnCount || 0}</p>
            </div>
            <p className="text-sm text-muted-foreground">Burns</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{post.winnerCount || post.maxWinners || 1}</p>
            </div>
            <p className="text-sm text-muted-foreground">Winners</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {endsAt && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="font-medium">
                  {createdAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ends</p>
                <p className="font-medium">
                  {endsAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
                <p className="font-medium text-orange-600 dark:text-orange-400">
                  {formatDistanceToNow(endsAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry list placeholder */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {isGiveaway ? 'Entries' : 'Contributions'}
          </h3>
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {isGiveaway
                ? 'Entry list will be displayed here (Issue 037)'
                : 'Contribution list will be displayed here (Issue 037)'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
