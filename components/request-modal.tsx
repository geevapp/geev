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
import { PostCategory, PostStatus } from '@/lib/types'
import { toast } from 'sonner'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { 
  validateTitle, 
  validateDescription, 
  validateCategory, 
  validateDuration,
  type ValidationResult
} from '@/lib/validation'
import { cn } from '@/lib/utils'

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

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  const validateField = (name: string, value: any) => {
    let result: ValidationResult = { isValid: true, error: '' }
    
    switch (name) {
      case 'title':
        result = validateTitle(value)
        break
      case 'description':
        result = validateDescription(value)
        break
      case 'category':
        result = validateCategory(value)
        break
      case 'duration':
        result = validateDuration(value)
        break
    }

    setErrors(prev => ({ ...prev, [name]: result.error || '' }))
    return result.isValid
  }

  const handleBlur = (name: string, value: any) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  const isFormValid = 
    title.length >= 10 && title.length <= 200 &&
    description.length >= 50 && description.length <= 2000 &&
    category.trim() !== '' &&
    parseInt(duration) >= 1 && parseInt(duration) <= 30 &&
    Object.values(errors).every(error => !error)

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
    const titleRes = validateTitle(title)
    const descRes = validateDescription(description)
    const catRes = validateCategory(category)
    const durationRes = validateDuration(duration)

    const newErrors = {
      title: titleRes.error || '',
      description: descRes.error || '',
      category: catRes.error || '',
      duration: durationRes.error || '',
    }

    setErrors(newErrors)
    setTouched({
      title: true,
      description: true,
      category: true,
      duration: true,
    })

    if (!titleRes.isValid || !descRes.isValid || !catRes.isValid || !durationRes.isValid) {
      toast.error('Please fix the errors in the form')
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
        category: category ? (category as PostCategory) : undefined,
        title: title.trim(),
        description: description.trim(),
        authorId: user.id,
        status: PostStatus.Open,
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
      setErrors({})
      setTouched({})
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
            <div className="flex justify-between items-center">
              <Label htmlFor="title" className={cn(touched.title && errors.title && "text-red-500")}>Title *</Label>
              <span className={cn("text-xs", title.length > 200 ? "text-red-500" : "text-gray-400")}>
                {title.length}/200
              </span>
            </div>
            <Input
              id="title"
              placeholder="e.g., Need help with my project"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (touched.title) validateField('title', e.target.value)
              }}
              onBlur={() => handleBlur('title', title)}
              className={cn(touched.title && errors.title ? "border-red-500 focus-visible:ring-red-500" : touched.title && !errors.title ? "border-green-500 focus-visible:ring-green-500" : "")}
            />
            {touched.title && errors.title && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.title}
              </p>
            )}
            {touched.title && !errors.title && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Looks good!
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description" className={cn(touched.description && errors.description && "text-red-500")}>Description *</Label>
              <span className={cn("text-xs", description.length > 2000 ? "text-red-500" : "text-gray-400")}>
                {description.length}/2000
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Describe what you need help with..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (touched.description) validateField('description', e.target.value)
              }}
              onBlur={() => handleBlur('description', description)}
              rows={4}
              className={cn(touched.description && errors.description ? "border-red-500 focus-visible:ring-red-500" : touched.description && !errors.description ? "border-green-500 focus-visible:ring-green-500" : "")}
            />
            {touched.description && errors.description && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.description}
              </p>
            )}
            {touched.description && !errors.description && description.length >= 50 && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Sufficient detail provided
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category" className={cn(touched.category && errors.category && "text-red-500")}>Category *</Label>
            <Input
              id="category"
              placeholder="e.g., Development, Design, Funding"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                if (touched.category) validateField('category', e.target.value)
              }}
              onBlur={() => handleBlur('category', category)}
              className={cn(touched.category && errors.category ? "border-red-500 focus-visible:ring-red-500" : touched.category && !errors.category && category ? "border-green-500 focus-visible:ring-green-500" : "")}
            />
            {touched.category && errors.category && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.category}
              </p>
            )}
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
            <Label htmlFor="duration" className={cn(touched.duration && errors.duration && "text-red-500")}>Duration (days) *</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value)
                if (touched.duration) validateField('duration', e.target.value)
              }}
              onBlur={() => handleBlur('duration', duration)}
              className={cn(touched.duration && errors.duration ? "border-red-500 focus-visible:ring-red-500" : touched.duration && !errors.duration && duration ? "border-green-500 focus-visible:ring-green-500" : "")}
            />
            {touched.duration && errors.duration && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.duration}
              </p>
            )}
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
            disabled={isLoading || !isFormValid}
            className={cn(
              "w-full sm:w-auto",
              isFormValid && !isLoading ? "bg-red-600 hover:bg-red-700" : ""
            )}
          >
            {isLoading ? 'Publishing...' : 'Publish Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
