// =============================================================================
// DRAFT STORAGE UTILITIES
// =============================================================================
// This module provides utilities for managing post drafts in localStorage.
// Drafts allow users to save incomplete posts and resume editing later.
// =============================================================================

import type { Draft } from './types';

/** LocalStorage key for storing drafts */
const DRAFTS_STORAGE_KEY = 'geev_drafts';

/**
 * Retrieves all drafts from localStorage.
 * @returns Array of all saved drafts
 */
export function getDrafts(): Draft[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as Draft[];
  } catch (error) {
    console.error('Failed to load drafts from localStorage:', error);
    return [];
  }
}

/**
 * Saves a draft to localStorage.
 * @param draft - The draft to save
 */
export function saveDraft(draft: Draft): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const drafts = getDrafts();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id);
    
    if (existingIndex >= 0) {
      // Update existing draft
      drafts[existingIndex] = draft;
    } else {
      // Add new draft
      drafts.push(draft);
    }
    
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('draftSaved'));
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
  }
}

/**
 * Deletes a draft by ID.
 * @param draftId - The ID of the draft to delete
 */
export function deleteDraft(draftId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const drafts = getDrafts();
    const filtered = drafts.filter((d) => d.id !== draftId);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filtered));
    
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('draftDeleted'));
  } catch (error) {
    console.error('Failed to delete draft from localStorage:', error);
  }
}

/**
 * Gets a single draft by ID.
 * @param draftId - The ID of the draft to retrieve
 * @returns The draft if found, null otherwise
 */
export function getDraft(draftId: string): Draft | null {
  const drafts = getDrafts();
  return drafts.find((d) => d.id === draftId) || null;
}

/**
 * Creates a new draft with a generated ID.
 * @param draftData - Partial draft data (without id, savedAt, updatedAt)
 * @returns The created draft
 */
export function createDraft(
  draftData: Omit<Draft, 'id' | 'savedAt' | 'updatedAt'>
): Draft {
  const now = new Date().toISOString();
  const draft: Draft = {
    ...draftData,
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    savedAt: now,
    updatedAt: now,
  };
  saveDraft(draft);
  return draft;
}

/**
 * Updates an existing draft.
 * @param draftId - The ID of the draft to update
 * @param updates - Partial draft data to update
 * @returns The updated draft if found, null otherwise
 */
export function updateDraft(
  draftId: string,
  updates: Partial<Omit<Draft, 'id' | 'savedAt' | 'updatedAt'>>
): Draft | null {
  const draft = getDraft(draftId);
  if (!draft) {
    return null;
  }

  const updated: Draft = {
    ...draft,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDraft(updated);
  return updated;
}

/**
 * Gets the count of all drafts.
 * @returns Number of saved drafts
 */
export function getDraftCount(): number {
  return getDrafts().length;
}
