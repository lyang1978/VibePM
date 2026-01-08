import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/projects - List all projects (excludes deleted by default)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const deleted = url.searchParams.get("deleted") === "true";

    const projects = await db.project.findMany({
      where: deleted
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
      orderBy: deleted ? { deletedAt: "desc" } : { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            tasks: true,
            prompts: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, problem, mvpDefinition } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Generate a unique slug
    let slug = generateSlug(name);
    let slugExists = await db.project.findUnique({ where: { slug } });
    let suffix = 1;

    while (slugExists) {
      slug = `${generateSlug(name)}-${suffix}`;
      slugExists = await db.project.findUnique({ where: { slug } });
      suffix++;
    }

    const project = await db.project.create({
      data: {
        name: name.trim(),
        slug,
        problem: problem?.trim() || null,
        mvpDefinition: mvpDefinition?.trim() || null,
        status: "PLANNING",
      },
    });

    // Create an initial context document
    await db.contextDocument.create({
      data: {
        projectId: project.id,
        content: generateInitialContext(project),
        lastGenerated: new Date(),
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

function generateInitialContext(project: {
  name: string;
  problem: string | null;
  mvpDefinition: string | null;
}): string {
  return `# ${project.name}

## Problem Statement
${project.problem || "_Not defined yet_"}

## MVP Definition
${project.mvpDefinition || "_Not defined yet_"}

## Current Status
- Project created
- No tasks defined yet

## Key Decisions
_No decisions logged yet_

---
*This context document is auto-generated and can be copied to provide Claude with project context.*
`;
}
