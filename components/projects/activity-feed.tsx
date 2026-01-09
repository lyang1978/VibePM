"use client";

import * as React from "react";
import {
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  task_created: <Plus className="h-3.5 w-3.5" />,
  task_status_changed: <ArrowRight className="h-3.5 w-3.5" />,
  prompt_generated: <Sparkles className="h-3.5 w-3.5" />,
  prompt_outcome_set: <CheckCircle className="h-3.5 w-3.5" />,
};

const activityColors: Record<string, string> = {
  task_created: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  task_status_changed: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  prompt_generated: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  prompt_outcome_set: "bg-green-500/20 text-green-600 dark:text-green-400",
};

function getRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = activityIcons[activity.type] || <Clock className="h-3.5 w-3.5" />;
  const colorClass = activityColors[activity.type] || "bg-muted text-muted-foreground";

  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full shrink-0",
          colorClass
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {activity.title}
        </p>
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {activity.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {getRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Recent Activity</h3>
      </div>
      <div className="flex-1 rounded-lg border bg-card p-3">
        {activities.length > 0 ? (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Actions will appear here as you work
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
