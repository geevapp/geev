"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, User as UserIcon, Shield, Sparkles } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { mockAuthUsers } from "@/lib/mock-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/types";
import { signIn } from "next-auth/react";

/**
 * LoginForm Component
 *
 * Displays a grid of mock users for easy login during development and testing.
 * Users can click on any user card to instantly log in as that user.
 *
 * Features:
 * - Responsive grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
 * - User cards showing avatar, name, username, verification status
 * - Visual indicators for rank and badge count
 * - Loading state during login
 * - Redirects to /feed after successful login
 */
export function LoginForm() {
  const router = useRouter();
  const { login: contextLogin } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleLogin = async (user: User) => {
    setIsLoading(true);
    setSelectedUserId(user.id);

    try {
      const result = await signIn("credentials", {
        email: user.email,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/feed");
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
      setSelectedUserId(null);
    }
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select a User to Continue
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose from our test users to explore the app
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAuthUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => handleLogin(user)}
            disabled={isLoading}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              text-left w-full
              ${
                selectedUserId === user.id
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700"
              }
              ${
                isLoading && selectedUserId !== user.id
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-md cursor-pointer"
              }
              bg-white dark:bg-gray-900
            `}
          >
            {/* Loading indicator */}
            {selectedUserId === user.id && isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-xl">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" />
              </div>
            )}

            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar className="h-12 w-12 border-2 border-gray-100 dark:border-gray-700">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {user.name}
                  </span>
                  {user.isVerified && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {user.followersCount.toLocaleString()}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${user.rank.color}`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {user.rank.title}
                  </span>
                  {user.badges.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {user.badges.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Role Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {user.rank.level >= 4 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                >
                  Top Giver
                </Badge>
              )}
              {user.postsCount === 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                >
                  New User
                </Badge>
              )}
              {user.followersCount < 50 && user.postsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                >
                  Receiver
                </Badge>
              )}
              {!user.walletAddress && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  No Wallet
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Guest Mode Note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is a mock authentication system for development purposes.
          <br />
          <span className="text-xs">
            Your selection will persist until you log out or clear browser
            storage.
          </span>
        </p>
      </div>
    </div>
  );
}
