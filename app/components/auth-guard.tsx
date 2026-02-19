'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isHydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after hydration is complete and we know user is not logged in
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [user, isHydrated, router]);

  // Show loading while context is hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#101828]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6900] mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-[#99A1AF]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
