import { Plus, FolderKanban, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { ProjectCard } from "@/components/projects/project-card";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          tasks: true,
          prompts: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-assisted development projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9 border-2 border-foreground"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={project._count.tasks}
              promptCount={project._count.prompts}
            />
          ))}
        </div>
      ) : (
        <Card className="card-brutalist">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">No projects yet</h3>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Create your first project to start planning before you prompt.
              Define the problem, scope your MVP, and break it into promptable chunks.
            </p>
            <Link href="/projects/new" className="mt-6">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Your First Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
