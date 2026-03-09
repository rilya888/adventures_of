import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { JOB_STATUS } from "@/lib/constants";

function requireAdmin(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === secret;
}

/**
 * GET /api/admin/jobs-failed
 * List failed jobs for moderation review. Requires Authorization: Bearer $ADMIN_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10), 100);
    const jobs = await db.query<{
      id: string;
      type: string;
      status: string;
      error: string | null;
      failed_at_beat_id: string | null;
      created_at: string;
      user_id: string;
    }>(
      `SELECT id, type, status, error, failed_at_beat_id, created_at, user_id
       FROM jobs WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
      [JOB_STATUS.FAILED, limit]
    );

    return NextResponse.json({ jobs: jobs ?? [], count: jobs?.length ?? 0 });
  } catch (err) {
    console.error("GET /api/admin/jobs-failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
