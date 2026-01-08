"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Prompt {
  id: string;
  title: string;
  content: string;
  outcome: string | null;
  notes?: string | null;
}

interface EditPromptDialogProps {
  prompt: Prompt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPromptDialog({ prompt, open, onOpenChange }: EditPromptDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [title, setTitle] = React.useState(prompt.title);
  const [content, setContent] = React.useState(prompt.content);
  const [outcome, setOutcome] = React.useState(prompt.outcome || "");
  const [notes, setNotes] = React.useState(prompt.notes || "");

  // Reset form when prompt changes
  React.useEffect(() => {
    setTitle(prompt.title);
    setContent(prompt.content);
    setOutcome(prompt.outcome || "");
    setNotes(prompt.notes || "");
  }, [prompt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          outcome: outcome || null,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update prompt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Prompt</DialogTitle>
              <DialogDescription>
                Update your prompt and track its effectiveness.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-prompt-title">Title</Label>
                <Input
                  id="edit-prompt-title"
                  placeholder="Prompt title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-prompt-content">Prompt Content</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="edit-prompt-content"
                  placeholder="The prompt content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-prompt-outcome">Outcome</Label>
                  <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="How did it go?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not tested yet</SelectItem>
                      <SelectItem value="WORKED">Worked</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-prompt-notes">Notes (optional)</Label>
                <Textarea
                  id="edit-prompt-notes"
                  placeholder="What worked? What didn't? Any learnings..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this prompt. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
