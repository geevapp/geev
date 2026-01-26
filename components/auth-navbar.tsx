"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  Bell,
  Search,
  Plus,
  LogOut,
  Settings,
  User as UserIcon,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * AuthNavbar Component
 *
 * Navigation bar for authenticated users.
 * Shows user info, quick actions, and navigation links.
 *
 * Features:
 * - User avatar with dropdown menu
 * - Theme toggle
 * - Notifications (placeholder)
 * - Create post button
 * - Logout functionality
 */
export function AuthNavbar() {
  const router = useRouter();
  const { user, theme, toggleTheme, logout, setShowCreateModal } = useApp();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[rgba(16,24,40,0.95)] border-b border-gray-200 dark:border-[#1E2939] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-3">
          <img src="/logo-light.png" alt="Geev" className="h-8 dark:hidden" />
          <img
            src="/logo-dark.png"
            alt="Geev"
            className="h-8 hidden dark:block"
          />
        </Link>

        {/* Search (placeholder) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#99A1AF]" />
            <input
              type="text"
              placeholder="Search posts, users..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1E2939] border-0 focus:ring-2 focus:ring-[#FF6900] text-sm text-gray-900 dark:text-[#F3F4F6] placeholder:text-gray-500 dark:placeholder:text-[#99A1AF]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Create Post */}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#FF6900] hover:bg-[#FF6900]/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative text-gray-700 dark:text-[#FAFAFA] hover:bg-gray-100 dark:hover:bg-[#1E2939]">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6900] rounded-full" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl text-gray-700 dark:text-[#FAFAFA] hover:bg-gray-100 dark:hover:bg-[#1E2939]"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0"
              >
                <Avatar className="h-9 w-9 border-2 border-gray-100 dark:border-[#364153]">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-[#364153] dark:text-[#F3F4F6]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-[#101828] dark:border-[#1E2939]" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium leading-none text-gray-900 dark:text-[#F3F4F6]">
                      {user.name}
                    </p>
                    {user.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs leading-none text-gray-500 dark:text-[#99A1AF]">
                    @{user.username}
                  </p>
                  <p className={`text-xs ${user.rank.color}`}>
                    {user.rank.title} • Level {user.rank.level}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dark:bg-[#1E2939]" />
              <DropdownMenuItem asChild className="dark:text-[#F3F4F6] dark:focus:bg-[#1E2939]">
                <Link href={`/profile/${user.id}`} className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="dark:text-[#F3F4F6] dark:focus:bg-[#1E2939]">
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-[#1E2939]" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 dark:text-red-400 cursor-pointer dark:focus:bg-[#1E2939]"
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
