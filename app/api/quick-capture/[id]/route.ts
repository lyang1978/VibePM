import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const capture = await db.quickCapture.update({
      where: { id },
      data: { content: content.trim() },
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
