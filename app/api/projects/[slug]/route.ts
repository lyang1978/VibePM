import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/[slug] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const project = await db.project.findUnique({
      where: { slug },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
            },
          },
        },
        tasks: {
          where: { phaseId: null },
          orderBy: { order: "asc" },
        },
        decisions: {
          orderBy: { createdAt: "desc" },
        },
        images: {
          orderBy: { createdAt: "desc" },
        },
        prompts: {
          orderBy: { createdAt: "desc" },
        },
        contextDoc: true,
        moodBoard: {
          include: {
            images: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            prompts: true,
            decisions: true,
            images: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[slug] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { name, problem, mvpDefinition, status } = body;

    const project = await db.project.findUnique({ where: { slug } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updatedProject = await db.project.update({
      where: { slug },
      data: {
        ...(name && { name: name.trim() }),
        ...(problem !== undefined && { problem: problem?.trim() || null }),
        ...(mvpDefinition !== undefined && {
          mvpDefinition: mvpDefinition?.trim() || null,
        }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[slug] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const project = await db.project.findUnique({ where: { slug } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.project.delete({ where: { slug } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
