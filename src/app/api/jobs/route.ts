import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { JOB_STATUS } from "@/lib/constants";

/**
 * GET /api/jobs?status=active
 * List user's jobs. status=active returns queued or generating (for resume flow).
 */
export async function GET(request: NextRequest) {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = "SELECT id, type, status, progress, created_at FROM jobs WHERE user_id = $1";
    const params: string[] = [user_id];

    if (statusFilter === "active") {
      query += " AND status IN ($2, $3)";
      params.push(JOB_STATUS.QUEUED, JOB_STATUS.GENERATING);
    }

    query += " ORDER BY created_at DESC LIMIT 10";

    const jobs = await db.query<{
      id: string;
      type: string;
      status: string;
      progress: unknown;
      created_at: string;
    }>(query, params);

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("GET /api/jobs:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
