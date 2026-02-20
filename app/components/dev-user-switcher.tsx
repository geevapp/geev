'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, LogOut, User as UserIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { login, logout, mockAuthUsers } from '@/lib/mock-auth';

import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/app-context';
import { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleUserSwitch = (userId: string) => {
    if (userId === 'logout') {
      logout();
      contextLogout();
      return;
    }

    const selectedUser = login(userId);
    if (selectedUser) {
      contextLogin(selectedUser);
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
    <div className="fixed hidden md:block bottom-4 right-4 z-50">
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
          className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-xs font-bold">
              DEV
            </div>
            {!isExpanded && user && (
              <span className="text-sm text-gray-300 truncate max-w-[120px]">
                @{user.username}
              </span>
            )}
            {!isExpanded && !user && (
              <span className="text-sm text-gray-400">Guest</span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="p-3 border-t border-gray-700 space-y-3">
            {/* Current User Display */}
            {user && (
              <div className="flex items-center gap-2 p-2 bg-gray-800 dark:bg-gray-700 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
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
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                Switch User
              </label>
              <Select value={user?.id || ''} onValueChange={handleUserSwitch}>
                <SelectTrigger className="w-full bg-gray-800 dark:bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 dark:bg-gray-800 border-gray-700">
                  {mockAuthUsers.map((mockUser) => (
                    <SelectItem
                      key={mockUser.id}
                      value={mockUser.id}
                      className="text-white hover:bg-gray-800 dark:hover:bg-gray-700 focus:bg-gray-800 focus:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={mockUser.avatar}
                            alt={mockUser.name}
                          />
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-[10px]">
                            {getInitials(mockUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{mockUser.name}</span>
                        <span className="text-xs text-gray-400">
                          ({mockUser.rank.title})
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
                className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}

            {/* Login Prompt */}
            {!user && (
              <p className="text-xs text-gray-400 text-center">
                Select a user above to log in
              </p>
            )}

            {/* Dev Info */}
            <div className="pt-2 border-t border-gray-700">
              <p className="text-[10px] text-gray-500 text-center">
                Dev mode only • Auth persists in localStorage
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
