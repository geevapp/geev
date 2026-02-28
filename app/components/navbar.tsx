"use client";

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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserRankBadge } from "@/components/user-rank-badge";
import { useAppContext } from "@/contexts/app-context";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, logout, theme, toggleTheme } = useAppContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

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
            {/* <span className="text-xl font-bold text-orange-600 dark:text-orange-400">Geev</span> */}
          </Link>

          {/* User Menu */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Wallet Balance */}
              {user.walletBalance > 0 && (
                <Link href="/wallet">
                  <Badge className="hidden sm:flex items-center gap-1 bg-orange-500 text-white border-0 hover:bg-orange-600 transition-all cursor-pointer">
                    <Wallet className="w-3 h-3" />$
                    {user.walletBalance.toFixed(2)}
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
                        src={user.avatar || "/placeholder.svg"}
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
                      <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </p>
                      <div className="pt-1">
                        <UserRankBadge rank={user.rank} />
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                  <DropdownMenuItem asChild className="rounded-lg mx-2 my-1">
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex items-center py-2"
                    >
                      <User className="mr-3 h-4 w-4 text-gray-500" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg mx-2 my-1">
                    <Link href="/wallet" className="flex items-center py-2">
                      <Wallet className="mr-3 h-4 w-4 text-gray-500" />
                      <span>Wallet</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg mx-2 my-1">
                    <Link href="/settings" className="flex items-center py-2">
                      <Settings className="mr-3 h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400 rounded-lg mx-2 my-1 focus:bg-red-50 dark:focus:bg-red-950/20"
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
