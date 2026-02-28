"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserRankBadge } from "@/components/user-rank-badge"
import { DollarSign, Heart } from "lucide-react"
import type { HelpContribution } from "@/lib/types"
import Link from "next/link"

interface ContributionListProps {
  contributions: HelpContribution[]
}

export function ContributionList({ contributions }: ContributionListProps) {
  if (contributions.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contributions yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Be the first to help reach this goal!</p>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = contributions.reduce((sum, contribution) => sum + contribution.amount, 0)

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Contributions ({contributions.length})
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Total raised: ${totalAmount.toFixed(2)}</p>
      </CardHeader>

      <div className="space-y-3">
        {contributions
          .sort((a, b) => b.contributedAt.getTime() - a.contributedAt.getTime())
          .map((contribution) => (
            <Card key={contribution.id} className="border-0 shadow-sm bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {!contribution.isAnonymous ? (
                    <Link href={`/profile/${contribution.user.id}`}>
                      <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-green-500 transition-all">
                        <AvatarImage
                          src={contribution.user.avatar || "/placeholder.svg"}
                          alt={contribution.user.name}
                        />
                        <AvatarFallback>
                          {contribution.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  ) : (
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-700">?</AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!contribution.isAnonymous ? (
                          <>
                            <Link
                              href={`/profile/${contribution.user.id}`}
                              className="font-semibold hover:text-green-600 transition-colors"
                            >
                              {contribution.user.name}
                            </Link>
                            <UserRankBadge rank={contribution.user.rank} showLevel={false} />
                          </>
                        ) : (
                          <span className="font-semibold text-gray-600 dark:text-gray-400">Anonymous</span>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ${contribution.amount.toFixed(2)}
                      </Badge>
                    </div>

                    {contribution.message && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{contribution.message}"</p>
                    )}

                    <span className="text-xs text-gray-500">
                      Contributed {contribution.contributedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
