import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface GeneratePromptRequest {
  taskId: string;
  projectId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePromptRequest = await request.json();
    const { taskId, projectId } = body;

    if (!taskId || !projectId) {
      return NextResponse.json(
        { error: "Task ID and Project ID are required" },
        { status: 400 }
      );
    }

    // Fetch task and project details
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            name: true,
            problem: true,
            mvpDefinition: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert at crafting effective prompts for AI coding assistants like Claude or Cursor. Your job is to generate a clear, actionable prompt that will help the user accomplish their development task.

Rules for generating prompts:
1. Be specific and actionable - the prompt should be ready to copy/paste into an AI coding assistant
2. Include relevant context about what the task is trying to accomplish
3. Specify any constraints, patterns, or conventions to follow
4. Ask for explanations where appropriate
5. Structure the prompt clearly with sections if needed
6. Keep it concise but complete - avoid unnecessary verbosity
7. Use markdown formatting for readability

The prompt should be written as if the user is speaking directly to an AI assistant.`;

    const userPrompt = `Generate an effective AI coding prompt for this task:

PROJECT: ${task.project.name}
${task.project.problem ? `PROJECT GOAL: ${task.project.problem}` : ""}
${task.project.mvpDefinition ? `MVP DEFINITION: ${task.project.mvpDefinition}` : ""}

TASK TITLE: ${task.title}
${task.description ? `TASK DESCRIPTION: ${task.description}` : ""}
COMPLEXITY: ${task.complexity}

Generate a prompt that will help accomplish this task effectively. The prompt should be ready to use with an AI coding assistant.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API Error:", error);
      return NextResponse.json(
        { error: "Failed to generate prompt" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content?.trim();

    if (!generatedContent) {
      return NextResponse.json(
        { error: "Failed to generate prompt content" },
        { status: 500 }
      );
    }

    // Create the prompt in the database
    const prompt = await db.prompt.create({
      data: {
        projectId,
        taskId,
        title: `Prompt for: ${task.title}`,
        content: generatedContent,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        projectId,
        type: "prompt_generated",
        title: `Generated prompt for "${task.title}"`,
        taskId,
        promptId: prompt.id,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
