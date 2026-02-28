'use client';

import { signOut, useSession } from 'next-auth/react';

import { AppFooter } from '@/components/app-footer';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { DevUserSwitcher } from './dev-user-switcher';
import { GuestNavbar } from '@/components/guest-navbar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { Navbar } from '@/components/navbar';
import type React from 'react';
import { ScrollRestoration } from '@/components/scroll-restoration';
import cn from 'classnames';
import { useAppContext } from '@/contexts/app-context';
import { useMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAppContext();
  const session = useSession();
  console.log(session);
  const path = usePathname();
  const isMobile = useMobile();
  const noNavPages = ['/', '/register', '/login'];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ScrollRestoration />

        {!noNavPages.includes(path) && <GuestNavbar />}

        <main className="p-0">
          <div className="max-w-screen">{children}</div>
        </main>

        {/* Dev User Switcher - Only visible in development mode */}
        <DevUserSwitcher />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ScrollRestoration />

      {/* Desktop Layout */}
      {!isMobile && (
        <div className="flex">
          <DesktopSidebar />
          <div
            className={cn(
              'flex-1 flex flex-col min-h-screen transition-all duration-300',
              'ml-64',
            )}
          >
            <Navbar />
            <main className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">{children}</div>
            </main>
            <AppFooter />
          </div>
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="flex flex-col min-h-screen pb-16">
          <Navbar />
          <main className="flex-1 p-4">{children}</main>
          <MobileBottomNav />
        </div>
      )}

      {/* Dev User Switcher - Only visible in development mode */}
      <DevUserSwitcher />
    </div>
  );
}
