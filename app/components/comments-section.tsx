'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, MessageSquare, Send } from 'lucide-react';
import type { Post, Comment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { UserRankBadge } from '@/components/user-rank-badge';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';

interface CommentsSectionProps {
  post: Post;
  showAll?: boolean;
  maxComments?: number;
}

interface ReplyFormProps {
  parentId?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

function ReplyForm({
  parentId,
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...'
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(content.trim());
        setContent('');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className={parentId ? "mt-3 pl-11" : "mb-6"}>
      <div className="flex gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.avatarUrl || '/placeholder.svg'} alt={user.name} />
          <AvatarFallback className="text-xs">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] text-sm resize-none"
            rows={2}
            disabled={isSubmitting}
          />
          <div className="flex gap-2 mt-2">
            <Button type="submit" size="sm" disabled={!content.trim() || isSubmitting}>
              <Send className="w-3 h-3 mr-1" />
              {parentId ? 'Reply' : 'Comment'}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

interface ReplyItemProps {
  reply: Comment;
  onDelete: (id: string) => void;
}

function ReplyItem({ reply, onDelete }: ReplyItemProps) {
  const { user } = useAppContext();
  const [isBurned, setIsBurned] = useState(false);
  const router = useRouter();

  const handleBurn = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isBurned) {
      setIsBurned(true);
    }
  };

  return (
    <div className="flex gap-2 py-2 pl-11 group">
      <Link href={`/profile/${reply.user.id}`}>
        <Avatar className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={reply.user.avatarUrl || '/placeholder.svg'} alt={reply.user.name} />
          <AvatarFallback className="text-xs">
            {reply.user.name.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/profile/${reply.user.id}`}
            className="font-medium text-xs text-gray-900 dark:text-gray-100 hover:text-gray-600 transition-colors"
          >
            {reply.user.name}
          </Link>
          <UserRankBadge rank={reply.user.rank} showLevel={false} />
          <span className="text-xs text-gray-500">
            {reply.createdAt.toLocaleDateString()}
          </span>
          {user?.id === reply.user.id && (
            <button
              onClick={() => onDelete(reply.id)}
              className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
            >
              Delete
            </button>
          )}
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {reply.content}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBurn}
            className={`h-5 px-1 text-xs transition-colors ${
              isBurned ? 'text-red-600 hover:text-red-700' : 'text-gray-500 hover:text-orange-500'
            }`}
          >
            <Flame className={`w-3 h-3 mr-1 ${isBurned ? 'fill-current' : ''}`} />
            {isBurned ? 1 : 0}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CommentsSection({
  post,
  showAll = false,
  maxComments = 3,
}: CommentsSectionProps) {
  const { user } = useAppContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/comments?limit=50`);
        const data = await res.json();
        if (data.success) {
          const parsed = data.data.comments.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            replies: c.replies?.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) })) || []
          }));
          setComments(parsed);
        }
      } catch (error) {
        console.error('Failed to fetch comments', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [post.id]);

  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      });
      const data = await res.json();
      
      if (data.success) {
        const newComment = {
          ...data.data,
          createdAt: new Date(data.data.createdAt),
          replies: []
        };

        if (parentId) {
          setComments(prev => prev.map(c => 
            c.id === parentId 
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c
          ));
          setReplyingTo(null);
        } else {
          setComments(prev => [newComment, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  const handleDeleteComment = async (commentId: string, parentId?: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        if (parentId) {
          setComments(prev => prev.map(c => 
            c.id === parentId 
              ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
              : c
          ));
        } else {
          setComments(prev => prev.filter(c => c.id !== commentId));
        }
      }
    } catch (error) {
      console.error('Failed to delete comment', error);
    }
  };

  const displayComments = showAll ? comments : comments.slice(0, maxComments);

  return (
    <div className="space-y-4">
      {showAll && (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Comments ({comments.length})
          </span>
        </div>
      )}

      {user && <ReplyForm onSubmit={(content) => handleSubmitComment(content)} />}

      {isLoading ? (
        <div className="text-center py-4 text-sm text-gray-500">Loading comments...</div>
      ) : (
        <div className="space-y-4">
          {displayComments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            displayComments.map((comment) => (
              <div key={comment.id} className="space-y-2 group">
                <div className="flex gap-3 py-2">
                  <Link href={`/profile/${comment.user.id}`}>
                    <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={comment.user.avatarUrl || '/placeholder.svg'} alt={comment.user.name} />
                      <AvatarFallback className="text-xs">
                        {comment.user.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/profile/${comment.user.id}`}
                        className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-gray-600 transition-colors"
                      >
                        {comment.user.name}
                      </Link>
                      <UserRankBadge rank={comment.user.rank} showLevel={false} />
                      <span className="text-xs text-gray-500">
                        {comment.createdAt.toLocaleDateString()}
                      </span>
                      {user?.id === comment.user.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-gray-500 hover:text-orange-500 transition-colors"
                      >
                        <Flame className="w-3 h-3 mr-1" />
                        0
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Reply {(comment.replies?.length || 0) > 0 && `(${comment.replies?.length})`}
                      </Button>
                    </div>
                  </div>
                </div>

                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-1">
                    {comment.replies.map((reply) => (
                      <ReplyItem 
                        key={reply.id} 
                        reply={reply} 
                        onDelete={(id) => handleDeleteComment(id, comment.id)} 
                      />
                    ))}
                  </div>
                )}

                {replyingTo === comment.id && (
                  <ReplyForm
                    parentId={comment.id}
                    onSubmit={(content) => handleSubmitComment(content, comment.id)}
                    onCancel={() => setReplyingTo(null)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {!showAll && comments.length > maxComments && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link href={`/post/${post.id}`}>
            <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
              View all {comments.length} comments
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
