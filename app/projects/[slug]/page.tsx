import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
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
        include: {
          task: {
            select: {
              id: true,
              title: true,
              complexity: true,
            },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
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
          activities={project.activities}
        />
      </div>
    </div>
  );
}
