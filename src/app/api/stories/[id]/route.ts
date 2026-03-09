import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/stories/[id]
 * Story with beats (for book preview)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const story = await db.queryOne<{
      id: string;
      title: string;
      beats: unknown;
      reading_level: string | null;
    }>(
      "SELECT id, title, beats, reading_level FROM stories WHERE id = $1",
      [id]
    );

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const job = await db.queryOne<{ user_id: string }>(
      "SELECT j.user_id FROM jobs j JOIN stories s ON s.job_id = j.id WHERE s.id = $1",
      [id]
    );

    if (!job || job.user_id !== user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(story);
  } catch (err) {
    console.error("GET /api/stories/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
