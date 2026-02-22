'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle2,
  LogOut,
  Settings,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAppContext();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
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
    <nav className="hidden md:block sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2">
          <img src="/logo-light.png" alt="Geev" className="h-8 dark:hidden" />
          <img
            src="/logo-dark.png"
            alt="Geev"
            className="h-8 hidden dark:block"
          />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Wallet Balance */}
          <div className="hidden sm:flex items-center gap-2 bg-[#FF6900] text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-md shadow-orange-600/20 transition-transform hover:scale-105">
            <Wallet className="h-4 w-4" />
            <span>$2500.75</span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0"
              >
                <Avatar className="h-9 w-9 border-2 border-gray-100 dark:border-gray-700">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    {user.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">
                    @{user.username}
                  </p>
                  <p className={`text-xs ${user.rank.color}`}>
                    {user.rank.title} • Level {user.rank.level}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/profile/${user.username}`}
                  className="cursor-pointer"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 dark:text-red-400 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
