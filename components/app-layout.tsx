'use client';

import type React from 'react';
import { ScrollRestoration } from '@/components/scroll-restoration';
import { DevUserSwitcher } from '@/components/dev-user-switcher';
import { CreateModal } from '@/components/create-modal';
import { GiveawayModal } from '@/components/giveaway-modal';
import { RequestModal } from '@/components/request-modal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ScrollRestoration />

      <main className="p-0">
        <div className="max-w-screen">{children}</div>
      </main>

      {/* Create Modals */}
      <CreateModal />
      <GiveawayModal />
      <RequestModal />

      {/* Dev User Switcher - Only visible in development mode */}
      <DevUserSwitcher />
    </div>
  );
}
