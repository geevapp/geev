'use client'

import { useApp } from '@/contexts/app-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Gift, Heart } from 'lucide-react'

/**
 * CreateModal Component
 * 
 * Modal that allows users to choose between creating a giveaway or help request.
 * Opens the appropriate modal based on selection.
 */
export function CreateModal() {
  const { showCreateModal, setShowCreateModal, setShowGiveawayModal, setShowRequestModal } = useApp()

  const handleCreateGiveaway = () => {
    setShowCreateModal(false)
    setShowGiveawayModal(true)
  }

  const handleCreateRequest = () => {
    setShowCreateModal(false)
    setShowRequestModal(true)
  }

  return (
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Choose the type of post you want to create
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={handleCreateGiveaway}
            className="h-auto p-6 flex flex-col items-start gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            <div className="flex items-center gap-3 w-full">
              <Gift className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold text-lg">Create Giveaway</div>
                <div className="text-sm font-normal opacity-90">
                  Share something with your community
                </div>
              </div>
            </div>
          </Button>
          <Button
            onClick={handleCreateRequest}
            className="h-auto p-6 flex flex-col items-start gap-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
          >
            <div className="flex items-center gap-3 w-full">
              <Heart className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold text-lg">Request Help</div>
                <div className="text-sm font-normal opacity-90">
                  Ask the community for support
                </div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
