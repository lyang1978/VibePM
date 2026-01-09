"use client";

import * as React from "react";
import {
  Lightbulb,
  Clock,
  AlertCircle,
  Play,
  Pause,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  complexity: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Prompt {
  id: string;
  outcome: string | null;
  taskId: string | null;
  createdAt?: string;
}

interface Insight {
  id: string;
  type: "info" | "warning" | "success";
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface InsightsPanelProps {
  tasks: Task[];
  prompts: Prompt[];
  className?: string;
}

function generateInsights(tasks: Task[], prompts: Prompt[]): Insight[] {
  const insights: Insight[] = [];

  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  // Check for empty backlog
  if (todoTasks.length === 0 && tasks.length > 0) {
    insights.push({
      id: "empty-backlog",
      type: "info",
      icon: <AlertCircle className="h-4 w-4" />,
      title: "Empty backlog",
      description: "Add more tasks to keep momentum going",
    });
  }

  // Check for no tasks at all
  if (tasks.length === 0) {
    insights.push({
      id: "no-tasks",
      type: "info",
      icon: <Play className="h-4 w-4" />,
      title: "Get started",
      description: "Create your first task to begin tracking progress",
    });
  }

  // Check for ready to work (prompts exist but nothing in progress)
  const promptsWithTodo = prompts.filter((p) => {
    const task = tasks.find((t) => t.id === p.taskId);
    return task?.status === "TODO";
  });
  if (promptsWithTodo.length > 0 && inProgressTasks.length === 0) {
    insights.push({
      id: "ready-to-work",
      type: "info",
      icon: <Play className="h-4 w-4" />,
      title: "Ready to start",
      description: `${promptsWithTodo.length} prompt${promptsWithTodo.length > 1 ? "s" : ""} ready - drag to In Progress`,
    });
  }

  // Check for high complexity pile-up
  const highComplexityInProgress = inProgressTasks.filter(
    (t) => t.complexity === "LARGE" || t.complexity === "EXTRA_LARGE"
  );
  if (highComplexityInProgress.length >= 2) {
    insights.push({
      id: "complexity-pileup",
      type: "warning",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "Heavy workload",
      description: `${highComplexityInProgress.length} large tasks in progress - consider focusing on one`,
    });
  }

  // Check for stale tasks (in progress for a long time based on updatedAt)
  const now = new Date();
  const staleTasks = inProgressTasks.filter((t) => {
    if (!t.updatedAt) return false;
    const updatedAt = new Date(t.updatedAt);
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 3;
  });
  if (staleTasks.length > 0) {
    insights.push({
      id: "stale-tasks",
      type: "warning",
      icon: <Clock className="h-4 w-4" />,
      title: "Stale tasks detected",
      description: `${staleTasks.length} task${staleTasks.length > 1 ? "s" : ""} unchanged for 3+ days`,
    });
  }

  // Check prompt effectiveness
  const promptsWithOutcome = prompts.filter((p) => p.outcome);
  if (promptsWithOutcome.length >= 3) {
    const worked = promptsWithOutcome.filter((p) => p.outcome === "WORKED").length;
    const successRate = Math.round((worked / promptsWithOutcome.length) * 100);

    if (successRate >= 70) {
      insights.push({
        id: "prompt-success",
        type: "success",
        icon: <BarChart3 className="h-4 w-4" />,
        title: "Prompts working well",
        description: `${successRate}% success rate on ${promptsWithOutcome.length} prompts`,
      });
    } else if (successRate < 50) {
      insights.push({
        id: "prompt-struggle",
        type: "warning",
        icon: <BarChart3 className="h-4 w-4" />,
        title: "Prompts need refinement",
        description: `Only ${successRate}% success rate - try adding more context`,
      });
    }
  }

  // Check for completion momentum
  if (completedTasks.length > 0) {
    const recentCompletions = completedTasks.filter((t) => {
      if (!t.updatedAt) return false;
      const updatedAt = new Date(t.updatedAt);
      const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    });
    if (recentCompletions.length >= 3) {
      insights.push({
        id: "momentum",
        type: "success",
        icon: <TrendingUp className="h-4 w-4" />,
        title: "Great momentum",
        description: `${recentCompletions.length} tasks completed this week`,
      });
    }
  }

  // Check for all blocked scenario
  if (inProgressTasks.length > 0 && todoTasks.length === 0 && promptsWithTodo.length === 0) {
    insights.push({
      id: "all-in-progress",
      type: "info",
      icon: <Pause className="h-4 w-4" />,
      title: "Everything in progress",
      description: "Consider completing tasks before adding more",
    });
  }

  // Good progress check
  if (completedTasks.length > 0 && completedTasks.length >= tasks.length / 2) {
    insights.push({
      id: "good-progress",
      type: "success",
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Making progress",
      description: `${Math.round((completedTasks.length / tasks.length) * 100)}% of tasks completed`,
    });
  }

  return insights.slice(0, 4); // Limit to 4 insights
}

const insightTypeStyles: Record<string, string> = {
  info: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
  success: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
};

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        insightTypeStyles[insight.type]
      )}
    >
      <div className="shrink-0 mt-0.5">{insight.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{insight.title}</p>
        <p className="text-xs opacity-80 mt-0.5">{insight.description}</p>
      </div>
    </div>
  );
}

export function InsightsPanel({ tasks, prompts, className }: InsightsPanelProps) {
  const insights = React.useMemo(
    () => generateInsights(tasks, prompts),
    [tasks, prompts]
  );

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Insights</h3>
      </div>
      <div className="flex-1 rounded-lg border bg-card p-3">
        {insights.length > 0 ? (
          <div className="space-y-2">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Lightbulb className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Looking good!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No suggestions right now
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
