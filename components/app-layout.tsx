'use client';

import type React from 'react';
import { ScrollRestoration } from '@/components/scroll-restoration';
import { DevUserSwitcher } from '@/components/dev-user-switcher';

interface AppLayoutProps {
  children: React.ReactNode;
}

import { Navbar } from '@/components/navbar';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

export function AppLayout({ children }: AppLayoutProps) {
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

      {/* Dev User Switcher - Only visible in development mode */}
      <DevUserSwitcher />
    </div>
  );
}
