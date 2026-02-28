"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserRankBadge } from "@/components/user-rank-badge"
import { ExternalLink, Trophy } from "lucide-react"
import type { Entry } from "@/lib/types"
import Link from "next/link"

interface EntryListProps {
  entries: Entry[]
  showWinners?: boolean
}

export function EntryList({ entries, showWinners = false }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Be the first to enter this giveaway!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Entries ({entries.length})
        </CardTitle>
      </CardHeader>

      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Link href={`/profile/${entry.user.id}`}>
                  <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                    <AvatarImage src={entry.user.avatar || "/placeholder.svg"} alt={entry.user.name} />
                    <AvatarFallback>
                      {entry.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${entry.user.id}`}
                      className="font-semibold hover:text-blue-600 transition-colors"
                    >
                      {entry.user.name}
                    </Link>
                    <UserRankBadge rank={entry.user.rank} showLevel={false} />
                    {entry.isWinner && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Trophy className="w-3 h-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm">{entry.content}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Submitted {entry.submittedAt.toLocaleDateString()}</span>
                    {entry.proofUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Proof
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
