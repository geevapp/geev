'use client';

import type React from 'react';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ScrollRestoration } from '@/components/scroll-restoration';
import { DevUserSwitcher } from '@/components/dev-user-switcher';
import { CreateModal } from '@/components/create-modal';
import { GiveawayModal } from '@/components/giveaway-modal';
import { RequestModal } from '@/components/request-modal';
import { trackEvent } from '@/lib/analytics';
import { useApp } from '@/contexts/app-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

import { Navbar } from '@/components/navbar';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user } = useApp();
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

        <main className="flex-1 md:ml-64 min-h-[calc(100vh-4rem)] pb-16 md:pb-0">
          <Navbar />
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
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
