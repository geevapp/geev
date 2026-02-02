'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Wallet, Trophy, Gift, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { navigationItems } from '@/lib/navigation-items';
import { useApp } from '@/contexts/app-context';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, setShowCreateModal, isHydrated } = useApp();

  if (!isHydrated) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-1 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 transition-all duration-300">
      {/* Profile Card */}
      <div className="mb-6 p-[2px] rounded-3xl bg-linear-to-br from-blue-500 via-purple-500 to-orange-500">
        <div className="bg-[#0f172a] rounded-[22px] p-5 flex flex-col gap-5">
          {/* Header: Avatar & Info */}
          <div className="flex items-center gap-4">
            {user ? (
              <Link href={`/profile/${user.username}`}>
                <Avatar className="h-14 w-14 border-2 border-white/10 shadow-sm">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link href="/login">
                <Avatar className="h-14 w-14 border-2 border-white/10 shadow-sm">
                  <AvatarFallback className='bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>GU</AvatarFallback>
                </Avatar>
              </Link>
            )}

            <div className="flex flex-col gap-1.5 min-w-0">
              <div>
                <h3 className="font-semibold text-white text-sm leading-5 truncate">
                  {user ? user.name : "Guest User"}
                </h3>
                <p className="text-sm text-slate-400 font-medium truncate mt-1">
                  {user ? `@${user.username}` : "@guest"}
                </p>
              </div>

              {/* Rank Badge */}
              {user && (
                <div className="inline-flex items-center gap-1.5 bg-[#7E2A0C] rounded-full px-3 py-1 w-fit">
                  <Trophy className="h-3 w-3 text-[#FFD6A7]" />
                  <span className="text-[10px] font-medium text-[#FFD6A7] tracking-wide whitespace-nowrap">
                    Level {user.rank.level} {user.rank.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Balance */}
          {user && (
            <div className="max-w-[190px] flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
              <span className="text-xs text-slate-400">
                Wallet Balance
              </span>
              <div className="flex items-center gap-2 bg-[#FF6900] text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
                <Wallet className="h-4 w-4" />
                <span>${user.walletBalance.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-1 mb-6">
        {navigationItems.map((item) => {
          const href = item.label === 'Profile' && user
            ? `/profile/${user.username}`
            : item.href;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-orange-600 dark:text-orange-500 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'fill-current text-orange-600 dark:text-orange-500')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Create Post Button */}
      {user ? (
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-[#FF6900] hover:bg-[#FF6900]/80 text-white shadow-lg shadow-orange-600/20 mb-4 h-8 rounded-lg text-sm font-medium tracking-wide"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      ) : (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full mb-4 cursor-not-allowed" tabIndex={0}>
                <Button
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-dashed border-slate-300 dark:border-slate-800 shadow-none h-8 rounded-lg text-sm font-medium tracking-wide pointer-events-none"
                >
                  <Plus className="h-4 w-4 mr-2 opacity-50" />
                  Create Post
                </Button>
              </div >
            </TooltipTrigger >
            <TooltipContent side="bottom" className="dark:bg-slate-800 dark:text-slate-200 font-medium">
              <p>Sign in to create posts</p>
            </TooltipContent>
          </Tooltip >
        </TooltipProvider >
      )
      }

      {/* User Stats */}
      {
        user && (
          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Your Stats
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Gift className="h-4 w-4" />
                  Posts
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {user.postsCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="h-4 w-4" />
                  Followers
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {user.followersCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Trophy className="h-4 w-4" />
                  Badges
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {user.badges.length}
                </span>
              </div>
            </div>
          </div>
        )
      }
    </aside >
  );
}
