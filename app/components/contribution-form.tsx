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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app-context";
import { useState } from "react";

interface ContributionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}

export function ContributionForm({
  open,
  onOpenChange,
  post,
}: ContributionFormProps) {
  const { makeContribution } = useAppContext();

  const [formData, setFormData] = useState({
    amount: "",
    message: "",
    isAnonymous: false,
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
      makeContribution({
        postId: post.id,
        userId: "", // Will be set by context
        amount: Number.parseFloat(formData.amount),
        message: formData.message || undefined,
        isAnonymous: formData.isAnonymous,
      });

      toast("Contribution sent!", {
        description: `You've contributed $${formData.amount} to help ${post.author.name}.`,
      });

      // Reset form
      setFormData({
        amount: "",
        message: "",
        isAnonymous: false,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to send contribution. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingAmount = (post.targetAmount || 0) - (post.currentAmount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Contribute to Help Request</DialogTitle>
          <DialogDescription>
            Help {post.author.name} reach their goal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Display */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex justify-between text-sm text-green-800 dark:text-green-200 mb-2">
              <span>
                Progress: ${post.currentAmount} / ${post.targetAmount}
              </span>
              <span>${remainingAmount.toFixed(2)} remaining</span>
            </div>
            <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(((post.currentAmount || 0) / (post.targetAmount || 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Contribution Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Contribution Amount ({post.currency})
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              placeholder="25.00"
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Maximum: ${remainingAmount.toFixed(2)} {post.currency}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {[5, 10, 25, 50].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({ ...formData, amount: amount.toString() })
                }
                disabled={amount > remainingAmount}
              >
                ${amount}
              </Button>
            ))}
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Leave an encouraging message..."
              value={formData.message}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Contribute Anonymously</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Your name won't be shown publicly
              </div>
            </div>
            <Switch
              checked={formData.isAnonymous}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isAnonymous: checked })
              }
            />
          </div>

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
              {isSubmitting
                ? "Contributing..."
                : `Contribute $${formData.amount || "0"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
