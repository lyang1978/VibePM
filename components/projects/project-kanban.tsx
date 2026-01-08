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
}

interface ProjectKanbanProps {
  projectId: string;
  projectSlug: string;
  tasks: Task[];
  prompts: Prompt[];
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
          "flex-1 space-y-2 min-h-[400px] p-3 rounded-lg bg-muted/50 border-2 border-dashed transition-all",
          isDropTarget
            ? "border-purple-500 bg-purple-500/10"
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
        "card-brutalist cursor-pointer bg-background hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] transition-all",
        isDragging && "opacity-50"
      )}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 cursor-grab" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", complexityColors[task.complexity])}
              >
                {complexityLabels[task.complexity]}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PromptCardProps {
  prompt: Prompt;
  onClick?: () => void;
}

function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <Card
      className="card-brutalist cursor-pointer bg-background hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)] transition-all"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight">{prompt.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {prompt.content.slice(0, 100)}...
            </p>
            {prompt.outcome && (
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={cn("text-xs", outcomeColors[prompt.outcome])}
                >
                  {prompt.outcome}
                </Badge>
              </div>
            )}
          </div>
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
}: ProjectKanbanProps) {
  const router = useRouter();
  const [addTaskOpen, setAddTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [editingPrompt, setEditingPrompt] = React.useState<Prompt | null>(null);
  const [draggingTask, setDraggingTask] = React.useState<Task | null>(null);
  const [isPromptDropTarget, setIsPromptDropTarget] = React.useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState(false);

  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggingTask(task);
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
    setIsPromptDropTarget(false);
  };

  const handlePromptDragOver = (e: React.DragEvent) => {
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

    setIsGeneratingPrompt(true);
    try {
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
        >
          {todoTasks.length > 0 ? (
            todoTasks.map((task) => (
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
              <p className="text-xs text-muted-foreground">No tasks yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 gap-1 border border-dashed border-transparent hover:border-muted-foreground/50 hover:bg-muted transition-all"
                onClick={() => setAddTaskOpen(true)}
              >
                <Plus className="h-3 w-3" />
                Add task
              </Button>
            </div>
          )}
        </KanbanColumn>

        {/* Prompts Column */}
        <KanbanColumn
          title="Prompts"
          count={prompts.length}
          color="bg-purple-500/20 text-purple-700 dark:text-purple-300"
          onDragOver={handlePromptDragOver}
          onDrop={handlePromptDrop}
          isDropTarget={isPromptDropTarget}
          isGenerating={isGeneratingPrompt}
        >
          <div onDragLeave={handlePromptDragLeave}>
            {prompts.length > 0 ? (
              prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onClick={() => setEditingPrompt(prompt)}
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
        >
          {inProgressTasks.length > 0 ? (
            inProgressTasks.map((task) => (
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
              <p className="text-xs text-muted-foreground">Nothing in progress</p>
            </div>
          )}
        </KanbanColumn>

        {/* Done Column */}
        <KanbanColumn
          title="Done"
          count={completedTasks.length}
          color="bg-green-500/20 text-green-700 dark:text-green-300"
        >
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
              <p className="text-xs text-muted-foreground">Nothing completed yet</p>
            </div>
          )}
        </KanbanColumn>
      </div>
    </>
  );
}
