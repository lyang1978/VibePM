import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/prompts - Create a new prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, taskId, title, content, outcome, notes } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const prompt = await db.prompt.create({
      data: {
        projectId,
        taskId: taskId || null,
        title: title.trim(),
        content: content.trim(),
        outcome: outcome || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
