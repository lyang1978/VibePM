import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/export - Export all data as JSON
export async function GET() {
  try {
    // Fetch all data
    const [
      projects,
      tasks,
      prompts,
      phases,
      decisions,
      quickCaptures,
      activities,
      settings,
    ] = await Promise.all([
      db.project.findMany({
        include: {
          tasks: true,
          prompts: true,
          phases: true,
          decisions: true,
        },
      }),
      db.task.findMany(),
      db.prompt.findMany(),
      db.phase.findMany(),
      db.decision.findMany(),
      db.quickCapture.findMany(),
      db.activity.findMany(),
      db.appSetting.findMany(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: {
        projects,
        tasks,
        prompts,
        phases,
        decisions,
        quickCaptures,
        activities,
        settings,
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Failed to export data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
