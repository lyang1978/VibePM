"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, FolderKanban, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  slug: string;
  problem: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  promptCount: number;
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  ACTIVE: "bg-green-500/20 text-green-700 dark:text-green-400",
  PAUSED: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  COMPLETED: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  ARCHIVED: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function ProjectCard({ project, taskCount, promptCount }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`}>
      <Card className="card-brutalist cursor-pointer transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-pink">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold leading-none">{project.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {project.problem && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {project.problem}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {taskCount} tasks
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {promptCount} prompts
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
