"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/media-upload";
import type { PostMedia } from "@/lib/types";
import type React from "react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppContext } from "@/contexts/app-context";
import { useState } from "react";

interface CreateGiveawayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGiveawayModal({
  open,
  onOpenChange,
}: CreateGiveawayModalProps) {
  const { createPost } = useAppContext();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prizeAmount: "",
    currency: "USDC",
    winnerCount: "1",
    selectionType: "random" as "random" | "manual" | "first-come",
    proofRequired: false,
    endDate: "",
  });

  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addRequirement = () => {
    if (
      newRequirement.trim() &&
      !requirements.includes(newRequirement.trim())
    ) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const removeRequirement = (requirement: string) => {
    setRequirements(requirements.filter((req) => req !== requirement));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      createPost({
        type: "giveaway",
        title: formData.title,
        description: formData.description,
        status: "active",
        prizeAmount: Number.parseFloat(formData.prizeAmount),
        currency: formData.currency,
        winnerCount: Number.parseInt(formData.winnerCount),
        selectionType: formData.selectionType,
        entryRequirements: requirements,
        proofRequired: formData.proofRequired,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        media: media.length > 0 ? media : undefined,
        userId: "", // Will be set by context
      });

      toast("Giveaway created!", {
        description: "Your giveaway has been posted to the community.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        prizeAmount: "",
        currency: "USDC",
        winnerCount: "1",
        selectionType: "random",
        proofRequired: false,
        endDate: "",
      });
      setRequirements([]);
      setMedia([]);
      onOpenChange(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create giveaway. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectionTypeDescription = () => {
    switch (formData.selectionType) {
      case "random":
        return "Winners will be randomly selected from all entries";
      case "manual":
        return "You will manually choose the winners";
      case "first-come":
        return "First entries to submit will automatically win (instant disbursement)";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Giveaway</DialogTitle>
          <DialogDescription>
            Set up your giveaway details and requirements
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Giveaway Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., $500 USDC Giveaway for New Developers!"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your giveaway, why you're doing it, and any additional details..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Media (Optional)</h3>
            <MediaUpload onMediaChange={setMedia} maxFiles={3} />
          </div>

          {/* Prize Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Prize Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prizeAmount">Prize Amount</Label>
                <Input
                  id="prizeAmount"
                  name="prizeAmount"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  value={formData.prizeAmount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="STRK">STRK</SelectItem>
                    <SelectItem value="NFT">NFT</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="winnerCount">Number of Winners</Label>
                <Input
                  id="winnerCount"
                  name="winnerCount"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.winnerCount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selectionType">Winner Selection</Label>
                <Select
                  value={formData.selectionType}
                  onValueChange={(value: "random" | "manual" | "first-come") =>
                    setFormData({ ...formData, selectionType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random Selection</SelectItem>
                    <SelectItem value="manual">Manual Selection</SelectItem>
                    <SelectItem value="first-come">
                      First Come, First Served
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {getSelectionTypeDescription()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Entry Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Entry Requirements</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Add a requirement (e.g., Follow @username)"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addRequirement())
                }
              />
              <Button type="button" onClick={addRequirement} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {requirements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {requirements.map((req, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(req)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Require Proof</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Participants must provide proof when entering
                </div>
              </div>
              <Switch
                checked={formData.proofRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, proofRequired: checked })
                }
              />
            </div>
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
              {isSubmitting ? "Creating..." : "Create Giveaway"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
