'use client';

import { AuthGuard } from '@/components/auth-guard';
import { TimelineFeed } from '@/components/timeline-feed';

export default function FeedPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="max-w-2xl mx-auto">
        <TimelineFeed />
      </div>
    </AuthGuard>
  );
}
