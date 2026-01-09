"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  FolderKanban,
  Zap,
  CheckCircle2,
  Pencil,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
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
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/projects/${project.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDuplicate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // Fetch full project details
      const response = await fetch(`/api/projects/${project.slug}`);
      if (!response.ok) throw new Error("Failed to fetch project");

      const projectData = await response.json();

      // Create a new project with copied data
      const createResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${projectData.name} (Copy)`,
          problem: projectData.problem,
          mvpDefinition: projectData.mvpDefinition,
        }),
      });

      if (createResponse.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to duplicate project:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${project.slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleArchive = () => {
    handleStatusChange("ARCHIVED");
  };

  const handleUnarchive = () => {
    handleStatusChange("PLANNING");
  };

  const isArchived = project.status === "ARCHIVED";

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if the click target is not inside the dropdown
    const target = e.target as HTMLElement;
    if (!target.closest('[data-slot="dropdown-menu-trigger"]') &&
        !target.closest('[data-slot="dropdown-menu-content"]')) {
      router.push(`/projects/${project.slug}`);
    }
  };

  return (
    <>
      <Card
        className="card-brutalist cursor-pointer transition-all hover:shadow-md"
        onClick={handleCardClick}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium leading-none">{project.name}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {/* Dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleDuplicate} disabled={isUpdating}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Status submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Change Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("PLANNING")}
                        disabled={project.status === "PLANNING" || isUpdating}
                      >
                        <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
                        Planning
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("ACTIVE")}
                        disabled={project.status === "ACTIVE" || isUpdating}
                      >
                        <Play className="mr-2 h-4 w-4 text-green-500" />
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("PAUSED")}
                        disabled={project.status === "PAUSED" || isUpdating}
                      >
                        <Pause className="mr-2 h-4 w-4 text-orange-500" />
                        Paused
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("COMPLETED")}
                        disabled={project.status === "COMPLETED" || isUpdating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        Completed
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {isArchived ? (
                  <DropdownMenuItem onClick={handleUnarchive} disabled={isUpdating}>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Unarchive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleArchive} disabled={isUpdating}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;? This will permanently
              delete the project and all its tasks, prompts, and decisions. This action
              cannot be undone.
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
