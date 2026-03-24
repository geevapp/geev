'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';

/**
 * DevUserSwitcher Component
 *
 * A floating developer tool for quickly switching between mock users.
 * Only renders in development mode (NODE_ENV === 'development').
 *
 * Features:
 * - Fixed position at bottom-right of viewport
 * - Collapsible panel to minimize screen clutter
 * - Dropdown to select any mock user
 * - Quick logout button
 * - Shows current user info when collapsed
 */
export function DevUserSwitcher() {
  const { user, login: contextLogin, logout: contextLogout } = useAppContext();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mockAuthUsers, setMockAuthUsers] = useState([] as User[]);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);

  // Only render in development mode
  if (
    process.env.NODE_ENV !== 'development' ||
    typeof location === 'undefined'
  ) {
    return null;
  }

  useEffect(() => {
    if (hasLoadedUsers) return;

    let isMounted = true;

    fetch('/api/dev-users')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setMockAuthUsers(data?.data ?? []);
          setHasLoadedUsers(true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to fetch dev users:', err);
          setHasLoadedUsers(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasLoadedUsers]);

  const handleUserSwitch = async (userId: string) => {
    if (userId === 'logout') {
      await contextLogout();
      return;
    }

    const selectedUser = mockAuthUsers.find((u) => u.id === userId);

    if (selectedUser) {
      const walletAddress = selectedUser.walletAddress || '0x0';
      const timestamp = new Date().toISOString();

      const result = await contextLogin(selectedUser, {
        walletAddress,
        email: selectedUser.email ?? `${walletAddress}@example.com`, // Fallback email for mock users
        signature: '0x' + Math.random().toString(36).substring(2, 30),
        message: `Sign this message to authenticate with Geev\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`,
      });

      if (!result?.error) {
        router.push('/feed');
        router.refresh();
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed z-50 hidden md:block bottom-4 right-4">
      <div
        className={`
          bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl
          border border-gray-700 overflow-hidden transition-all duration-200
          ${isExpanded ? 'w-72' : 'w-auto'}
        `}
      >
        {/* Header / Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full gap-2 px-3 py-2 transition-colors hover:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold bg-orange-500 rounded">
              DEV
            </div>
            {!isExpanded && user && (
              <span className="text-sm text-gray-300 truncate max-w-30">
                @{user.username}
              </span>
            )}
            {!isExpanded && !user && (
              <span className="text-sm text-gray-400">Guest</span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="p-3 space-y-3 border-t border-gray-700">
            {/* Current User Display */}
            {user && (
              <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg dark:bg-gray-700">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatarUrl ?? ''} alt={user.name} />
                  <AvatarFallback className="text-xs text-orange-700 bg-orange-100">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </div>
            )}

            {/* User Selector */}
            <div className="space-y-1.5">
              <label className="text-xs tracking-wider text-gray-400 uppercase">
                Switch User
              </label>
              <Select value={user?.id || ''} onValueChange={handleUserSwitch}>
                <SelectTrigger className="w-full text-white bg-gray-800 border-gray-600 dark:bg-gray-700">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 dark:bg-gray-800">
                  {mockAuthUsers.map((mockUser) => (
                    <SelectItem
                      key={mockUser.id}
                      value={mockUser.id}
                      className="text-white hover:bg-gray-800 dark:hover:bg-gray-700 focus:bg-gray-800 focus:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage
                            src={mockUser.avatarUrl ?? ''}
                            alt={mockUser.name}
                          />
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-[10px]">
                            {getInitials(mockUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{mockUser.name}</span>
                        <span className="text-xs text-gray-400">
                          ({mockUser.rank?.title ?? 'User'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Logout Button */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUserSwitch('logout')}
                className="w-full text-gray-300 bg-transparent border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}

            {/* Login Prompt */}
            {!user && (
              <p className="text-xs text-center text-gray-400">
                Select a user above to log in
              </p>
            )}

            {/* Dev Info */}
            <div className="pt-2 border-t border-gray-700">
              <p className="text-[10px] text-gray-500 text-center">
                Dev mode only • Auth uses Prisma users
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
