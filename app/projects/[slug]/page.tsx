import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Copy,
  Zap,
  Plus,
} from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContextExport } from "@/components/shared/context-export";
import { ProjectNameEditor } from "@/components/projects/project-name-editor";
import { ProjectKanban } from "@/components/projects/project-kanban";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
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

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
          },
        },
      },
      tasks: {
        orderBy: { order: "asc" },
      },
      prompts: {
        orderBy: { createdAt: "desc" },
      },
      contextDoc: true,
      _count: {
        select: {
          tasks: true,
          prompts: true,
          decisions: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              All Projects
            </Button>
          </Link>
          <ProjectNameEditor
            projectSlug={slug}
            projectName={project.name}
            projectProblem={project.problem}
            status={project.status}
            statusColor={statusColors[project.status]}
            statusLabel={statusLabels[project.status]}
          />
          {project.problem && (
            <p className="max-w-2xl text-muted-foreground text-sm">{project.problem}</p>
          )}

          {/* Progress Bar */}
          <div className="flex items-center gap-3 pt-2 max-w-xl">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {completedTasks}/{totalTasks} tasks ({progress}%)
            </span>
          </div>
        </div>
        <Button variant="outline" size="icon" className="border-2 border-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="pt-2">
        <ProjectKanban
          projectId={project.id}
          projectSlug={slug}
          tasks={project.tasks}
          prompts={project.prompts}
        />
      </div>

      {/* Compact Tabs Section */}
      <Tabs defaultValue="tasks" className="space-y-2">
        <TabsList className="border-2 border-foreground">
          <TabsTrigger value="tasks">Task Details</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Library</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-2">
          <Card className="card-brutalist">
            <CardContent className="p-4 max-h-[200px] overflow-y-auto">
              {project.tasks.length > 0 ? (
                <div className="space-y-3">
                  {project.tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              task.status === "COMPLETED"
                                ? "bg-green-500"
                                : task.status === "IN_PROGRESS"
                                ? "bg-blue-500"
                                : task.status === "BLOCKED"
                                ? "bg-red-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              task.complexity === "SMALL"
                                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                : task.complexity === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                : task.complexity === "LARGE"
                                ? "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                                : "bg-red-500/20 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {task.complexity === "EXTRA_LARGE" ? "XL" : task.complexity.charAt(0)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {project.tasks.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{project.tasks.length - 5} more tasks
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1">
                    <Plus className="h-3 w-3" />
                    Create first task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-2">
          <Card className="card-brutalist">
            <CardContent className="p-4 max-h-[200px] overflow-y-auto">
              {project.prompts.length > 0 ? (
                <div className="space-y-2">
                  {project.prompts.slice(0, 5).map((prompt) => (
                    <div
                      key={prompt.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">{prompt.title}</span>
                      </div>
                      {prompt.outcome && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            prompt.outcome === "WORKED"
                              ? "bg-green-500/20 text-green-700"
                              : prompt.outcome === "PARTIAL"
                              ? "bg-yellow-500/20 text-yellow-700"
                              : "bg-red-500/20 text-red-700"
                          }`}
                        >
                          {prompt.outcome}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {project.prompts.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{project.prompts.length - 5} more prompts
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-muted-foreground">No prompts saved yet</p>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1">
                    <Plus className="h-3 w-3" />
                    Save a prompt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-2">
          <Card className="card-brutalist">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Context Document</CardTitle>
              <Button size="sm" variant="outline" className="gap-2 h-7 text-xs border-2 border-foreground">
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0 max-h-[160px] overflow-y-auto">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                {project.contextDoc?.content?.slice(0, 500) || "No context document generated yet."}
                {(project.contextDoc?.content?.length || 0) > 500 && "..."}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
