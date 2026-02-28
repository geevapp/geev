import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { AppState } from "./types";

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateXP (action: string): number {
  const xpMap: Record<string, number> = {
    'post_created': 10,
    'giveaway_won': 50,
    'entry_submitted': 5,
    'like_given': 1,
    'like_received': 2,
  };
  return xpMap[action] || 0;
}

export function isPostExpired (endDate: Date): boolean {
  return endDate < new Date();
}

/**
 * Serializes the app state for localStorage storage
 * Converts Sets to Arrays for JSON serialization
 */
export const serializeState = (state: AppState): string => {
  const { user, ...stateWithoutUser } = state;

  const serializable = {
    ...stateWithoutUser,
    likes: Array.from(state.likes),
    burns: Array.from(state.burns),
  };
  return JSON.stringify(serializable);
}

/**
 * Deserializes stored state from localStorage
 * Converts Arrays back to Sets and restores Date objects
 */
export const deserializeState = (stored: string): Partial<AppState> | null => {
  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      likes: new Set<string>(parsed.likes || []),
      burns: new Set<string>(parsed.burns || []),
    };
  } catch (error) {
    console.error("Failed to deserialize app state:", error);
    return null;
  }
}