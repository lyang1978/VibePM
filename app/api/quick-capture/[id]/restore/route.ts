import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/quick-capture/[id]/restore - Restore a soft-deleted capture
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const capture = await db.quickCapture.findUnique({ where: { id } });
    if (!capture) {
      return NextResponse.json({ error: "Capture not found" }, { status: 404 });
    }

    if (!capture.deletedAt) {
      return NextResponse.json(
        { error: "Capture is not deleted" },
        { status: 400 }
      );
    }

    const restoredCapture = await db.quickCapture.update({
      where: { id },
      data: { deletedAt: null },
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

    return NextResponse.json(restoredCapture);
  } catch (error) {
    console.error("Error restoring capture:", error);
    return NextResponse.json(
      { error: "Failed to restore capture" },
      { status: 500 }
    );
  }
}
