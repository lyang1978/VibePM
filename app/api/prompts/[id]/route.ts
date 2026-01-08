import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/prompts/[id] - Get a single prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prompt = await db.prompt.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Failed to fetch prompt:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompt" },
      { status: 500 }
    );
  }
}

// PATCH /api/prompts/[id] - Update a prompt
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, outcome, notes } = body;

    const prompt = await db.prompt.findUnique({ where: { id } });
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const updatedPrompt = await db.prompt.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(outcome !== undefined && { outcome }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error("Failed to update prompt:", error);
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id] - Delete a prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prompt = await db.prompt.findUnique({ where: { id } });
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    await db.prompt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}
