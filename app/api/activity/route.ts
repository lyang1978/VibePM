import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/activity - Create a new activity log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, type, title, description, taskId, promptId, metadata } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    const activity = await db.activity.create({
      data: {
        projectId,
        type,
        title,
        description: description || null,
        taskId: taskId || null,
        promptId: promptId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Failed to create activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}