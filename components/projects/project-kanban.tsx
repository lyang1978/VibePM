"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Zap, GripVertical, Plus, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { EditPromptDialog } from "@/components/prompts/edit-prompt-dialog";
import { ActivityFeed } from "@/components/projects/activity-feed";
import { InsightsPanel } from "@/components/projects/insights-panel";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  complexity: string;
  order: number;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  outcome: string | null;
  taskId: string | null;
  task?: {
    id: string;
    title: string;
    complexity: string;
  } | null;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  taskId: string | null;
  promptId: string | null;
  metadata: string | null;
  createdAt: Date | string;
}

interface ProjectKanbanProps {
  projectId: string;
  projectSlug: string;
  tasks: Task[];
  prompts: Prompt[];
  activities: Activity[];
}

const complexityColors: Record<string, string> = {
  SMALL: "bg-green-500/20 text-green-700 dark:text-green-400",
  MEDIUM: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  LARGE: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  EXTRA_LARGE: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const complexityLabels: Record<string, string> = {
  SMALL: "S",
  MEDIUM: "M",
  LARGE: "L",
  EXTRA_LARGE: "XL",
};

const outcomeColors: Record<string, string> = {
  WORKED: "bg-green-500/20 text-green-700 dark:text-green-400",
  PARTIAL: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  FAILED: "bg-red-500/20 text-red-700 dark:text-red-400",
};

interface KanbanColumnProps {
  title: string;
  count: number;
  children: React.ReactNode;
  color?: string;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
  isGenerating?: boolean;
}

function KanbanColumn({
  title,
  count,
  children,
  color,
  onDragOver,
  onDrop,
  isDropTarget,
  isGenerating,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            color || "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
        {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
      </div>
      <div
        className={cn(
          "flex-1 space-y-6 min-h-[400px] p-3 rounded-xl bg-muted/30 border border-dashed transition-all",
          isDropTarget
            ? "border-ring bg-ring/10 shadow-sm"
            : "border-muted-foreground/20"
        )}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {children}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "card-brutalist cursor-pointer bg-background hover:shadow-md transition-all",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <CardContent className="px-2 py-1.5 h-[38px]">
        <div className="flex items-center gap-1.5 h-full">
          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
          <p className="font-medium text-xs leading-tight flex-1 min-w-0 line-clamp-2">{task.title}</p>
          <Badge
            variant="secondary"
            className={cn("text-[10px] px-1.5 py-0 shrink-0", complexityColors[task.complexity])}
          >
            {complexityLabels[task.complexity]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface PromptCardProps {
  prompt: Prompt;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

function PromptCard({ prompt, onClick, onDragStart, onDragEnd, isDragging }: PromptCardProps) {
  // Show task title if linked to a task, otherwise show prompt title
  const displayTitle = prompt.task?.title || prompt.title;
  const canDrag = !!prompt.taskId; // Only draggable if linked to a task

  return (
    <Card
      className={cn(
        "card-brutalist cursor-pointer bg-background hover:shadow-md transition-all",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <CardContent className="px-2 py-1.5 h-[38px]">
        <div className="flex items-center gap-1.5 h-full">
          {canDrag && (
            <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
          )}
          <Zap className="h-3 w-3 text-purple-500 shrink-0" />
          <p className="font-medium text-xs leading-tight flex-1 min-w-0 line-clamp-2">{displayTitle}</p>
          {prompt.task?.complexity && (
            <Badge
              variant="secondary"
              className={cn("text-[10px] px-1.5 py-0 shrink-0", complexityColors[prompt.task.complexity])}
            >
              {complexityLabels[prompt.task.complexity]}
            </Badge>
          )}
          {prompt.outcome && (
            <Badge
              variant="secondary"
              className={cn("text-[10px] px-1.5 py-0 shrink-0", outcomeColors[prompt.outcome])}
            >
              {prompt.outcome}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectKanban({
  projectId,
  projectSlug,
  tasks,
  prompts,
  activities,
}: ProjectKanbanProps) {
  const router = useRouter();
  const [addTaskOpen, setAddTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [editingPrompt, setEditingPrompt] = React.useState<Prompt | null>(null);
  const [draggingTask, setDraggingTask] = React.useState<Task | null>(null);
  const [draggingPrompt, setDraggingPrompt] = React.useState<Prompt | null>(null);
  const [isTodoDropTarget, setIsTodoDropTarget] = React.useState(false);
  const [isPromptDropTarget, setIsPromptDropTarget] = React.useState(false);
  const [isInProgressDropTarget, setIsInProgressDropTarget] = React.useState(false);
  const [isDoneDropTarget, setIsDoneDropTarget] = React.useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState(false);

  // Map of taskId to prompt for quick lookup
  const taskToPrompt = new Map(prompts.map((p) => [p.taskId, p]));

  // Get task IDs that have prompts AND are in TODO status (shown in Prompts column, not TODO)
  const promptsForTodoTasks = prompts.filter((p) => {
    if (!p.taskId) return false;
    const task = tasks.find((t) => t.id === p.taskId);
    return task?.status === "TODO";
  });
  const taskIdsInPromptsColumn = new Set(promptsForTodoTasks.map((p) => p.taskId));

  // TODO tasks that don't have prompts (tasks with prompts show in Prompts column)
  const todoTasks = tasks.filter((t) => t.status === "TODO" && !taskIdsInPromptsColumn.has(t.id));
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggingTask(task);
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
    setDraggingPrompt(null);
    setIsTodoDropTarget(false);
    setIsPromptDropTarget(false);
    setIsInProgressDropTarget(false);
    setIsDoneDropTarget(false);
  };

  const handleTodoDragOver = (e: React.DragEvent) => {
    // Only accept IN_PROGRESS tasks
    if (!draggingTask || draggingTask.status !== "IN_PROGRESS") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsTodoDropTarget(true);
  };

  const handleTodoDragLeave = () => {
    setIsTodoDropTarget(false);
  };

  const handleTodoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsTodoDropTarget(false);

    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId || !draggingTask) return;

    // Only accept IN_PROGRESS tasks
    if (draggingTask.status !== "IN_PROGRESS") return;

    try {
      // Update task status to TODO
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "TODO",
        }),
      });

      if (response.ok) {
        // Delete the prompt if it exists (task goes back to clean TODO state)
        const prompt = taskToPrompt.get(taskId);
        if (prompt) {
          await fetch(`/api/prompts/${prompt.id}`, {
            method: "DELETE",
          });
        }
        router.refresh();
      } else {
        console.error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setDraggingTask(null);
    }
  };

  const handlePromptDragStart = (e: React.DragEvent, prompt: Prompt) => {
    if (!prompt.taskId) return;
    setDraggingPrompt(prompt);
    e.dataTransfer.setData("promptTaskId", prompt.taskId);
    e.dataTransfer.setData("promptId", prompt.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePromptDragOver = (e: React.DragEvent) => {
    // Only accept TODO tasks
    if (!draggingTask || draggingTask.status !== "TODO") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsPromptDropTarget(true);
  };

  const handlePromptDragLeave = () => {
    setIsPromptDropTarget(false);
  };

  const handlePromptDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsPromptDropTarget(false);

    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId || !draggingTask) return;

    // Only accept TODO tasks - reject all others
    if (draggingTask.status !== "TODO") {
      setDraggingTask(null);
      return;
    }

    // Check if this task already has a prompt - if so, just refresh to show it
    if (taskToPrompt.has(taskId)) {
      router.refresh();
      setDraggingTask(null);
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      // Generate the prompt (this links the prompt to the task)
      const response = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          projectId,
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to generate prompt");
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
    } finally {
      setIsGeneratingPrompt(false);
      setDraggingTask(null);
    }
  };

  const handleInProgressDragOver = (e: React.DragEvent) => {
    // Accept: prompts, TODO tasks (skip prompt), or COMPLETED tasks (move back)
    const validDrag =
      draggingPrompt ||
      (draggingTask && (draggingTask.status === "TODO" || draggingTask.status === "COMPLETED"));
    if (!validDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsInProgressDropTarget(true);
  };

  const handleInProgressDragLeave = () => {
    setIsInProgressDropTarget(false);
  };

  const handleInProgressDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsInProgressDropTarget(false);

    // Check if it's a prompt being dropped (from Prompts column)
    const promptTaskId = e.dataTransfer.getData("promptTaskId");

    // Check if it's a task being dropped (from Done column)
    const taskId = e.dataTransfer.getData("taskId");

    if (promptTaskId && draggingPrompt) {
      // Moving from Prompts to In Progress
      try {
        const response = await fetch(`/api/tasks/${promptTaskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "IN_PROGRESS",
          }),
        });

        if (response.ok) {
          router.refresh();
        } else {
          console.error("Failed to update task status");
        }
      } catch (error) {
        console.error("Error updating task:", error);
      } finally {
        setDraggingPrompt(null);
      }
    } else if (taskId && draggingTask && (draggingTask.status === "COMPLETED" || draggingTask.status === "TODO")) {
      // Moving from Done or TODO directly to In Progress
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "IN_PROGRESS",
          }),
        });

        if (response.ok) {
          router.refresh();
        } else {
          console.error("Failed to update task status");
        }
      } catch (error) {
        console.error("Error updating task:", error);
      } finally {
        setDraggingTask(null);
      }
    }
  };

  const handleDoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDoneDropTarget(true);
  };

  const handleDoneDragLeave = () => {
    setIsDoneDropTarget(false);
  };

  const handleDoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDoneDropTarget(false);

    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId || !draggingTask) return;

    // Only allow moving from In Progress to Done
    if (draggingTask.status !== "IN_PROGRESS") return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setDraggingTask(null);
    }
  };

  return (
    <>
      <AddTaskDialog
        projectId={projectId}
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
      />
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}
      {editingPrompt && (
        <EditPromptDialog
          prompt={editingPrompt}
          open={!!editingPrompt}
          onOpenChange={(open) => !open && setEditingPrompt(null)}
        />
      )}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* TODO Column */}
        <KanbanColumn
          title="Todo"
          count={todoTasks.length}
          color="bg-slate-500/20 text-slate-700 dark:text-slate-300"
          onDragOver={handleTodoDragOver}
          onDrop={handleTodoDrop}
          isDropTarget={isTodoDropTarget}
        >
          <div onDragLeave={handleTodoDragLeave} className="space-y-2">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setEditingTask(task)}
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                isDragging={draggingTask?.id === task.id}
              />
            ))}
            {isTodoDropTarget ? (
              <div className="flex flex-col items-center justify-center h-16 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Drop to move back to Todo
                </p>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1 border border-dashed border-transparent hover:border-muted-foreground/50 hover:bg-muted transition-all"
                onClick={() => setAddTaskOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Add task
              </Button>
            )}
          </div>
        </KanbanColumn>

        {/* Prompts Column */}
        <KanbanColumn
          title="Prompts"
          count={promptsForTodoTasks.length}
          color="bg-purple-500/20 text-purple-700 dark:text-purple-300"
          onDragOver={handlePromptDragOver}
          onDrop={handlePromptDrop}
          isDropTarget={isPromptDropTarget}
          isGenerating={isGeneratingPrompt}
        >
          <div onDragLeave={handlePromptDragLeave} className="space-y-2">
            {promptsForTodoTasks.length > 0 ? (
              promptsForTodoTasks.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onClick={() => setEditingPrompt(prompt)}
                  onDragStart={(e) => handlePromptDragStart(e, prompt)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingPrompt?.id === prompt.id}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                {isPromptDropTarget ? (
                  <>
                    <Sparkles className="h-6 w-6 text-purple-500 mb-2" />
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      Drop to generate prompt
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">No prompts yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drag a task here to generate
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </KanbanColumn>

        {/* In Progress Column */}
        <KanbanColumn
          title="In Progress"
          count={inProgressTasks.length}
          color="bg-blue-500/20 text-blue-700 dark:text-blue-300"
          onDragOver={handleInProgressDragOver}
          onDrop={handleInProgressDrop}
          isDropTarget={isInProgressDropTarget}
        >
          <div onDragLeave={handleInProgressDragLeave} className="space-y-2">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => {
                const prompt = taskToPrompt.get(task.id);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => prompt ? setEditingPrompt(prompt) : setEditingTask(task)}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingTask?.id === task.id}
                  />
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                {isInProgressDropTarget ? (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Drop to start working
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Nothing in progress</p>
                )}
              </div>
            )}
          </div>
        </KanbanColumn>

        {/* Done Column */}
        <KanbanColumn
          title="Done"
          count={completedTasks.length}
          color="bg-green-500/20 text-green-700 dark:text-green-300"
          onDragOver={handleDoneDragOver}
          onDrop={handleDoneDrop}
          isDropTarget={isDoneDropTarget}
        >
          <div onDragLeave={handleDoneDragLeave} className="space-y-2">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setEditingTask(task)}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingTask?.id === task.id}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                {isDoneDropTarget ? (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Drop to mark complete
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Nothing completed yet</p>
                )}
              </div>
            )}
          </div>
        </KanbanColumn>
      </div>

      {/* Activity Feed & Insights Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <ActivityFeed activities={activities} />
        <InsightsPanel tasks={tasks} prompts={prompts} />
      </div>
    </>
  );
}
