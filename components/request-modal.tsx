'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { createDraft, updateDraft, getDraft, deleteDraft } from '@/lib/drafts'
import type { Draft, MediaFile } from '@/lib/types'
import { PostStatus, PostCategory } from '@/lib/types'
import { toast } from 'sonner'
import { 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Package,
  Wrench,
  MessageCircle,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  Flame,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { 
  validateTitle, 
  validateDescription, 
  validateCategory, 
  validateDuration,
  validateHelpType,
  validateUrgency,
  validateTargetAmount,
  type ValidationResult
} from '@/lib/validation'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RequestModalProps {
  draftId?: string
}

// Help type configuration with icons and descriptions
const helpTypeConfig = {
  material: {
    icon: Package,
    label: 'Material',
    description: 'Physical items or funds needed',
    color: 'text-cyan-400',
  },
  service: {
    icon: Wrench,
    label: 'Service',
    description: 'Help with tasks or activities',
    color: 'text-cyan-400',
  },
  advice: {
    icon: MessageCircle,
    label: 'Advice',
    description: 'Guidance or information',
    color: 'text-cyan-400',
  },
  other: {
    icon: MoreHorizontal,
    label: 'Other',
    description: 'Other types of assistance',
    color: 'text-cyan-400',
  },
}

// Urgency configuration with colors and descriptions
const urgencyConfig = {
  low: {
    icon: Clock,
    label: 'Low',
    description: 'General request, flexible timeline',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    dotColor: 'bg-green-500',
  },
  medium: {
    icon: AlertCircle,
    label: 'Medium',
    description: 'Helpful soon, not critical',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    dotColor: 'bg-yellow-500',
  },
  high: {
    icon: AlertTriangle,
    label: 'High',
    description: 'Needed within days',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    dotColor: 'bg-orange-500',
  },
  urgent: {
    icon: Flame,
    label: 'Urgent',
    description: 'Critical, immediate need',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    dotColor: 'bg-red-500',
  },
}

/**
 * RequestModal Component
 * 
 * Modal for creating or editing a help request post.
 * Features:
 * - Help type selector (Material/Service/Advice/Other)
 * - Urgency indicator (Low/Medium/High/Urgent)
 * - Conditional funding goal (only for Material help type)
 * - Media upload with drag & drop
 * - Draft save/load functionality
 * - Form validation with real-time feedback
 * - Teal/cyan accent color scheme
 */
export function RequestModal({ draftId }: RequestModalProps) {
  const { 
    showRequestModal, 
    setShowRequestModal, 
    user, 
    createPost 
  } = useApp()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [helpType, setHelpType] = useState<string>('')
  const [urgency, setUrgency] = useState<string>('medium')
  const [targetAmount, setTargetAmount] = useState('')
  const [currency, setCurrency] = useState('USDC')
  const [duration, setDuration] = useState('7')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)
  const [isDragging, setIsDragging] = useState(false)
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  const validateField = useCallback((name: string, value: any) => {
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
      case 'helpType':
        result = validateHelpType(value)
        break
      case 'urgency':
        result = validateUrgency(value)
        break
      case 'targetAmount':
        if (helpType === 'material' && value) {
          result = validateTargetAmount(value)
        }
        break
    }

    setErrors(prev => ({ ...prev, [name]: result.error || '' }))
    return result.isValid
  }, [helpType])

  const handleBlur = (name: string, value: any) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  // Check if form is valid
  const isFormValid = 
    title.length >= 10 && title.length <= 200 &&
    description.length >= 50 && description.length <= 2000 &&
    category.trim() !== '' &&
    helpType !== '' &&
    urgency !== '' &&
    parseInt(duration) >= 1 && parseInt(duration) <= 30 &&
    (helpType !== 'material' || !targetAmount || parseFloat(targetAmount) > 0) &&
    Object.values(errors).every(error => !error)

  // Reset form
  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setCategory('')
    setHelpType('')
    setUrgency('medium')
    setTargetAmount('')
    setCurrency('USDC')
    setDuration('7')
    setMediaFiles([])
    setCurrentDraftId(undefined)
    setErrors({})
    setTouched({})
  }, [])

  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId && showRequestModal) {
      const draft = getDraft(draftId)
      if (draft && draft.type === 'request') {
        setTitle(draft.title || '')
        setDescription(draft.description || '')
        setCategory(draft.category || '')
        setTargetAmount(draft.targetAmount?.toString() || '')
        setCurrency(draft.currency || 'USDC')
        setDuration(draft.duration?.toString() || '7')
        setCurrentDraftId(draft.id)
      }
    } else if (!draftId && showRequestModal) {
      resetForm()
    }
  }, [draftId, showRequestModal, resetForm])

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
          setCurrency(draft.currency || 'USDC')
          setDuration(draft.duration?.toString() || '7')
          setCurrentDraftId(draft.id)
        }
      }
    }

    window.addEventListener('loadDraft', handleLoadDraft as EventListener)
    return () => {
      window.removeEventListener('loadDraft', handleLoadDraft as EventListener)
    }
  }, [])

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const maxFiles = 3
    const currentCount = mediaFiles.length
    const remainingSlots = maxFiles - currentCount
    
    if (remainingSlots <= 0) {
      toast.error('Maximum 3 files allowed')
      return
    }

    const newFiles: MediaFile[] = []
    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    
    filesToProcess.forEach((file, index) => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a supported file type`)
        return
      }

      // Create object URL for preview
      const url = URL.createObjectURL(file)
      
      newFiles.push({
        id: `media_${Date.now()}_${index}`,
        url,
        type: isImage ? 'image' : 'video',
        thumbnail: isImage ? url : undefined,
      })
    })

    setMediaFiles(prev => [...prev, ...newFiles])
  }

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  // Remove media file
  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.url)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  // Save as draft
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

  // Publish request
  const handlePublish = async () => {
    // Validate all fields
    const titleRes = validateTitle(title)
    const descRes = validateDescription(description)
    const catRes = validateCategory(category)
    const durationRes = validateDuration(duration)
    const helpTypeRes = validateHelpType(helpType)
    const urgencyRes = validateUrgency(urgency)
    const targetAmountRes = helpType === 'material' && targetAmount 
      ? validateTargetAmount(targetAmount) 
      : { isValid: true, error: '' }

    const newErrors = {
      title: titleRes.error || '',
      description: descRes.error || '',
      category: catRes.error || '',
      duration: durationRes.error || '',
      helpType: helpTypeRes.error || '',
      urgency: urgencyRes.error || '',
      targetAmount: targetAmountRes.error || '',
    }

    setErrors(newErrors)
    setTouched({
      title: true,
      description: true,
      category: true,
      duration: true,
      helpType: true,
      urgency: true,
      targetAmount: true,
    })

    const hasErrors = Object.values(newErrors).some(error => error)
    if (hasErrors) {
      toast.error('Please fix the errors in the form')
      return
    }

    if (!user) {
      toast.error('You must be logged in to create a request')
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
        helpType: helpType as 'material' | 'service' | 'advice' | 'other',
        urgency: urgency as 'low' | 'medium' | 'high' | 'urgent',
        targetAmount: helpType === 'material' && targetAmount ? parseFloat(targetAmount) : undefined,
        currentAmount: 0,
        currency: helpType === 'material' ? currency : undefined,
        duration: duration ? parseInt(duration) : 7,
        media: mediaFiles.length > 0 ? mediaFiles : undefined,
      })

      // Delete draft if it exists
      if (currentDraftId) {
        deleteDraft(currentDraftId)
      }

      toast.success('Help request created successfully!', {
        description: 'Your request is now visible to the community.',
      })
      
      setShowRequestModal(false)
      resetForm()
    } catch (error) {
      toast.error('Failed to create help request')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
      <DialogContent 
        className="sm:max-w-[565px] max-h-[90vh] overflow-y-auto border border-[#1E2939] p-0"
        style={{ 
          backgroundColor: '#0A0A0B',
          borderRadius: '14px',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <HelpCircle className="h-5 w-5 text-cyan-400" />
            Request Help
            {currentDraftId && (
              <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                Draft
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-[#99A1AF]">
            Ask the community for support with your goals
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Request Title */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label 
                htmlFor="title" 
                className={cn(
                  "text-sm font-medium",
                  touched.title && errors.title ? "text-red-400" : "text-[#D1D5DB]"
                )}
              >
                Request Title
              </Label>
              <span className={cn(
                "text-xs",
                title.length > 200 ? "text-red-400" : "text-[#6B7280]"
              )}>
                {title.length}/200
              </span>
            </div>
            <Input
              id="title"
              placeholder="e.g., Help Me Get a New Laptop for Coding"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (touched.title) validateField('title', e.target.value)
              }}
              onBlur={() => handleBlur('title', title)}
              className={cn(
                "bg-[#0F1117] border-[#1E2939] text-white placeholder:text-[#4B5563] focus:border-cyan-500 focus:ring-cyan-500/20",
                touched.title && errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                touched.title && !errors.title && title && "border-green-500 focus:border-green-500 focus:ring-green-500/20"
              )}
            />
            {touched.title && errors.title && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label 
                htmlFor="description" 
                className={cn(
                  "text-sm font-medium",
                  touched.description && errors.description ? "text-red-400" : "text-[#D1D5DB]"
                )}
              >
                Description
              </Label>
              <span className={cn(
                "text-xs",
                description.length > 2000 ? "text-red-400" : "text-[#6B7280]"
              )}>
                {description.length}/2000
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Explain your situation, what you need help with, and how it will be used..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (touched.description) validateField('description', e.target.value)
              }}
              onBlur={() => handleBlur('description', description)}
              rows={4}
              className={cn(
                "bg-[#0F1117] border-[#1E2939] text-white placeholder:text-[#4B5563] focus:border-cyan-500 focus:ring-cyan-500/20 resize-none",
                touched.description && errors.description && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                touched.description && !errors.description && description.length >= 50 && "border-green-500 focus:border-green-500 focus:ring-green-500/20"
              )}
            />
            {touched.description && errors.description && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#D1D5DB]">
              Media (Optional)
            </Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                isDragging 
                  ? "border-cyan-500 bg-cyan-500/10" 
                  : "border-[#1E2939] hover:border-[#364153] bg-[#0F1117]"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto mb-3 text-[#6B7280]" />
              <p className="text-sm text-[#9CA3AF]">
                Drag and drop media files here, or click to browse
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Supports images and videos • Max 3 files
              </p>
              {mediaFiles.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 border-[#1E2939] bg-transparent text-[#D1D5DB] hover:bg-[#1E2939]"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  Choose File
                </Button>
              )}
            </div>
            
            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {mediaFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1E2939] group"
                  >
                    {file.type === 'image' ? (
                      <img 
                        src={file.url} 
                        alt="Upload preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1E2939] flex items-center justify-center">
                        <Video className="h-6 w-6 text-[#6B7280]" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(file.id)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 p-0.5 bg-black/60 rounded">
                      {file.type === 'image' ? (
                        <ImageIcon className="h-3 w-3 text-white" />
                      ) : (
                        <Video className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help Type Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className={cn(
                "text-sm font-medium",
                touched.helpType && errors.helpType ? "text-red-400" : "text-[#D1D5DB]"
              )}>
                Type of Help Needed
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-[#6B7280] cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1E2939] border-[#364153] text-white max-w-xs">
                    <p>Select the type of assistance you need. This helps the community understand how they can help.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(helpTypeConfig) as Array<keyof typeof helpTypeConfig>).map((type) => {
                const config = helpTypeConfig[type]
                const Icon = config.icon
                const isSelected = helpType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setHelpType(type)
                      setTouched(prev => ({ ...prev, helpType: true }))
                      validateField('helpType', type)
                      // Clear target amount if switching away from material
                      if (type !== 'material') {
                        setTargetAmount('')
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                      isSelected 
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" 
                        : "border-[#1E2939] bg-[#0F1117] text-[#9CA3AF] hover:border-[#364153]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{config.label}</span>
                  </button>
                )
              })}
            </div>
            {touched.helpType && errors.helpType && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.helpType}
              </p>
            )}
          </div>

          {/* Funding Goal - Only show for Material help type */}
          {helpType === 'material' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#D1D5DB]">
                Funding Goal
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="targetAmount" className="text-xs text-[#6B7280]">
                    Target Amount
                  </Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    placeholder="500"
                    value={targetAmount}
                    onChange={(e) => {
                      setTargetAmount(e.target.value)
                      if (touched.targetAmount) validateField('targetAmount', e.target.value)
                    }}
                    onBlur={() => handleBlur('targetAmount', targetAmount)}
                    className={cn(
                      "bg-[#0F1117] border-[#1E2939] text-white placeholder:text-[#4B5563] focus:border-cyan-500 focus:ring-cyan-500/20",
                      touched.targetAmount && errors.targetAmount && "border-red-500"
                    )}
                  />
                  {touched.targetAmount && errors.targetAmount && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.targetAmount}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="text-xs text-[#6B7280]">
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger 
                      id="currency"
                      className="bg-[#0F1117] border-[#1E2939] text-white focus:border-cyan-500 focus:ring-cyan-500/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F1117] border-[#1E2939]">
                      <SelectItem value="USDC" className="text-white hover:bg-[#1E2939]">USDC</SelectItem>
                      <SelectItem value="XLM" className="text-white hover:bg-[#1E2939]">XLM</SelectItem>
                      <SelectItem value="USD" className="text-white hover:bg-[#1E2939]">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Urgency Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className={cn(
                "text-sm font-medium",
                touched.urgency && errors.urgency ? "text-red-400" : "text-[#D1D5DB]"
              )}>
                Urgency Level
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-[#6B7280] cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1E2939] border-[#364153] text-white max-w-xs">
                    <div className="space-y-1">
                      <p><strong>Low:</strong> General request, flexible timeline</p>
                      <p><strong>Medium:</strong> Helpful soon, not critical</p>
                      <p><strong>High:</strong> Needed within days</p>
                      <p><strong>Urgent:</strong> Critical, immediate need</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(urgencyConfig) as Array<keyof typeof urgencyConfig>).map((level) => {
                const config = urgencyConfig[level]
                const isSelected = urgency === level
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setUrgency(level)
                      setTouched(prev => ({ ...prev, urgency: true }))
                      validateField('urgency', level)
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all",
                      isSelected 
                        ? config.color
                        : "border-[#1E2939] bg-[#0F1117] text-[#9CA3AF] hover:border-[#364153]"
                    )}
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isSelected ? config.dotColor : "bg-[#4B5563]"
                    )} />
                    <span className="text-sm font-medium">{config.label}</span>
                  </button>
                )
              })}
            </div>
            {touched.urgency && errors.urgency && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.urgency}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label 
              htmlFor="category" 
              className={cn(
                "text-sm font-medium",
                touched.category && errors.category ? "text-red-400" : "text-[#D1D5DB]"
              )}
            >
              Category
            </Label>
            <Select 
              value={category} 
              onValueChange={(value) => {
                setCategory(value)
                if (touched.category) validateField('category', value)
              }}
            >
              <SelectTrigger 
                id="category"
                className={cn(
                  "bg-[#0F1117] border-[#1E2939] text-white focus:border-cyan-500 focus:ring-cyan-500/20",
                  touched.category && errors.category && "border-red-500",
                  !category && "text-[#4B5563]"
                )}
                onBlur={() => handleBlur('category', category)}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F1117] border-[#1E2939]">
                <SelectItem value="education" className="text-white hover:bg-[#1E2939]">Education</SelectItem>
                <SelectItem value="medical" className="text-white hover:bg-[#1E2939]">Medical</SelectItem>
                <SelectItem value="technology" className="text-white hover:bg-[#1E2939]">Technology</SelectItem>
                <SelectItem value="housing" className="text-white hover:bg-[#1E2939]">Housing</SelectItem>
                <SelectItem value="food" className="text-white hover:bg-[#1E2939]">Food</SelectItem>
                <SelectItem value="transportation" className="text-white hover:bg-[#1E2939]">Transportation</SelectItem>
                <SelectItem value="career" className="text-white hover:bg-[#1E2939]">Career</SelectItem>
                <SelectItem value="mental-health" className="text-white hover:bg-[#1E2939]">Mental Health</SelectItem>
                <SelectItem value="other" className="text-white hover:bg-[#1E2939]">Other</SelectItem>
              </SelectContent>
            </Select>
            {touched.category && errors.category && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.category}
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label 
              htmlFor="duration" 
              className={cn(
                "text-sm font-medium",
                touched.duration && errors.duration ? "text-red-400" : "text-[#D1D5DB]"
              )}
            >
              Duration (days)
            </Label>
            <Select 
              value={duration} 
              onValueChange={(value) => {
                setDuration(value)
                if (touched.duration) validateField('duration', value)
              }}
            >
              <SelectTrigger 
                id="duration"
                className={cn(
                  "bg-[#0F1117] border-[#1E2939] text-white focus:border-cyan-500 focus:ring-cyan-500/20",
                  touched.duration && errors.duration && "border-red-500"
                )}
                onBlur={() => handleBlur('duration', duration)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F1117] border-[#1E2939]">
                <SelectItem value="7" className="text-white hover:bg-[#1E2939]">7 days</SelectItem>
                <SelectItem value="14" className="text-white hover:bg-[#1E2939]">14 days</SelectItem>
                <SelectItem value="21" className="text-white hover:bg-[#1E2939]">21 days</SelectItem>
                <SelectItem value="30" className="text-white hover:bg-[#1E2939]">30 days</SelectItem>
              </SelectContent>
            </Select>
            {touched.duration && errors.duration && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.duration}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 flex-col sm:flex-row gap-2 border-t border-[#1E2939]">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto border-[#1E2939] bg-transparent text-[#D1D5DB] hover:bg-[#1E2939] hover:text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isLoading || !isFormValid}
            className={cn(
              "w-full sm:w-auto",
              isFormValid && !isLoading 
                ? "bg-cyan-600 hover:bg-cyan-700 text-white" 
                : "bg-[#1E2939] text-[#6B7280]"
            )}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Publish Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
