"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Loader2,
  Sparkles,
  Check,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseAnalysis, appendAnalysis } from "@/lib/parse-analysis";

interface QuickCaptureItem {
  id: string;
  content: string;
  projectId: string | null;
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  hint: string;
}

interface ProjectSuggestions {
  suggestedName: string;
  suggestedProblem: string;
  suggestedMvp: string;
  clarifyingQuestions: ClarifyingQuestion[];
}

type Step = "analyzing" | "generating" | "questions" | "review" | "creating" | "success";

interface PromoteToProjectProps {
  capture: QuickCaptureItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptureUpdated: () => void;
}

export function PromoteToProject({
  capture,
  open,
  onOpenChange,
  onCaptureUpdated,
}: PromoteToProjectProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("analyzing");
  const [error, setError] = React.useState<string | null>(null);

  // Parsed content
  const [rawIdea, setRawIdea] = React.useState("");
  const [analysis, setAnalysis] = React.useState<string | null>(null);

  // AI suggestions
  const [suggestions, setSuggestions] = React.useState<ProjectSuggestions | null>(null);

  // Editable fields
  const [projectName, setProjectName] = React.useState("");
  const [problemStatement, setProblemStatement] = React.useState("");
  const [mvpDefinition, setMvpDefinition] = React.useState("");

  // Clarifying questions
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  // Created project
  const [createdProject, setCreatedProject] = React.useState<{
    slug: string;
    name: string;
  } | null>(null);

  // Parse content and start flow when dialog opens
  React.useEffect(() => {
    if (open && capture) {
      const parsed = parseAnalysis(capture.content);
      setRawIdea(parsed.rawIdea);
      setAnalysis(parsed.analysis);
      setError(null);
      setAnswers({});
      setCreatedProject(null);

      if (parsed.analysis) {
        // Already has analysis, skip to generating
        setStep("generating");
        generateSuggestions(parsed.rawIdea, parsed.analysis);
      } else {
        // Need to analyze first
        setStep("analyzing");
        analyzeIdea(capture.id, parsed.rawIdea);
      }
    }
  }, [open, capture]);

  const analyzeIdea = async (captureId: string, content: string) => {
    try {
      // Call analyze API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: captureId, content }] }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze idea");
      }

      const data = await response.json();
      const newAnalysis = data.analysis;

      // Save analysis to the capture
      const updatedContent = appendAnalysis(content, newAnalysis);
      await fetch(`/api/quick-capture/${captureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updatedContent }),
      });

      setAnalysis(newAnalysis);
      onCaptureUpdated();

      // Now generate suggestions
      setStep("generating");
      await generateSuggestions(content, newAnalysis);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("Failed to analyze your idea. Please try again.");
    }
  };

  const generateSuggestions = async (
    content: string,
    analysisText: string,
    userAnswers?: { question: string; answer: string }[]
  ) => {
    try {
      setStep("generating");
      const response = await fetch("/api/promote-to-project/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captureId: capture.id,
          content,
          analysis: analysisText,
          userAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const data: ProjectSuggestions = await response.json();
      setSuggestions(data);

      // Pre-fill editable fields
      setProjectName(data.suggestedName);
      setProblemStatement(data.suggestedProblem);
      setMvpDefinition(data.suggestedMvp);

      // Go to questions if there are any, otherwise review
      if (data.clarifyingQuestions && data.clarifyingQuestions.length > 0) {
        setStep("questions");
      } else {
        setStep("review");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Failed to generate project suggestions. Please try again.");
    }
  };

  const handleRefine = async () => {
    if (!suggestions || !analysis) return;

    const userAnswers = suggestions.clarifyingQuestions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({
        question: q.question,
        answer: answers[q.id],
      }));

    await generateSuggestions(rawIdea, analysis, userAnswers);
  };

  const handleCreateProject = async () => {
    try {
      setStep("creating");

      // Create the project
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          problem: problemStatement,
          mvpDefinition: mvpDefinition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();

      // Link the QuickCapture to the project
      await fetch(`/api/quick-capture/${capture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      setCreatedProject({ slug: project.slug, name: project.name });
      onCaptureUpdated();
      setStep("success");
    } catch (err) {
      console.error("Project creation failed:", err);
      setError("Failed to create project. Please try again.");
      setStep("review");
    }
  };

  const handleViewProject = () => {
    if (createdProject) {
      router.push(`/projects/${createdProject.slug}`);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Promote to Project
            {step !== "success" && (
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                {step === "analyzing" && "Step 1: Analyzing"}
                {step === "generating" && "Step 2: Generating"}
                {step === "questions" && "Step 3: Refine"}
                {step === "review" && "Step 4: Review"}
                {step === "creating" && "Creating..."}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
          {/* Error State */}
          {error && (
            <div className="mb-4 p-3 rounded-lg border-2 border-red-500/50 bg-red-500/10 text-sm text-red-500">
              {error}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => {
                  setError(null);
                  if (analysis) {
                    generateSuggestions(rawIdea, analysis);
                  } else {
                    analyzeIdea(capture.id, rawIdea);
                  }
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Analyzing Step */}
          {step === "analyzing" && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Analyzing your idea...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI is reviewing and expanding on your brainstorm
                </p>
              </div>
            </div>
          )}

          {/* Generating Step */}
          {step === "generating" && (
            <div className="py-12 text-center space-y-4">
              <Sparkles className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Generating project suggestions...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Creating name, problem statement, and MVP definition
                </p>
              </div>
            </div>
          )}

          {/* Questions Step */}
          {step === "questions" && suggestions && (
            <div className="space-y-6 pb-4">
              <div className="rounded-lg border-2 border-foreground/20 bg-muted/30 p-4">
                <h3 className="font-semibold text-sm mb-2">Original Idea</h3>
                <p className="text-sm text-muted-foreground">{rawIdea}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Help us refine your project
                </h3>
                {suggestions.clarifyingQuestions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-sm font-medium">{q.question}</label>
                    <Input
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder={q.hint}
                      className="border-2 border-foreground/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-6 pb-4">
              <div className="rounded-lg border-2 border-foreground/20 bg-muted/30 p-4">
                <h3 className="font-semibold text-sm mb-2">Original Idea</h3>
                <p className="text-sm text-muted-foreground">{rawIdea}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="border-2 border-foreground/20 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Problem Statement</label>
                  <Textarea
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="What problem does this solve?"
                    className="border-2 border-foreground/20 min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">MVP Definition (MoSCoW)</label>
                  <Textarea
                    value={mvpDefinition}
                    onChange={(e) => setMvpDefinition(e.target.value)}
                    placeholder="Must Have, Should Have, Could Have, Won't Have"
                    className="border-2 border-foreground/20 min-h-[200px] font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Creating Step */}
          {step === "creating" && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Creating your project...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Setting up project structure
                </p>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && createdProject && (
            <div className="py-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-lg">Project Created!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {createdProject.name} is ready for you
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
          {step === "questions" && (
            <>
              <Button variant="outline" onClick={() => setStep("review")}>
                Skip
              </Button>
              <Button onClick={handleRefine} className="gap-1">
                <RefreshCw className="h-4 w-4" />
                Refine Suggestions
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!projectName.trim()}
                className="gap-1"
              >
                <Rocket className="h-4 w-4" />
                Create Project
              </Button>
            </>
          )}

          {step === "success" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleViewProject} className="gap-1">
                <ExternalLink className="h-4 w-4" />
                View Project
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
