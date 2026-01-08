"use client";

import * as React from "react";
import { Sparkles, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIAnalysis } from "./ai-analysis-context";
import { cn } from "@/lib/utils";

interface AnalysisResult {
  originalItems: { id: string; content: string }[];
  analysis: string;
}

export function AIDropZone() {
  const { droppedItems, removeItem, clearItems, isDragging } = useAIAnalysis();
  const [isOver, setIsOver] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    // The actual item adding is handled by the drag source
  };

  const handleAnalyze = async () => {
    if (droppedItems.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: droppedItems }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze ideas");
      }

      const result = await response.json();
      setAnalysisResult(result);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze ideas");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <h3 className="section-header px-3 flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          AI Analysis
        </h3>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "mx-2 rounded-lg border-2 border-dashed p-3 transition-all",
            isDragging && "border-foreground/60 bg-muted/50",
            isOver && "border-foreground bg-muted scale-[1.02]",
            !isDragging && !isOver && "border-foreground/30",
            droppedItems.length > 0 && "border-solid border-foreground/40"
          )}
        >
          {droppedItems.length === 0 ? (
            <p className={cn(
              "text-center text-xs text-muted-foreground py-2",
              isDragging && "text-foreground font-medium"
            )}>
              {isDragging ? "Drop ideas here" : "Drag ideas here for AI analysis"}
            </p>
          ) : (
            <div className="space-y-2">
              {/* Dropped Items */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {droppedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1 rounded bg-muted/50 px-2 py-1 text-xs"
                  >
                    <span className="flex-1 truncate">{item.content}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 rounded p-0.5 hover:bg-foreground/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-7 text-xs"
                  onClick={clearItems}
                  disabled={isAnalyzing}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Analyze
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Analysis Results
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {analysisResult && (
              <div className="space-y-6">
                {/* Original Ideas */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Original Ideas
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.originalItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-lg border-2 border-foreground/20 bg-muted/30 p-3"
                      >
                        <span className="text-xs text-muted-foreground mr-2">
                          {index + 1}.
                        </span>
                        <span className="text-sm">{item.content}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    AI Recommendations
                  </h3>
                  <div className="rounded-lg border-2 border-foreground/20 bg-muted/10 p-4 prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {analysisResult.analysis}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowResults(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowResults(false);
                clearItems();
              }}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
