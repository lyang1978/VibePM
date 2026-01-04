"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Target,
  ImageIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Problem", icon: Lightbulb, description: "What are you building and why?" },
  { id: 2, title: "MVP", icon: Target, description: "What does done look like?" },
  { id: 3, title: "Visuals", icon: ImageIcon, description: "Add reference images" },
];

interface FormData {
  name: string;
  problem: string;
  mvpDefinition: string;
  images: File[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    problem: "",
    mvpDefinition: "",
    images: [],
  });

  const updateFormData = (field: keyof FormData, value: string | File[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0 && formData.problem.trim().length > 0;
      case 2:
        return formData.mvpDefinition.trim().length > 0;
      case 3:
        return true; // Images are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          problem: formData.problem,
          mvpDefinition: formData.mvpDefinition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();
      router.push(`/projects/${project.slug}`);
    } catch (error) {
      console.error("Error creating project:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Plan before you prompt. Let&apos;s capture your idea and define what success looks like.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => currentStep > step.id && setCurrentStep(step.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 transition-colors",
                currentStep === step.id && "bg-foreground text-background",
                currentStep > step.id && "text-foreground cursor-pointer hover:bg-muted",
                currentStep < step.id && "text-muted-foreground cursor-not-allowed"
              )}
              disabled={currentStep < step.id}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  currentStep === step.id && "border-background bg-background text-foreground",
                  currentStep > step.id && "border-foreground bg-foreground text-background",
                  currentStep < step.id && "border-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs opacity-70">{step.description}</p>
              </div>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2",
                  currentStep > step.id ? "bg-foreground" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <Card className="card-brutalist">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5" })}
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  placeholder="e.g., VibePM, Expense Tracker, Portfolio Site"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="border-2 border-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What problem are you solving?
                </label>
                <p className="text-xs text-muted-foreground">
                  Be specific. Who has this problem? Why does it matter?
                </p>
                <Textarea
                  placeholder="I'm building this because... It solves the problem of... The people who need this are..."
                  value={formData.problem}
                  onChange={(e) => updateFormData("problem", e.target.value)}
                  className="min-h-[150px] border-2 border-foreground"
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                What does &quot;DONE&quot; look like for v1?
              </label>
              <p className="text-xs text-muted-foreground">
                Define your MVP. What&apos;s the minimum that validates your idea?
                Be ruthless about scope.
              </p>
              <Textarea
                placeholder="v1 is complete when I can... The core feature is... I will NOT include..."
                value={formData.mvpDefinition}
                onChange={(e) => updateFormData("mvpDefinition", e.target.value)}
                className="min-h-[200px] border-2 border-foreground"
              />
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">MoSCoW Framework</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li><strong>Must have:</strong> Core functionality that defines the product</li>
                  <li><strong>Should have:</strong> Important but not essential for v1</li>
                  <li><strong>Could have:</strong> Nice to have if time permits</li>
                  <li><strong>Won&apos;t have:</strong> Explicitly out of scope for v1</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reference Images</label>
                <p className="text-xs text-muted-foreground">
                  Paste or drag screenshots, mockups, or inspiration images.
                  What should this feel like?
                </p>
              </div>
              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => updateFormData("images", images)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2 border-2 border-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "Creating..." : "Create Project"}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
