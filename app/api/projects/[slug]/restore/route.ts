import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/projects/[slug]/restore - Restore a soft-deleted project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const project = await db.project.findUnique({ where: { slug } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.deletedAt) {
      return NextResponse.json(
        { error: "Project is not deleted" },
        { status: 400 }
      );
    }

    const restoredProject = await db.project.update({
      where: { slug },
      data: { deletedAt: null },
    });

    return NextResponse.json(restoredProject);
  } catch (error) {
    console.error("Error restoring project:", error);
    return NextResponse.json(
      { error: "Failed to restore project" },
      { status: 500 }
    );
  }
}
