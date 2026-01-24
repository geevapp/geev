'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Search,
  Plus,
  LogOut,
  Settings,
  User as UserIcon,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { useApp } from '@/contexts/app-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { DraftsList } from '@/components/drafts-list'
import { getDraftCount } from '@/lib/drafts'

/**
 * AuthNavbar Component
 *
 * Navigation bar for authenticated users.
 * Shows user info, quick actions, and navigation links.
 *

export function AuthNavbar() {
  const router = useRouter()
  const { user, logout, setShowCreateModal } = useApp()
  const [draftCount, setDraftCount] = useState(0)
  const [showDraftsList, setShowDraftsList] = useState(false)

  if (!user) {
    return null
  }

  useEffect(() => {
    // Load draft count
    setDraftCount(getDraftCount())

    // Listen for draft changes
    const handleStorageChange = () => {
      setDraftCount(getDraftCount())
    }

    // Listen to custom events for draft updates
    window.addEventListener('draftSaved', handleStorageChange)
    window.addEventListener('draftDeleted', handleStorageChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('draftSaved', handleStorageChange)
      window.removeEventListener('draftDeleted', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts, users..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Drafts */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowDraftsList(true)}
            title="View drafts"
          >
            <FileText className="h-5 w-5" />
            {draftCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-500 hover:bg-orange-600">
                {draftCount > 9 ? '9+' : draftCount}
              </Badge>
            )}
          </Button>

          {/* Create Post */}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
          </Button>

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
                    <p className="text-sm font-medium leading-none">{user.name}</p>
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
                <Link href={`/profile/${user.username}`} className="cursor-pointer">
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

      {/* Drafts List Modal */}
      <DraftsList open={showDraftsList} onOpenChange={setShowDraftsList} />
    </nav>
  )
}
