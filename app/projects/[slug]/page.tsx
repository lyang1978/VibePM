import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Play,
  Copy,
  CheckCircle2,
  Clock,
  Zap,
  FileText,
  Plus,
} from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "@/components/tasks/task-board";
import { ContextExport } from "@/components/shared/context-export";

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
        take: 5,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              All Projects
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="secondary" className={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          {project.problem && (
            <p className="max-w-2xl text-muted-foreground">{project.problem}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${slug}/session`}>
            <Button className="gap-2">
              <Play className="h-4 w-4" />
              Start Session
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="border-2 border-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} tasks
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-foreground transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project._count.tasks}</div>
            <p className="text-xs text-muted-foreground">Total tasks</p>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompts</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project._count.prompts}</div>
            <p className="text-xs text-muted-foreground">Saved prompts</p>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decisions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project._count.decisions}</div>
            <p className="text-xs text-muted-foreground">Documented</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="border-2 border-foreground">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-header">Task Board</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
          <TaskBoard
            projectSlug={slug}
            tasks={project.tasks}
            phases={project.phases}
          />
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-header">Recent Prompts</h2>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Prompt
            </Button>
          </div>
          {project.prompts.length > 0 ? (
            <div className="space-y-4">
              {project.prompts.map((prompt) => (
                <Card key={prompt.id} className="card-brutalist">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{prompt.title}</CardTitle>
                      {prompt.outcome && (
                        <Badge
                          variant="secondary"
                          className={
                            prompt.outcome === "WORKED"
                              ? "bg-green-500/20 text-green-700"
                              : prompt.outcome === "PARTIAL"
                              ? "bg-yellow-500/20 text-yellow-700"
                              : "bg-red-500/20 text-red-700"
                          }
                        >
                          {prompt.outcome}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-32 overflow-auto rounded bg-muted p-3 text-xs">
                      {prompt.content.slice(0, 300)}
                      {prompt.content.length > 300 && "..."}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="card-brutalist">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No prompts yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save prompts as you work to track what works
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-header">Context Document</h2>
            <Button size="sm" variant="outline" className="gap-2 border-2 border-foreground">
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
          </div>
          <ContextExport project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
