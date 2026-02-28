'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Home,
  Plus,
  Settings,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserRankBadge } from '@/components/user-rank-badge';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/app-context';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function DesktopSidebar() {
  const { user, setShowCreateModal } = useAppContext(); // Use setShowCreateModal instead of local state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Activity', href: '/activity', icon: TrendingUp },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const stats = [
    { label: 'Posts', value: user?._count.posts || 0, icon: Gift },
    { label: 'Followers', value: user?._count.followers || 0, icon: Users },
    { label: 'Badges', value: user?._count.badges || 0, icon: Trophy },
  ];

  return (
    <div
      className={cn(
        'fixed left-0 top-0 flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Collapse Toggle */}
      <div className="flex items-center justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className={cn('px-4 pb-6', isCollapsed && 'px-2')}>
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 via-orange-500 to-pink-500 p-[1px] shadow-lg">
            <Card className="bg-white dark:bg-gray-900 rounded-lg">
              <CardContent className={cn('p-4', isCollapsed && 'p-2')}>
                {isCollapsed ? (
                  <div className="flex justify-center">
                    <Link href={`/profile/${user.id}`}>
                      <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                        <AvatarImage
                          src={user.avatarUrl || '/placeholder.svg'}
                          alt={user.name}
                        />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-orange-500 text-white">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link href={`/profile/${user.id}`}>
                      <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                        <AvatarImage
                          src={user.avatarUrl || '/placeholder.svg'}
                          alt={user.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-orange-500 text-white">
                          {user.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${user.id}`}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors block truncate"
                      >
                        {user.name}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                      <div className="mt-2">
                        <UserRankBadge rank={user.rank} />
                      </div>
                    </div>
                  </div>
                )}

                {!isCollapsed && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Wallet Balance
                      </span>
                      <Link href="/wallet">
                        <Badge className="text-xs bg-orange-500 text-white border-0 hover:bg-orange-600 transition-all cursor-pointer">
                          <Wallet className="w-3 h-3 mr-1" />$
                          {/* {user.walletBalance?.toFixed(2)} */}
                          00.00
                        </Badge>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                  isCollapsed ? 'px-2 justify-center h-10 w-10' : 'px-4 h-10',
                  isActive &&
                    'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                )}
              >
                <item.icon className={cn('h-4 w-4', !isCollapsed && 'mr-3')} />
                {!isCollapsed && <span className="text-sm">{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Create Post Button */}
      {!isCollapsed && user && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={() => setShowCreateModal(true)} // Use context method instead of dispatch
            className="w-full cursor-pointer bg-orange-500 hover:bg-orange-600 text-white border-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      )}

      {/* Stats Section */}
      {!isCollapsed && user && (
        <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Your Stats
          </h3>
          <div className="space-y-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <stat.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
