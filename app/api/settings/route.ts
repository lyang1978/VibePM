import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/settings - Fetch all settings
export async function GET() {
  try {
    const settings = await db.appSetting.findMany();

    // Convert array of key-value pairs to object
    const settingsObject: Record<string, unknown> = {};
    for (const setting of settings) {
      try {
        settingsObject[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsObject[setting.key] = setting.value;
      }
    }

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
    const updates = await request.json();

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      await db.appSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
