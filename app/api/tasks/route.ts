import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, description, complexity, status } = body;

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

    // Get the highest order value for tasks in this project
    const maxOrderTask = await db.task.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrderTask?.order ?? -1) + 1;

    const task = await db.task.create({
      data: {
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        complexity: complexity || "MEDIUM",
        status: status || "TODO",
        order: newOrder,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        projectId,
        type: "task_created",
        title: `Created task "${task.title}"`,
        taskId: task.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
