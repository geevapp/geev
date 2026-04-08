'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface FollowUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: 'followers' | 'following';
}

export function FollowListDialog({
  open,
  onOpenChange,
  userId,
  type,
}: FollowListDialogProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/users/${userId}/${type}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUsers(data.data.items || []);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setUsers([]);
    }
  }, [open, userId, type]);

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">Loading...</div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Link href={`/profile/${user.id}`} onClick={() => onOpenChange(false)}>
                  <Avatar className="w-10 h-10 cursor-pointer">
                    <AvatarImage src={user.avatarUrl || '/placeholder.svg'} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.id}`} onClick={() => onOpenChange(false)}>
                    <h4 className="font-semibold text-sm hover:underline truncate">
                      {user.name}
                    </h4>
                  </Link>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500 py-4">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
