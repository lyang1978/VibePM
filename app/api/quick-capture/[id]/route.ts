import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, projectId } = body;

    // Build update data - only include fields that are provided
    const updateData: { content?: string; projectId?: string | null } = {};

    if (content !== undefined) {
      if (content.trim() === "") {
        return NextResponse.json(
          { error: "Content cannot be empty" },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }

    if (projectId !== undefined) {
      updateData.projectId = projectId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const capture = await db.quickCapture.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(capture);
  } catch (error) {
    console.error("Failed to update quick capture:", error);
    return NextResponse.json(
      { error: "Failed to update quick capture" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.quickCapture.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete quick capture:", error);
    return NextResponse.json(
      { error: "Failed to delete quick capture" },
      { status: 500 }
    );
  }
}
