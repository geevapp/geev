"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Post } from "@/lib/types";
import type React from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app-context";
import { useState } from "react";

interface EntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}

export function EntryForm({ open, onOpenChange, post }: EntryFormProps) {
  const { submitEntry } = useAppContext();

  const [formData, setFormData] = useState({
    content: "",
    proofUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      submitEntry({
        postId: post.id,
        userId: "", // Will be set by context
        content: formData.content,
        proofUrl: formData.proofUrl || undefined,
      });

      toast("Entry submitted!", {
        description: "Your entry has been recorded. Good luck!",
      });

      // Reset form
      setFormData({
        content: "",
        proofUrl: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to submit entry. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enter Giveaway</DialogTitle>
          <DialogDescription>
            Submit your entry for "{post.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requirements Display */}
          {post.entryRequirements && post.entryRequirements.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Requirements:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                {post.entryRequirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Entry Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Entry</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Tell us why you should win, share your story, or fulfill the requirements..."
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              required
            />
          </div>

          {/* Proof URL (if required) */}
          {post.proofRequired && (
            <div className="space-y-2">
              <Label htmlFor="proofUrl">Proof URL (Required)</Label>
              <Input
                id="proofUrl"
                name="proofUrl"
                type="url"
                placeholder="https://example.com/proof"
                value={formData.proofUrl}
                onChange={handleInputChange}
                required={post.proofRequired}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Provide a link to verify you've met the requirements
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
