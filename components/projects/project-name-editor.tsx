"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Sparkles, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ProjectNameEditorProps {
  projectSlug: string;
  projectName: string;
  projectProblem: string | null;
  status: string;
  statusColor: string;
  statusLabel: string;
}

export function ProjectNameEditor({
  projectSlug,
  projectName,
  projectProblem,
  status,
  statusColor,
  statusLabel,
}: ProjectNameEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(projectName);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!name.trim() || name === projectName) {
      setName(projectName);
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        router.refresh();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update project name:", error);
      setName(projectName);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(projectName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const generateAIName = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/projects/generate-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentName: projectName,
          problem: projectProblem,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setName(data.name);
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Failed to generate AI name:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-3xl font-bold h-auto py-1 px-2 border-2 border-foreground"
          disabled={isLoading}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 w-8"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-green-600" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
        <Badge variant="secondary" className={statusColor}>
          {statusLabel}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl font-bold tracking-tight">{projectName}</h1>
      <Badge variant="secondary" className={statusColor}>
        {statusLabel}
      </Badge>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8"
          title="Edit name"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={generateAIName}
          disabled={isGenerating}
          className="h-8 w-8"
          title="Generate AI name"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
