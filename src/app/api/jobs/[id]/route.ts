import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";

/**
 * GET /api/jobs/[id]
 * Job status and progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user_id = await getUserId();
    if (!user_id) {
      return apiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const job = await db.queryOne<{
      id: string;
      type: string;
      status: string;
      progress: unknown;
      error: string | null;
      failed_at_beat_id: string | null;
      created_at: string;
      updated_at: string;
      story_id: string | null;
    }>(
      "SELECT id, type, status, progress, error, failed_at_beat_id, created_at, updated_at, story_id FROM jobs WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (err) {
    console.error("GET /api/jobs/[id]:", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
