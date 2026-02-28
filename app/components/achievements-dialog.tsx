"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Badge as BadgeType } from "@/lib/types"

interface AchievementsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  badges: BadgeType[]
  userName: string
}

export function AchievementsDialog({ open, onOpenChange, badges, userName }: AchievementsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-xl font-semibold">Badges</DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {userName}'s earned badges
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {badges.length > 0 ? (
            <div className="grid gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
                >
                  <div className="text-2xl flex-shrink-0">{badge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{badge.name}</h3>
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        Earned
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">{badge.description}</p>
                    <p className="text-xs text-gray-500">{badge.earnedAt.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-medium mb-1">No badges yet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Participate in the community to earn your first badge!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
