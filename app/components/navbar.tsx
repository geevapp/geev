"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Settings, Sun, User, Wallet } from "lucide-react";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { UserRankBadge } from '@/components/user-rank-badge';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout, theme, toggleTheme } = useAppContext();
  const router = useRouter();

  // ✅ Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // ✅ Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query) {
        fetch(`/api/posts?q=${query}`)
          .then((res) => res.json())
          .then((data) => {
            setResults(data?.data?.posts || []);
          });
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <nav className="border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={user ? "/feed" : "/"}
            className="flex items-center space-x-3 group"
          >
            <img src="/logo-light.png" alt="Geev" className="h-8 dark:hidden" />
            <img
              src="/logo-dark.png"
              alt="Geev"
              className="h-8 hidden dark:block"
            />
          </Link>

          {/* ✅ Search Bar */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="px-3 py-1 border rounded-md w-64"
            />

            {/* ✅ Search Results Dropdown */}
            {query && results.length > 0 && (
              <div className="absolute top-10 left-0 w-full bg-white dark:bg-gray-800 shadow-md rounded-md p-2 z-50">
                {results.map((post: any) => (
                  <div
                    key={post.id}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                  >
                    {post.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Wallet Balance */}
              {(user.walletBalance ?? 0) > 0 && (
                <Link href="/wallet">
                  <Badge className="hidden sm:flex items-center gap-1 bg-orange-500 text-white border-0 hover:bg-orange-600 transition-all cursor-pointer">
                    <Wallet className="w-3 h-3" />$
                    {(user.walletBalance ?? 0).toFixed(2)}
                  </Badge>
                </Link>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user.avatarUrl || "/placeholder.svg"}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-sm font-medium">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-64 rounded-xl border-gray-200 dark:border-gray-700 shadow-lg"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </p>
                      <div className="pt-1">
                        <UserRankBadge rank={user.rank} />
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex items-center py-2"
                    >
                      <User className="mr-3 h-4 w-4 text-gray-500" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex items-center py-2">
                      <Wallet className="mr-3 h-4 w-4 text-gray-500" />
                      <span>Wallet</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center py-2">
                      <Settings className="mr-3 h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
