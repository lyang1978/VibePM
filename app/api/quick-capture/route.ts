import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const captures = await db.quickCapture.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(captures);
  } catch (error) {
    console.error("Failed to fetch quick captures:", error);
    return NextResponse.json(
      { error: "Failed to fetch quick captures" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, projectId } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const capture = await db.quickCapture.create({
      data: {
        content: content.trim(),
        projectId: projectId || null,
      },
    });

    return NextResponse.json(capture, { status: 201 });
  } catch (error) {
    console.error("Failed to create quick capture:", error);
    return NextResponse.json(
      { error: "Failed to create quick capture" },
      { status: 500 }
    );
  }
}
