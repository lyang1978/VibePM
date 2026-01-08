"use client";

import * as React from "react";
import { Zap, X, Loader2, GripVertical, Pencil, Check, Eye, EyeOff, Rocket, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useAIAnalysis } from "./ai-analysis-context";
import { PromoteToProject } from "./promote-to-project";
import Link from "next/link";

export interface QuickCaptureItem {
  id: string;
  content: string;
  projectId: string | null;
  createdAt: string;
  project?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export function QuickCapture() {
  const [captures, setCaptures] = React.useState<QuickCaptureItem[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [expandedAnalysis, setExpandedAnalysis] = React.useState<Set<string>>(new Set());
  const [promoteCapture, setPromoteCapture] = React.useState<QuickCaptureItem | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const editRef = React.useRef<HTMLTextAreaElement>(null);
  const { addItem, setIsDragging, setOnCardsUpdated } = useAIAnalysis();

  const AI_MARKER = "\n\n---\n✨ AI Analysis:\n";

  // Helper to parse content into original and analysis parts
  const parseContent = (content: string) => {
    const markerIndex = content.indexOf(AI_MARKER);
    if (markerIndex === -1) {
      return { original: content, analysis: null };
    }
    return {
      original: content.substring(0, markerIndex),
      analysis: content.substring(markerIndex + AI_MARKER.length),
    };
  };

  // Toggle analysis visibility
  const toggleAnalysis = (id: string) => {
    setExpandedAnalysis((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch captures on mount
  React.useEffect(() => {
    fetchCaptures();
  }, []);

  // Listen for restore events from RecentlyDeleted
  React.useEffect(() => {
    const handleCaptureRestored = () => {
      fetchCaptures();
    };
    window.addEventListener("capture-restored", handleCaptureRestored);
    return () => window.removeEventListener("capture-restored", handleCaptureRestored);
  }, []);

  // Register callback for when AI analysis appends to cards
  React.useEffect(() => {
    setOnCardsUpdated(() => fetchCaptures);
    return () => setOnCardsUpdated(null);
  }, [setOnCardsUpdated]);

  const fetchCaptures = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/quick-capture");
      if (res.ok) {
        const data = await res.json();
        setCaptures(data);
      }
    } catch (error) {
      console.error("Failed to fetch captures:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (res.ok) {
        const newCapture = await res.json();
        setCaptures((prev) => [newCapture, ...prev]);
        setInput("");
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error("Failed to save capture:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setCaptures((prev) => prev.filter((c) => c.id !== id));

    try {
      await fetch(`/api/quick-capture/${id}`, { method: "DELETE" });
      // Notify RecentlyDeleted to refresh
      window.dispatchEvent(new CustomEvent("capture-deleted"));
    } catch (error) {
      console.error("Failed to delete capture:", error);
      // Refetch on error to restore state
      fetchCaptures();
    }
  };

  const startEditing = (capture: QuickCaptureItem) => {
    setEditingId(capture.id);
    setEditContent(capture.content);
    // Auto-expand analysis when editing
    setExpandedAnalysis((prev) => new Set(prev).add(capture.id));
    // Focus the edit textarea after render
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) {
      cancelEditing();
      return;
    }

    // Optimistic update
    setCaptures((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: editContent.trim() } : c))
    );
    setEditingId(null);
    // Auto-collapse analysis after editing
    setExpandedAnalysis((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      await fetch(`/api/quick-capture/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });
    } catch (error) {
      console.error("Failed to update capture:", error);
      // Refetch on error to restore state
      fetchCaptures();
    }
    setEditContent("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUpdate(id);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <Card className="card-brutalist">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-blue">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-lg">Quick Capture</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Brain dump an idea... (Enter to save)"
              className="w-full resize-none rounded-lg border-2 border-foreground bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              rows={2}
            />
            {isSubmitting && (
              <div className="absolute right-3 top-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Press Enter to save, Shift+Enter for new line
          </p>
        </form>

        {/* Captures List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : captures.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No ideas captured yet. Start typing above!
            </p>
          ) : (
            captures.map((capture) => {
              const { original, analysis } = parseContent(capture.content);
              const hasAnalysis = analysis !== null;
              const isExpanded = expandedAnalysis.has(capture.id);

              return (
                <div
                  key={capture.id}
                  draggable={editingId !== capture.id}
                  onDragStart={(e) => {
                    if (editingId === capture.id) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData("application/json", JSON.stringify(capture));
                    e.dataTransfer.effectAllowed = "copy";
                    setIsDragging(true);
                  }}
                  onDragEnd={() => {
                    setIsDragging(false);
                    // Add to AI analysis on successful drop
                    addItem(capture);
                  }}
                  className={`group flex items-start gap-2 rounded-lg border-2 border-foreground/20 bg-muted/30 p-3 transition-colors hover:border-foreground/40 ${
                    editingId === capture.id ? "cursor-text" : "cursor-grab active:cursor-grabbing"
                  }`}
                >
                  {editingId !== capture.id && (
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    {editingId === capture.id ? (
                      <textarea
                        ref={editRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, capture.id)}
                        onBlur={() => handleUpdate(capture.id)}
                        className="w-full resize-none rounded border-2 border-foreground bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                        rows={Math.max(2, editContent.split("\n").length)}
                      />
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {original}
                        </p>
                        {hasAnalysis && isExpanded && (
                          <div className="mt-2 pt-2 border-t border-foreground/10">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              ✨ AI Analysis
                            </p>
                            <p className="text-sm whitespace-pre-wrap break-words text-muted-foreground">
                              {analysis}
                            </p>
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(capture.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {capture.project && (
                            <Link
                              href={`/projects/${capture.project.slug}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {capture.project.name}
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {editingId === capture.id ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleUpdate(capture.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  ) : (
                    <div className="flex shrink-0 gap-1">
                      {hasAnalysis && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleAnalysis(capture.id)}
                          title={isExpanded ? "Hide AI analysis" : "Show AI analysis"}
                        >
                          {isExpanded ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      {!capture.projectId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => setPromoteCapture(capture)}
                          title="Promote to Project"
                        >
                          <Rocket className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => startEditing(capture)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDelete(capture.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Promote to Project Dialog */}
      {promoteCapture && (
        <PromoteToProject
          capture={promoteCapture}
          open={!!promoteCapture}
          onOpenChange={(open) => {
            if (!open) setPromoteCapture(null);
          }}
          onCaptureUpdated={fetchCaptures}
        />
      )}
    </Card>
  );
}
