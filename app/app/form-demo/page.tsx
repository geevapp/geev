'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  validateTitle, 
  validateDescription, 
  validateCategory, 
  validateWinnerCount, 
  validateDuration,
  type ValidationResult 
} from '@/lib/validation'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle, Send, Code, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { PostStatus, PostCategory } from '@/lib/types'

export default function FormDemoPage() {
  const [activeTab, setActiveTab] = useState<'giveaway' | 'request'>('giveaway')
  
  // State 1:1 with modals
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [maxWinners, setMaxWinners] = useState('')
  const [duration, setDuration] = useState('')
  
  // Validation state 1:1 with modals
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
      case 'maxWinners':
        result = validateWinnerCount(value)
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

  // Logic matched with giveaway-modal.tsx and request-modal.tsx
  const isFormValid = 
    title.length >= 10 && title.length <= 200 &&
    description.length >= 50 && description.length <= 2000 &&
    category.trim() !== '' &&
    (activeTab === 'giveaway' ? (parseInt(maxWinners) >= 1 && parseInt(maxWinners) <= 100) : true) &&
    parseInt(duration) >= 1 && parseInt(duration) <= 30 &&
    Object.values(errors).every(error => !error)

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Final check matched with handlePublish in modals
    const titleRes = validateTitle(title)
    const descRes = validateDescription(description)
    const catRes = validateCategory(category)
    const winnersRes = activeTab === 'giveaway' ? validateWinnerCount(maxWinners) : { isValid: true }
    const durationRes = validateDuration(duration)

    if (!titleRes.isValid || !descRes.isValid || !catRes.isValid || !winnersRes.isValid || !durationRes.isValid) {
      const newErrors = {
        title: titleRes.error || '',
        description: descRes.error || '',
        category: catRes.error || '',
        maxWinners: (activeTab === 'giveaway' ? (winnersRes as any).error : '') || '',
        duration: durationRes.error || '',
      }
      setErrors(newErrors)
      setTouched({
        title: true,
        description: true,
        category: true,
        maxWinners: true,
        duration: true,
      })
      toast.error('Please fix the errors in the form')
      return
    }

    toast.success(`${activeTab === 'giveaway' ? 'Giveaway' : 'Request'} published successfully!`)
  }

  // Preview of the object that would be sent to createPost()
  const postPreview = {
    type: activeTab === 'giveaway' ? 'giveaway' : 'help-request',
    title: title.trim(),
    description: description.trim(),
    category: category as PostCategory,
    status: PostStatus.Open,
    duration: parseInt(duration),
    ...(activeTab === 'giveaway' && { maxWinners: parseInt(maxWinners) })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Hand: The Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Post Validation Demo</h1>
            <p className="text-slate-400">Using logic from <code>RequestModal</code> and <code>GiveawayModal</code></p>
          </div>

          <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('giveaway')}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'giveaway' ? "bg-orange-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
            >
              Giveaway
            </button>
            <button 
              onClick={() => setActiveTab('request')}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'request' ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
            >
              Request
            </button>
          </div>

          <Card className="bg-[#1c1c1c] border-slate-800 shadow-2xl rounded-[24px]">
            <CardContent className="p-8 space-y-5">
              {/* Title Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className={cn("text-slate-200", touched.title && errors.title && "text-red-400")}>Title *</Label>
                  <span className={cn("text-[10px] font-mono", title.length > 200 ? "text-red-400" : "text-slate-500")}>
                    {title.length}/200
                  </span>
                </div>
                <Input
                  placeholder="Minimum 10 characters"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (touched.title) validateField('title', e.target.value)
                  }}
                  onBlur={() => handleBlur('title', title)}
                  className={cn(
                    "bg-[#2a2a2a] border-slate-700 text-white rounded-xl h-12",
                    touched.title && errors.title ? "border-red-500/50 focus-visible:ring-red-500" : touched.title && !errors.title ? "border-green-500/50 focus-visible:ring-green-500" : ""
                  )}
                />
                {touched.title && (errors.title ? (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 font-medium italic"><AlertCircle className="h-3 w-3" /> {errors.title}</p>
                ) : (
                  <p className="text-[11px] text-green-500 flex items-center gap-1 mt-1 font-medium italic"><CheckCircle2 className="h-3 w-3" /> Looks good!</p>
                ))}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className={cn("text-slate-200", touched.description && errors.description && "text-red-400")}>Description *</Label>
                  <span className={cn("text-[10px] font-mono", description.length > 2000 ? "text-red-400" : "text-slate-500")}>
                    {description.length}/2000
                  </span>
                </div>
                <textarea
                  placeholder="Provide details (50 - 2000 chars)..."
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (touched.description) validateField('description', e.target.value)
                  }}
                  onBlur={() => handleBlur('description', description)}
                  className={cn(
                    "w-full bg-[#2a2a2a] border-slate-700 text-white rounded-xl p-3 focus:ring-1 focus:ring-offset-0 focus:outline-hidden",
                    touched.description && errors.description ? "border-red-500 focus:ring-red-500" : touched.description && !errors.description && description.length >= 50 ? "border-green-500 focus:ring-green-500" : ""
                  )}
                />
                {touched.description && (errors.description ? (
                  <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 font-medium italic"><AlertCircle className="h-3 w-3" /> {errors.description}</p>
                ) : description.length >= 50 && (
                  <p className="text-[11px] text-green-500 flex items-center gap-1 mt-1 font-medium italic"><CheckCircle2 className="h-3 w-3" /> Sufficient detail</p>
                ))}
              </div>

              {/* Category Field */}
              <div className="space-y-2">
                <Label className={cn("text-slate-200", touched.category && errors.category && "text-red-400")}>Category *</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v); validateField('category', v); }}>
                  <SelectTrigger className={cn("bg-[#2a2a2a] border-slate-700 text-white rounded-xl h-12", touched.category && errors.category && "border-red-500", touched.category && !errors.category && "border-green-500")}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="Gaming">Gaming</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Numeric Fields */}
              <div className="grid grid-cols-2 gap-4">
                {activeTab === 'giveaway' && (
                  <div className="space-y-2">
                    <Label className={cn("text-slate-200", touched.maxWinners && errors.maxWinners && "text-red-400")}>Winners *</Label>
                    <Input
                      type="number"
                      placeholder="1-100"
                      value={maxWinners}
                      onChange={(e) => { setMaxWinners(e.target.value); if (touched.maxWinners) validateField('maxWinners', e.target.value); }}
                      onBlur={() => handleBlur('maxWinners', maxWinners)}
                      className={cn("bg-[#2a2a2a] border-slate-700 text-white h-12 rounded-xl", touched.maxWinners && errors.maxWinners && "border-red-500", touched.maxWinners && !errors.maxWinners && "border-green-500")}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className={cn("text-slate-200", touched.duration && errors.duration && "text-red-400")}>Days *</Label>
                  <Input
                    type="number"
                    placeholder="1-30"
                    value={duration}
                    onChange={(e) => { setDuration(e.target.value); if (touched.duration) validateField('duration', e.target.value); }}
                    onBlur={() => handleBlur('duration', duration)}
                    className={cn("bg-[#2a2a2a] border-slate-700 text-white h-12 rounded-xl", touched.duration && errors.duration && "border-red-500", touched.duration && !errors.duration && "border-green-500")}
                  />
                </div>
              </div>

              <Button
                onClick={handlePublish}
                disabled={!isFormValid}
                className={cn(
                  "w-full h-14 rounded-xl font-bold uppercase tracking-wider transition-all",
                  isFormValid 
                    ? (activeTab === 'giveaway' ? "bg-orange-600 hover:bg-orange-500 shadow-orange-500/20 shadow-lg" : "bg-red-600 hover:bg-red-500 shadow-red-500/20 shadow-lg")
                    : "bg-slate-800 text-slate-500"
                )}
              >
                <Send className="w-4 h-4 mr-2" />
                Publish {activeTab}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Hand: Code / JSON Preview */}
        <div className="space-y-6 lg:mt-[104px]">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden self-start sticky top-12">
            <div className="px-4 py-3 bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold">
                <Code className="h-4 w-4" /> createPost Payload Preview
              </div>
              <div className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", isFormValid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                 {isFormValid ? 'VALID & READY' : 'FORM INVALID'}
              </div>
            </div>
            <CardContent className="p-0">
              <pre className="p-6 text-[13px] font-mono text-blue-300 overflow-x-auto whitespace-pre-wrap">
                <code>{JSON.stringify(postPreview, null, 2)}</code>
              </pre>
            </CardContent>
          </div>

          <div className="p-6 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl">
            <h4 className="text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <Eye className="h-3 w-3" /> PR Technical Overview
            </h4>
            <div className="space-y-3 text-sm text-slate-500 leading-relaxed">
              <p>
                This demo perfectly mirrors the production logic from <code>GiveawayModal</code> and <code>RequestModal</code>.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Uses shared utilities from <code>lib/validation.ts</code></li>
                <li>Implements <code>onBlur</code> and <code>onChange</code> validation triggers.</li>
                <li>Displays identical error strings and success indicators.</li>
                <li>Disables the submit button using the exact <code>isFormValid</code> condition.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
