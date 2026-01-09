import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE /api/clear-data - Clear all data from the database
export async function DELETE() {
  try {
    // Delete in order to respect foreign key constraints
    await db.activity.deleteMany();
    await db.session.deleteMany();
    await db.codeSnippet.deleteMany();
    await db.prompt.deleteMany();
    await db.taskDependency.deleteMany();
    await db.task.deleteMany();
    await db.phase.deleteMany();
    await db.decision.deleteMany();
    await db.image.deleteMany();
    await db.moodBoard.deleteMany();
    await db.contextDocument.deleteMany();
    await db.quickCapture.deleteMany();
    await db.project.deleteMany();
    // Keep settings - don't delete those

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear data:", error);
    return NextResponse.json({ error: "Failed to clear data" }, { status: 500 });
  }
}
