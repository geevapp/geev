'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  className?: string
}

/**
 * StatCard Component
 *
 * Displays a single stat with a value and label.
 * Used in the profile page stats section.
 */
export function StatCard({ label, value, className }: StatCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <span className="text-lg font-semibold text-[#F3F4F6]">{formattedValue}</span>
      <span className="text-sm font-normal text-[#99A1AF]">{label}</span>
    </div>
  )
}
