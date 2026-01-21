import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/steps/[id] - Get a single step
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const step = await db.step.findUnique({
      where: { id },
    });

    if (!step) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to fetch step:", error);
    return NextResponse.json(
      { error: "Failed to fetch step" },
      { status: 500 }
    );
  }
}

// PATCH /api/steps/[id] - Update a step
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, completed, order } = body;

    // Check if step exists
    const existingStep = await db.step.findUnique({
      where: { id },
    });

    if (!existingStep) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: {
      title?: string;
      completed?: boolean;
      order?: number;
    } = {};

    if (title !== undefined) {
      if (title.trim() === "") {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (completed !== undefined) {
      updateData.completed = Boolean(completed);
    }

    if (order !== undefined) {
      updateData.order = Number(order);
    }

    const step = await db.step.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to update step:", error);
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}

// DELETE /api/steps/[id] - Delete a step
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if step exists
    const existingStep = await db.step.findUnique({
      where: { id },
    });

    if (!existingStep) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    await db.step.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete step:", error);
    return NextResponse.json(
      { error: "Failed to delete step" },
      { status: 500 }
    );
  }
}
