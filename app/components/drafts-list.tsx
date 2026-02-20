'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, FileText, Gift, Heart, Trash2 } from 'lucide-react';
import { deleteDraft, getDrafts } from '@/lib/drafts';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Draft } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/app-context';

interface DraftsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * DraftsList Component
 *
 * Displays a list of all saved drafts with options to edit or delete.
 */
export function DraftsList({ open, onOpenChange }: DraftsListProps) {
  const { setShowGiveawayModal, setShowRequestModal } = useAppContext();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDrafts = () => {
    setDrafts(getDrafts());
  };

  useEffect(() => {
    if (open) {
      loadDrafts();
    }
  }, [open]);

  // Listen for draft updates
  useEffect(() => {
    const handleDraftUpdate = () => {
      loadDrafts();
    };

    window.addEventListener('draftSaved', handleDraftUpdate);
    window.addEventListener('draftDeleted', handleDraftUpdate);
    window.addEventListener('storage', handleDraftUpdate);

    return () => {
      window.removeEventListener('draftSaved', handleDraftUpdate);
      window.removeEventListener('draftDeleted', handleDraftUpdate);
      window.removeEventListener('storage', handleDraftUpdate);
    };
  }, []);

  const handleEdit = (draft: Draft) => {
    onOpenChange(false);
    if (draft.type === 'giveaway') {
      setShowGiveawayModal(true);
      // We'll need to pass the draftId to the modal
      // For now, we'll use a custom event or context
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('loadDraft', { detail: { draftId: draft.id } }),
        );
      }, 100);
    } else {
      setShowRequestModal(true);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('loadDraft', { detail: { draftId: draft.id } }),
        );
      }, 100);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    setDeletingId(draftId);
    try {
      deleteDraft(draftId);
      toast.success('Draft deleted');
      loadDrafts();
    } catch (error) {
      toast.error('Failed to delete draft');
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeIcon = (type: Draft['type']) => {
    return type === 'giveaway' ? (
      <Gift className="h-4 w-4" />
    ) : (
      <Heart className="h-4 w-4" />
    );
  };

  const getTypeBadge = (type: Draft['type']) => {
    return type === 'giveaway' ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Giveaway
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        Request
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>My Drafts</DialogTitle>
          <DialogDescription>
            Your saved drafts. Click edit to continue working on them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No drafts saved yet</p>
              <p className="text-sm mt-2">
                Start creating a post and save it as a draft to see it here
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(draft.type)}
                      {getTypeBadge(draft.type)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(draft.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <h3 className="font-semibold truncate">{draft.title}</h3>
                    {draft.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {draft.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                      {draft.category && (
                        <span>Category: {draft.category}</span>
                      )}
                      {draft.prizeAmount && (
                        <span>
                          Prize: {draft.prizeAmount} {draft.currency}
                        </span>
                      )}
                      {draft.targetAmount && (
                        <span>
                          Target: {draft.targetAmount} {draft.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(draft)}
                      className="shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(draft.id)}
                      disabled={deletingId === draft.id}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
