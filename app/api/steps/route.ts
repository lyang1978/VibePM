import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/steps - Create a new step for a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, title } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Get the highest order value for steps in this task
    const maxOrderStep = await db.step.findFirst({
      where: { taskId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrderStep?.order ?? -1) + 1;

    const step = await db.step.create({
      data: {
        taskId,
        title: title.trim(),
        order: newOrder,
        completed: false,
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Failed to create step:", error);
    return NextResponse.json(
      { error: "Failed to create step" },
      { status: 500 }
    );
  }
}
