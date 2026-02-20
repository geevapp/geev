'use client';

import { useEffect, useRef } from 'react';

import { CreateModal } from '@/components/create-modal';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DevUserSwitcher } from '@/components/dev-user-switcher';
import { GiveawayModal } from '@/components/create-giveaway-modal';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { Navbar } from '@/components/navbar';
import type React from 'react';
import { RequestModal } from '@/components/request-modal';
import { ScrollRestoration } from '@/components/scroll-restoration';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { useAppContext } from '@/contexts/app-context';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user } = useAppContext();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathRef.current === pathname) return;

    lastPathRef.current = pathname;
    trackEvent(
      'page_view',
      { path: pathname },
      user ? { userId: user.id } : undefined,
    );
  }, [pathname, user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ScrollRestoration />

      <div className="flex">
        <DesktopSidebar />

        <main
          className={cn(
            `flex-1 ${user ? 'md:ml-64' : ''} min-h-[calc(100vh-4rem)] pb-16 md:pb-0`,
          )}
        >
          <Navbar />
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Create Modals */}
      <CreateModal />
      <GiveawayModal />
      <RequestModal />

      {/* Dev User Switcher - Only visible in development mode */}
      <DevUserSwitcher />
    </div>
  );
}
