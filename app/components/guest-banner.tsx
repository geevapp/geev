"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Gift, ArrowRight } from "lucide-react"
import Link from "next/link"

export function GuestBanner() {
  return (
    <Card className="border-0 bg-gradient-to-r from-blue-500 to-orange-600 text-white mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Welcome to Geev!</h3>
              <p className="text-blue-100">Join our community to create giveaways and help others</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started
                <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
