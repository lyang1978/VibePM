"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Zap,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
];

const quickActions = [
  {
    title: "Quick Capture",
    icon: Zap,
    shortcut: "C",
  },
  {
    title: "New Project",
    icon: Plus,
    shortcut: "N",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r-2 border-foreground bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b-2 border-foreground px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground">
          <Sparkles className="h-5 w-5 text-background" />
        </div>
        <span className="text-xl font-bold tracking-tight">VibePM</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-medium",
                    isActive && "bg-foreground text-background"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4 bg-foreground/20" />

        {/* Projects Section */}
        <div className="space-y-2">
          <h3 className="section-header px-3">Projects</h3>
          <Link href="/projects">
            <Button
              variant={pathname === "/projects" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 font-medium",
                pathname === "/projects" && "bg-foreground text-background"
              )}
            >
              <FolderKanban className="h-4 w-4" />
              All Projects
            </Button>
          </Link>
          {/* Project list will be dynamically populated */}
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No projects yet
          </div>
        </div>

        <Separator className="my-4 bg-foreground/20" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="section-header px-3">Quick Actions</h3>
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="ghost"
              className="w-full justify-between font-medium"
            >
              <span className="flex items-center gap-3">
                <action.icon className="h-4 w-4" />
                {action.title}
              </span>
              <kbd className="pointer-events-none h-5 select-none rounded border border-foreground/20 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                {action.shortcut}
              </kbd>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="border-t-2 border-foreground p-3">
        <Link href="/settings">
          <Button
            variant={pathname === "/settings" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 font-medium",
              pathname === "/settings" && "bg-foreground text-background"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
