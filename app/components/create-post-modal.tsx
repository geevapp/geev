"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift, Heart } from "lucide-react"

interface CreatePostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectType: (type: "giveaway" | "help-request") => void
}

export function CreatePostModal({ open, onOpenChange, onSelectType }: CreatePostModalProps) {
  const handleSelectType = (type: "giveaway" | "help-request") => {
    onSelectType(type)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Post</DialogTitle>
          <DialogDescription>Choose what type of post you'd like to create</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500"
            onClick={() => handleSelectType("giveaway")}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Create Giveaway</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>
                Share your success by giving back to the community. Set prizes, requirements, and select winners.
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500"
            onClick={() => handleSelectType("help-request")}
          >
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">Request Help</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>
                Ask the community for support with your goals. Set a target amount and let others contribute.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
