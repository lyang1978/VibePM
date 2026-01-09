import { Plus, FolderKanban, Clock, ArrowRight, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuickCapture } from "@/components/shared/quick-capture";
import { RecentlyDeleted } from "@/components/shared/recently-deleted";
import { db } from "@/lib/db";

const statusColors: Record<string, string> = {
  PLANNING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  PAUSED: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  ARCHIVED: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export default async function DashboardPage() {
  // Fetch recent projects
  const recentProjects = await db.project.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      _count: {
        select: {
          tasks: true,
          prompts: true,
        },
      },
    },
  });

  // Fetch stats
  // Count all non-deleted, non-completed projects as "active"
  const [activeProjectsCount, completedTasksCount, promptsCount, workedPromptsCount] = await Promise.all([
    db.project.count({ where: { deletedAt: null, status: { not: "COMPLETED" } } }),
    db.task.count({ where: { status: "COMPLETED" } }),
    db.prompt.count({ where: { outcome: { not: null } } }),
    db.prompt.count({ where: { outcome: "WORKED" } }),
  ]);

  const successRate = promptsCount > 0 ? Math.round((workedPromptsCount / promptsCount) * 100) : null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Plan before you prompt. Track what works.
        </p>
      </div>

      {/* Stats Section - Top */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-brutalist">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-semibold mt-1">{activeProjectsCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-semibold mt-1">{completedTasksCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prompts Tracked</p>
                <p className="text-2xl font-semibold mt-1">{promptsCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-semibold mt-1">{successRate !== null ? `${successRate}%` : "—"}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects Card */}
        <Card className="card-brutalist">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentProjects.length > 0 ? (
              <div className="space-y-1">
                {recentProjects.slice(0, 5).map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project._count.tasks} tasks • {project._count.prompts} prompts
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`${statusColors[project.status]} text-xs`}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FolderKanban className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-3 text-sm font-medium">No projects yet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first project to get started
                </p>
                <Link href="/projects/new" className="mt-3">
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    New Project
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Capture Section */}
        <QuickCapture />
      </div>

      {/* Recently Deleted Section */}
      <RecentlyDeleted />
    </div>
  );
}
