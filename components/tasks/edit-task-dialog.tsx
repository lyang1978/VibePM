"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Plus, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Step {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  complexity: string;
  order: number;
  steps?: Step[];
}

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description || "");
  const [complexity, setComplexity] = React.useState(task.complexity);
  const [status, setStatus] = React.useState(task.status);

  // Steps state
  const [steps, setSteps] = React.useState<Step[]>(task.steps || []);
  const [newStepTitle, setNewStepTitle] = React.useState("");
  const [isAddingStep, setIsAddingStep] = React.useState(false);
  const [loadingSteps, setLoadingSteps] = React.useState<Set<string>>(new Set());

  // Fetch full task data with steps when dialog opens
  const fetchTaskWithSteps = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`);
      if (response.ok) {
        const fullTask = await response.json();
        setSteps(fullTask.steps || []);
      }
    } catch (error) {
      console.error("Failed to fetch task steps:", error);
    }
  }, [task.id]);

  React.useEffect(() => {
    if (open) {
      fetchTaskWithSteps();
    }
  }, [open, fetchTaskWithSteps]);

  // Reset form when task changes
  React.useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setComplexity(task.complexity);
    setStatus(task.status);
    setSteps(task.steps || []);
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          complexity,
          status,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        onOpenChange(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;

    setIsAddingStep(true);
    try {
      const response = await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          title: newStepTitle.trim(),
        }),
      });

      if (response.ok) {
        const newStep = await response.json();
        setSteps([...steps, newStep]);
        setNewStepTitle("");
      }
    } catch (error) {
      console.error("Failed to add step:", error);
    } finally {
      setIsAddingStep(false);
    }
  };

  const handleToggleStep = async (stepId: string, completed: boolean) => {
    setLoadingSteps(prev => new Set(prev).add(stepId));
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        setSteps(steps.map(s =>
          s.id === stepId ? { ...s, completed } : s
        ));
      }
    } catch (error) {
      console.error("Failed to toggle step:", error);
    } finally {
      setLoadingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    setLoadingSteps(prev => new Set(prev).add(stepId));
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSteps(steps.filter(s => s.id !== stepId));
      }
    } catch (error) {
      console.error("Failed to delete step:", error);
    } finally {
      setLoadingSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    }
  };

  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the task details below.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description (optional)</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Add more details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-complexity">Complexity</Label>
                    <Select value={complexity} onValueChange={setComplexity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMALL">Small (S)</SelectItem>
                        <SelectItem value="MEDIUM">Medium (M)</SelectItem>
                        <SelectItem value="LARGE">Large (L)</SelectItem>
                        <SelectItem value="EXTRA_LARGE">Extra Large (XL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="BLOCKED">Blocked</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Steps Checklist Section */}
                <div className="grid gap-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      Steps {totalSteps > 0 && (
                        <span className="text-muted-foreground text-xs ml-1">
                          ({completedSteps}/{totalSteps})
                        </span>
                      )}
                    </Label>
                    {totalSteps > 0 && (
                      <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Steps List */}
                  <div className="space-y-2">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group"
                      >
                        <Checkbox
                          id={`step-${step.id}`}
                          checked={step.completed}
                          onCheckedChange={(checked) =>
                            handleToggleStep(step.id, checked as boolean)
                          }
                          disabled={loadingSteps.has(step.id)}
                        />
                        <label
                          htmlFor={`step-${step.id}`}
                          className={`flex-1 text-sm cursor-pointer ${
                            step.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {step.title}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteStep(step.id)}
                          disabled={loadingSteps.has(step.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Step Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a step..."
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStep();
                        }
                      }}
                      disabled={isAddingStep}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddStep}
                      disabled={isAddingStep || !newStepTitle.trim()}
                    >
                      {isAddingStep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="flex justify-between sm:justify-between mt-4">
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
                <Button type="submit" disabled={isSubmitting || !title.trim()}>
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
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{task.title}&quot;. This action cannot be undone.
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
