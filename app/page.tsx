import { Plus, FolderKanban, Clock, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickCapture } from "@/components/shared/quick-capture";
import { RecentlyDeleted } from "@/components/shared/recently-deleted";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Plan before you prompt. Track what works.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* New Project Card */}
        <Link href="/projects/new">
          <Card className="card-brutalist cursor-pointer transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)]">
            <CardHeader className="pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-pink">
                <Plus className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">New Project</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with a problem, define your MVP, break it down
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Browse Projects Card */}
        <Link href="/projects">
          <Card className="card-brutalist cursor-pointer transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)]">
            <CardHeader className="pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-purple">
                <FolderKanban className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg">All Projects</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                View and manage all your projects
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Capture Section */}
      <QuickCapture />

      {/* Recently Deleted Section */}
      <RecentlyDeleted />

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-header">Recent Projects</h2>
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        <Card className="card-brutalist">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first project to start planning before prompting
            </p>
            <Link href="/projects/new" className="mt-4">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section (will be populated later) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompts Saved</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">With outcomes tracked</p>
          </CardContent>
        </Card>

        <Card className="card-brutalist">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Prompts that worked</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
