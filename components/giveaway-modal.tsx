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

interface GiveawayModalProps {
  draftId?: string
}

/**
 * GiveawayModal Component
 * 
 * Modal for creating or editing a giveaway post.
 * Supports saving as draft and loading from draft.
 */
export function GiveawayModal({ draftId }: GiveawayModalProps) {
  const { 
    showGiveawayModal, 
    setShowGiveawayModal, 
    user, 
    createPost 
  } = useApp()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [prizeAmount, setPrizeAmount] = useState('')
  const [currency, setCurrency] = useState('XLM')
  const [maxWinners, setMaxWinners] = useState('')
  const [selectionMethod, setSelectionMethod] = useState('random')
  const [duration, setDuration] = useState('')
  const [proofRequired, setProofRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)

  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId && showGiveawayModal) {
      const draft = getDraft(draftId)
      if (draft && draft.type === 'giveaway') {
        setTitle(draft.title || '')
        setDescription(draft.description || '')
        setCategory(draft.category || '')
        setPrizeAmount(draft.prizeAmount?.toString() || '')
        setCurrency(draft.currency || 'XLM')
        setMaxWinners(draft.maxWinners?.toString() || '')
        setSelectionMethod(draft.selectionMethod || 'random')
        setDuration(draft.duration?.toString() || '')
        setProofRequired(draft.proofRequired || false)
        setCurrentDraftId(draft.id)
      }
    } else if (!draftId && showGiveawayModal) {
      // Reset form when opening new modal
      setTitle('')
      setDescription('')
      setCategory('')
      setPrizeAmount('')
      setCurrency('XLM')
      setMaxWinners('')
      setSelectionMethod('random')
      setDuration('')
      setProofRequired(false)
      setCurrentDraftId(undefined)
    }
  }, [draftId, showGiveawayModal])

  // Listen for loadDraft events
  useEffect(() => {
    const handleLoadDraft = (event: CustomEvent) => {
      if (event.detail.draftId) {
        const draft = getDraft(event.detail.draftId)
        if (draft && draft.type === 'giveaway') {
          setTitle(draft.title || '')
          setDescription(draft.description || '')
          setCategory(draft.category || '')
          setPrizeAmount(draft.prizeAmount?.toString() || '')
          setCurrency(draft.currency || 'XLM')
          setMaxWinners(draft.maxWinners?.toString() || '')
          setSelectionMethod(draft.selectionMethod || 'random')
          setDuration(draft.duration?.toString() || '')
          setProofRequired(draft.proofRequired || false)
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
      type: 'giveaway',
      title: title.trim() || 'Untitled Giveaway',
      description: description.trim(),
      category: category || undefined,
      prizeAmount: prizeAmount ? parseFloat(prizeAmount) : undefined,
      currency: currency || undefined,
      maxWinners: maxWinners ? parseInt(maxWinners) : undefined,
      selectionMethod: selectionMethod || undefined,
      duration: duration ? parseInt(duration) : undefined,
      proofRequired,
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
        type: 'giveaway',
        category: category || undefined,
        title: title.trim(),
        description: description.trim(),
        authorId: user.id,
        status: 'open',
        prizeAmount: prizeAmount ? parseFloat(prizeAmount) : undefined,
        currency: currency || undefined,
        maxWinners: maxWinners ? parseInt(maxWinners) : undefined,
        selectionMethod: selectionMethod as any,
        duration: duration ? parseInt(duration) : undefined,
        proofRequired,
      })

      // Delete draft if it exists
      if (currentDraftId) {
        const { deleteDraft } = await import('@/lib/drafts')
        deleteDraft(currentDraftId)
      }

      toast.success('Giveaway created successfully!')
      setShowGiveawayModal(false)
      
      // Reset form
      setTitle('')
      setDescription('')
      setCategory('')
      setPrizeAmount('')
      setCurrency('XLM')
      setMaxWinners('')
      setSelectionMethod('random')
      setDuration('')
      setProofRequired(false)
      setCurrentDraftId(undefined)
    } catch (error) {
      toast.error('Failed to create giveaway')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setShowGiveawayModal(false)
  }

  return (
    <Dialog open={showGiveawayModal} onOpenChange={setShowGiveawayModal}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentDraftId ? 'Edit Draft' : 'Create Giveaway'}
            {currentDraftId && (
              <Badge variant="outline" className="text-xs">
                Draft
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentDraftId
              ? 'Continue editing your draft'
              : 'Share something with your community'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Free NFT Collection Giveaway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your giveaway..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., NFTs, Gaming, Education"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prizeAmount">Prize Amount</Label>
              <Input
                id="prizeAmount"
                type="number"
                placeholder="0.00"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxWinners">Max Winners</Label>
              <Input
                id="maxWinners"
                type="number"
                placeholder="1"
                value={maxWinners}
                onChange={(e) => setMaxWinners(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="selectionMethod">Selection Method</Label>
              <Select value={selectionMethod} onValueChange={setSelectionMethod}>
                <SelectTrigger id="selectionMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="first-come">First Come</SelectItem>
                  <SelectItem value="merit-based">Merit Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="7"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="proofRequired"
              checked={proofRequired}
              onChange={(e) => setProofRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="proofRequired" className="cursor-pointer">
              Require proof of action
            </Label>
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
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Publishing...' : 'Publish Giveaway'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
