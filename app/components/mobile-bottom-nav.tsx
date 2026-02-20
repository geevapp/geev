'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { navigationItems } from '@/lib/navigation-items';
import { useAppContext } from '@/contexts/app-context';
import { usePathname } from 'next/navigation';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAppContext();

  // Filter items for mobile bottom nav (max 5)
  // We'll exclude 'Settings' as it's less frequently accessed directly from bottom nav
  const mobileItems = navigationItems
    .filter((item) => item.label !== 'Settings')
    .slice(0, 5);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileItems.map((item) => {
          const href =
            item.label === 'Profile' && user
              ? `/profile/${user.username}`
              : item.href;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1',
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  isActive && 'bg-orange-50 dark:bg-orange-900/20',
                )}
              >
                <item.icon
                  className={cn('h-6 w-6', isActive && 'fill-current')}
                />
              </div>
              {/* Optional: Add sr-only text for accessibility */}
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
