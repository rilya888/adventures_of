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
 * GET /api/admin/stats
 * Basic moderation/ops stats. Requires Authorization: Bearer $ADMIN_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [failedJobs, queuedJobs, readyToday] = await Promise.all([
      db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM jobs WHERE status = $1`,
        [JOB_STATUS.FAILED]
      ),
      db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM jobs WHERE status IN ($1, $2)`,
        [JOB_STATUS.QUEUED, JOB_STATUS.GENERATING]
      ),
      db.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM jobs WHERE status = $1 AND created_at > now() - interval '1 day'`,
        [JOB_STATUS.READY]
      ),
    ]);

    return NextResponse.json({
      failed_jobs: parseInt(failedJobs?.count ?? "0", 10),
      queued_or_generating: parseInt(queuedJobs?.count ?? "0", 10),
      ready_today: parseInt(readyToday?.count ?? "0", 10),
    });
  } catch (err) {
    console.error("GET /api/admin/stats:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
