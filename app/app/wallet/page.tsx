"use client"

import { AuthGuard } from "@/components/auth-guard"
import { WalletManagement } from "@/components/wallet-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WalletPage() {
  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Wallet</h1>
        </div>

        <WalletManagement />
      </div>
    </AuthGuard>
  )
}
