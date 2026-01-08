"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  problem: string | null;
  mvpDefinition: string | null;
  status: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    complexity: string;
  }>;
  contextDoc: {
    content: string;
    lastGenerated: Date;
  } | null;
}

interface ContextExportProps {
  project: Project;
}

export function ContextExport({ project }: ContextExportProps) {
  const [copied, setCopied] = React.useState(false);

  const generateContext = () => {
    const todoTasks = project.tasks.filter((t) => t.status === "TODO");
    const inProgressTasks = project.tasks.filter((t) => t.status === "IN_PROGRESS");
    const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED");

    return `# Project: ${project.name}

## Problem Statement
${project.problem || "_Not defined_"}

## MVP Definition
${project.mvpDefinition || "_Not defined_"}

## Current Status: ${project.status}

### Tasks Overview
- **To Do:** ${todoTasks.length} tasks
- **In Progress:** ${inProgressTasks.length} tasks
- **Completed:** ${completedTasks.length} tasks

${inProgressTasks.length > 0 ? `### Currently Working On
${inProgressTasks.map((t) => `- ${t.title} (${t.complexity})`).join("\n")}` : ""}

${todoTasks.length > 0 ? `### Next Up
${todoTasks.slice(0, 5).map((t) => `- ${t.title} (${t.complexity})`).join("\n")}` : ""}

${completedTasks.length > 0 ? `### Recently Completed
${completedTasks.slice(0, 3).map((t) => `- ${t.title}`).join("\n")}` : ""}

---
*Context generated for Claude Code session*
`;
  };

  const contextContent = generateContext();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contextContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Copy this context to provide Claude with project background
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-2 border-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Context
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="card-brutalist">
        <CardContent className="p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {contextContent}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
