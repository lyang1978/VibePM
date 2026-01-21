import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await db.task.findUnique({
      where: { id },
      include: {
        prompts: true,
        images: true,
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, complexity, status, order } = body;

    const task = await db.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const oldStatus = task.status;

    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(complexity !== undefined && { complexity }),
        ...(status !== undefined && { status }),
        ...(order !== undefined && { order }),
      },
    });

    // Log activity for status changes
    if (status !== undefined && status !== oldStatus) {
      const statusLabels: Record<string, string> = {
        TODO: "To Do",
        IN_PROGRESS: "In Progress",
        BLOCKED: "Blocked",
        COMPLETED: "Done",
        CANCELLED: "Cancelled",
      };
      await db.activity.create({
        data: {
          projectId: task.projectId,
          type: "task_status_changed",
          title: `Moved "${task.title}" to ${statusLabels[status] || status}`,
          taskId: task.id,
          metadata: JSON.stringify({ oldStatus, newStatus: status }),
        },
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await db.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
