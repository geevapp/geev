import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateXP(action: string): number {
  const xpMap: Record<string, number> = {
    'post_created': 10,
    'giveaway_won': 50,
    'entry_submitted': 5,
    'like_given': 1,
    'like_received': 2,
  };
  return xpMap[action] || 0;
}

export function isPostExpired(endDate: Date): boolean {
  return endDate < new Date();
}
