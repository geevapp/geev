'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { ThemeToggle } from '@/components/theme-toggle';

export function GuestNavbar() {
  const { user } = useApp();

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? '/feed' : '/'} className="flex items-center gap-3">
          <img src="/logo-light.png" alt="Geev" className="h-8 dark:hidden" />
          <img
            src="/logo-dark.png"
            alt="Geev"
            className="h-8 hidden dark:block"
          />
          {/* <span className="text-xl font-bold text-gray-900 dark:text-white">Geev</span> */}
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-gray-600 dark:text-gray-300"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Get Started
            </Button>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
