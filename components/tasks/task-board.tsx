"use client";

import * as React from "react";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  complexity: string;
  status: string;
  order: number;
  valueScore: number | null;
  easeScore: number | null;
}

interface Phase {
  id: string;
  name: string;
  tasks: Task[];
}

interface TaskBoardProps {
  projectSlug: string;
  tasks: Task[];
  phases: Phase[];
}

const statusColumns = [
  { id: "TODO", label: "To Do", color: "bg-gray-500" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { id: "COMPLETED", label: "Completed", color: "bg-green-500" },
];

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

export function TaskBoard({ projectSlug, tasks, phases }: TaskBoardProps) {
  const getTasksByStatus = (status: string) =>
    tasks.filter((task) => task.status === status);

  if (tasks.length === 0) {
    return (
      <Card className="card-brutalist">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-6 text-xl font-semibold">No tasks yet</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Break your project into discrete, AI-promptable chunks.
            Each task should be achievable in a single session.
          </p>
          <Button className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Create First Task
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statusColumns.map((column) => (
        <div key={column.id} className="space-y-3">
          {/* Column Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", column.color)} />
              <span className="font-medium">{column.label}</span>
              <span className="text-sm text-muted-foreground">
                ({getTasksByStatus(column.id).length})
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Task Cards */}
          <div className="space-y-2">
            {getTasksByStatus(column.id).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card className="card-brutalist cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-0.5 h-4 w-4 cursor-grab text-muted-foreground" />
            <span className="font-medium leading-tight">{task.title}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Add Prompt</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {task.description && (
          <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn("text-xs", complexityColors[task.complexity])}
          >
            {complexityLabels[task.complexity]}
          </Badge>
          {task.valueScore && task.easeScore && (
            <span className="text-xs text-muted-foreground">
              P: {task.valueScore * task.easeScore}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
