"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Trash2,
  RotateCcw,
  X,
  FolderKanban,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface DeletedProject {
  id: string;
  name: string;
  slug: string;
  deletedAt: string;
  _count: {
    tasks: number;
    prompts: number;
  };
}

interface DeletedCapture {
  id: string;
  content: string;
  deletedAt: string;
}

export function RecentlyDeleted() {
  const [deletedProjects, setDeletedProjects] = React.useState<DeletedProject[]>([]);
  const [deletedCaptures, setDeletedCaptures] = React.useState<DeletedCapture[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<{
    type: "project" | "capture";
    id: string;
    name: string;
  } | null>(null);

  const fetchDeleted = React.useCallback(async () => {
    try {
      const [projectsRes, capturesRes] = await Promise.all([
        fetch("/api/projects?deleted=true"),
        fetch("/api/quick-capture?deleted=true"),
      ]);

      if (projectsRes.ok) {
        const projects = await projectsRes.json();
        setDeletedProjects(projects);
      }

      if (capturesRes.ok) {
        const captures = await capturesRes.json();
        setDeletedCaptures(captures);
      }
    } catch (error) {
      console.error("Failed to fetch deleted items:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  // Listen for delete events from QuickCapture
  React.useEffect(() => {
    const handleCaptureDeleted = () => {
      fetchDeleted();
    };
    window.addEventListener("capture-deleted", handleCaptureDeleted);
    return () => window.removeEventListener("capture-deleted", handleCaptureDeleted);
  }, [fetchDeleted]);

  const handleRestore = async (type: "project" | "capture", id: string, slug?: string) => {
    setRestoringId(id);
    try {
      const endpoint =
        type === "project"
          ? `/api/projects/${slug}/restore`
          : `/api/quick-capture/${id}/restore`;

      const response = await fetch(endpoint, { method: "POST" });

      if (response.ok) {
        if (type === "project") {
          setDeletedProjects((prev) => prev.filter((p) => p.id !== id));
        } else {
          setDeletedCaptures((prev) => prev.filter((c) => c.id !== id));
          // Notify QuickCapture to refresh
          window.dispatchEvent(new CustomEvent("capture-restored"));
        }
      }
    } catch (error) {
      console.error("Failed to restore:", error);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDelete) return;

    setDeletingId(confirmDelete.id);
    try {
      const endpoint =
        confirmDelete.type === "project"
          ? `/api/projects/${confirmDelete.name}?permanent=true`
          : `/api/quick-capture/${confirmDelete.id}?permanent=true`;

      const response = await fetch(endpoint, { method: "DELETE" });

      if (response.ok) {
        if (confirmDelete.type === "project") {
          setDeletedProjects((prev) => prev.filter((p) => p.id !== confirmDelete.id));
        } else {
          setDeletedCaptures((prev) => prev.filter((c) => c.id !== confirmDelete.id));
        }
      }
    } catch (error) {
      console.error("Failed to permanently delete:", error);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const totalDeleted = deletedProjects.length + deletedCaptures.length;

  if (isLoading) {
    return null;
  }

  if (totalDeleted === 0) {
    return null;
  }

  return (
    <>
      <Card className="card-brutalist border-dashed border-muted-foreground/30">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Trash2 className="h-4 w-4" />
              Recently Deleted ({totalDeleted})
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Deleted Projects */}
              {deletedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 p-3 bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project._count.tasks} tasks, {project._count.prompts} prompts
                        {" · "}
                        Deleted{" "}
                        {formatDistanceToNow(new Date(project.deletedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRestore("project", project.id, project.slug)}
                      disabled={restoringId === project.id}
                      title="Restore"
                    >
                      {restoringId === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() =>
                        setConfirmDelete({
                          type: "project",
                          id: project.id,
                          name: project.slug,
                        })
                      }
                      disabled={deletingId === project.id}
                      title="Delete permanently"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Deleted Captures */}
              {deletedCaptures.map((capture) => {
                const preview = capture.content.split("\n")[0].slice(0, 60);
                return (
                  <div
                    key={capture.id}
                    className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/30 p-3 bg-muted/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate">
                          {preview}
                          {capture.content.length > 60 && "..."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Deleted{" "}
                          {formatDistanceToNow(new Date(capture.deletedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRestore("capture", capture.id)}
                        disabled={restoringId === capture.id}
                        title="Restore"
                      >
                        {restoringId === capture.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          setConfirmDelete({
                            type: "capture",
                            id: capture.id,
                            name: preview,
                          })
                        }
                        disabled={deletingId === capture.id}
                        title="Delete permanently"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this{" "}
              {confirmDelete?.type === "project" ? "project and all its data" : "idea"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? "Deleting..." : "Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
