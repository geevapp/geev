'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Comment as CommentType, Post, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { UserRankBadge } from '@/components/user-rank-badge';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface CommentsSectionProps {
  post: Post;
  showAll?: boolean;
  maxComments?: number;
}

interface ReplyFormProps {
  parentId?: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

function ReplyForm({ parentId, onSubmit, onCancel }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const { user } = useAppContext();

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 pl-10">
      <div className="flex gap-2">
        <Avatar className="w-6 h-6">
          <AvatarImage src={user.avatarUrl || '/placeholder.svg'} alt={user.name} />
          <AvatarFallback className="text-xs">
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
          <div className="flex gap-2 mt-2">
            <Button type="submit" size="sm" disabled={!content.trim()}>
              Post
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

interface CommentItemProps {
  comment: CommentType;
  level?: number;
  currentUser: User | null;
  onReply: (commentId: string) => void;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  onSubmitReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

function CommentItem({
  comment,
  level = 0,
  currentUser,
  onReply,
  replyingToId,
  setReplyingToId,
  onSubmitReply,
  onDelete,
}: CommentItemProps) {
  const marginClass = level === 0 ? '' : 'pl-10';
  const commentDate = new Date(comment.createdAt).toLocaleDateString();
  const isOwner = currentUser?.id === comment.userId;

  return (
    <div key={comment.id} className={`space-y-2 ${marginClass}`}>
      <div className="flex gap-3 py-2">
        <Link href={`/profile/${comment.user.id}`}>
          <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={comment.user.avatarUrl || '/placeholder.svg'} alt={comment.user.name} />
            <AvatarFallback className="text-xs">
              {comment.user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
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
            <span className="text-xs text-gray-500">{commentDate}</span>
            {isOwner && (
              <Button
                variant="ghost"
                size="xs"
                className="text-red-500 hover:text-red-700"
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Reply
            </Button>
          </div>
        </div>
      </div>

      {replyingToId === comment.id && (
        <ReplyForm
          onSubmit={(body) => onSubmitReply(comment.id, body)}
          onCancel={() => setReplyingToId(null)}
        />
      )}

      {comment.replies?.length > 0 && (
        <div className="space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              currentUser={currentUser}
              onReply={onReply}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsSection({ post, showAll = false, maxComments = 3 }: CommentsSectionProps) {
  const { user } = useAppContext();
  const router = useRouter();

  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments?page=1&limit=100`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch comments');
      }

      const normalizeComment = (comment: any): CommentType => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
        replies: Array.isArray(comment.replies)
          ? comment.replies.map(normalizeComment)
          : [],
      });

      const parsed = data.data.comments.map((comment: any) => normalizeComment(comment));
      setComments(parsed);
    } catch (e: any) {
      setError(e.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const updateTreeWithReply = (nodes: CommentType[], parentId: string, reply: CommentType): CommentType[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          replies: [...(node.replies || []), reply],
        };
      }
      if (node.replies?.length) {
        return { ...node, replies: updateTreeWithReply(node.replies, parentId, reply) };
      }
      return node;
    });
  };

  const removeCommentFromTree = (nodes: CommentType[], commentId: string): CommentType[] => {
    return nodes
      .filter((node) => node.id !== commentId)
      .map((node) => ({
        ...node,
        replies: node.replies ? removeCommentFromTree(node.replies, commentId) : [],
      }));
  };

  const addComment = async (content: string, parentId?: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const payload: any = { content };
    if (parentId) payload.parentId = parentId;

    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to post comment');
      }

      const created: CommentType = {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        replies: [],
      };

      if (parentId) {
        setComments((prev) => updateTreeWithReply(prev, parentId, created));
        setReplyingToId(null);
      } else {
        setComments((prev) => [created, ...prev]);
        setNewCommentText('');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to submit comment');
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete comment');
      }
      setComments((prev) => removeCommentFromTree(prev, commentId));
    } catch (e: any) {
      setError(e.message || 'Failed to delete comment');
    } finally {
      setLoading(false);
    }
  };

  const displayComments = useMemo(() => {
    return showAll ? comments : comments.slice(0, maxComments);
  }, [comments, showAll, maxComments]);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
        <h3 className="text-sm font-semibold mb-2">Comments ({comments.length})</h3>
        <Textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[80px] text-sm"
          rows={3}
        />
        <div className="flex justify-end mt-2 gap-2">
          <Button
            onClick={() => addComment(newCommentText)}
            disabled={!newCommentText.trim() || loading}
          >
            Post Comment
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading comments...</p>}

      {displayComments.length === 0 && !loading ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">No comments yet</div>
      ) : (
        <div className="space-y-3">
          {displayComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              onReply={(commentId) => setReplyingToId(commentId)}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              onSubmitReply={addComment}
              onDelete={deleteComment}
            />
          ))}
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
