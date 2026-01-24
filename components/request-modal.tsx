'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/app-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createDraft, updateDraft, getDraft } from '@/lib/drafts'
import type { Draft } from '@/lib/types'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RequestModalProps {
  draftId?: string
}

/**
 * RequestModal Component
 * 
 * Modal for creating or editing a help request post.
 * Supports saving as draft and loading from draft.
 */
export function RequestModal({ draftId }: RequestModalProps) {
  const { 
    showRequestModal, 
    setShowRequestModal, 
    user, 
    createPost 
  } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currency, setCurrency] = useState('XLM')
  const [duration, setDuration] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)

  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId && showRequestModal) {
      const draft = getDraft(draftId)
      if (draft && draft.type === 'request') {
        setTitle(draft.title || '')
        setDescription(draft.description || '')
        setCategory(draft.category || '')
        setTargetAmount(draft.targetAmount?.toString() || '')
        setCurrency(draft.currency || 'XLM')
        setDuration(draft.duration?.toString() || '')
        setCurrentDraftId(draft.id)
      }
    } else if (!draftId && showRequestModal) {
      // Reset form when opening new modal
      setTitle('')
      setDescription('')
      setCategory('')
      setTargetAmount('')
      setCurrency('XLM')
      setDuration('')
      setCurrentDraftId(undefined)
    }
  }, [draftId, showRequestModal])

  // Listen for loadDraft events
  useEffect(() => {
    const handleLoadDraft = (event: CustomEvent) => {
      if (event.detail.draftId) {
        const draft = getDraft(event.detail.draftId)
        if (draft && draft.type === 'request') {
          setTitle(draft.title || '')
          setDescription(draft.description || '')
          setCategory(draft.category || '')
          setTargetAmount(draft.targetAmount?.toString() || '')
          setCurrency(draft.currency || 'XLM')
          setDuration(draft.duration?.toString() || '')
          setCurrentDraftId(draft.id)
        }
      }
    }

    window.addEventListener('loadDraft', handleLoadDraft as EventListener)
    return () => {
      window.removeEventListener('loadDraft', handleLoadDraft as EventListener)
    }
  }, [])

  const handleSaveDraft = () => {
    if (!title.trim() && !description.trim()) {
      toast.error('Please add at least a title or description to save as draft')
      return
    }

    const draftData: Omit<Draft, 'id' | 'savedAt' | 'updatedAt'> = {
      type: 'request',
      title: title.trim() || 'Untitled Request',
      description: description.trim(),
      category: category || undefined,
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      currency: currency || undefined,
      duration: duration ? parseInt(duration) : undefined,
    }

    if (currentDraftId) {
      updateDraft(currentDraftId, draftData)
      toast.success('Draft updated')
    } else {
      const draft = createDraft(draftData)
      setCurrentDraftId(draft.id)
      toast.success('Draft saved')
    }
  }

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }
    if (!user) {
      toast.error('You must be logged in to create a post')
      return
    }

    setIsLoading(true)

    try {
      createPost({
        type: 'help-request',
        category: category || undefined,
        title: title.trim(),
        description: description.trim(),
        authorId: user.id,
        status: 'open',
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        currency: currency || undefined,
        duration: duration ? parseInt(duration) : undefined,
      })

      // Delete draft if it exists
      if (currentDraftId) {
        const { deleteDraft } = await import('@/lib/drafts')
        deleteDraft(currentDraftId)
      }

      toast.success('Help request created successfully!')
      setShowRequestModal(false)
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('')
      setTargetAmount('')
      setCurrency('XLM')
      setDuration('')
      setCurrentDraftId(undefined)
    } catch (error) {
      toast.error('Failed to create help request')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentDraftId ? 'Edit Draft' : 'Request Help'}
            {currentDraftId && (
              <Badge variant="outline" className="text-xs">
                Draft
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentDraftId
              ? 'Continue editing your draft'
              : 'Ask the community for support'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Need help with my project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what you need help with..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Development, Design, Funding"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XLM">XLM</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isLoading || !title.trim() || !description.trim()}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Publishing...' : 'Publish Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
