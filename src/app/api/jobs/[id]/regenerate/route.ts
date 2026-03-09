import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { JOB_STATUS } from "@/lib/constants";

const REGEN_LIMIT = 3;

/**
 * POST /api/jobs/[id]/regenerate
 * Regenerate character preview
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parent_id } = await params;
    const user_id = await getUserId();
    if (!user_id) {
      return apiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parentJob = await db.queryOne<{
      id: string;
      child_id: string;
      photo_asset_ids: unknown;
      blueprint_snapshot: unknown;
    }>(
      "SELECT id, child_id, photo_asset_ids, blueprint_snapshot FROM jobs WHERE id = $1 AND user_id = $2 AND type = 'preview'",
      [parent_id, user_id]
    );

    if (!parentJob) {
      return apiError("JOB_NOT_FOUND", "Job not found", 404);
    }

    let chainLength = 0;
    let cursor: string | null = parent_id;
    while (cursor) {
      chainLength++;
      const row: { parent_job_id: string | null } | null = await db.queryOne(
        "SELECT parent_job_id FROM jobs WHERE id = $1",
        [cursor]
      );
      cursor = row?.parent_job_id ?? null;
    }

    if (chainLength >= REGEN_LIMIT + 1) {
      return apiError(
        "REGENERATION_LIMIT_EXCEEDED",
        "You've used your free regenerations. You can still approve this one or start over.",
        429
      );
    }

    const newJobRows = await db.query<{ id: string; status: string; created_at: string }>(
      `INSERT INTO jobs (user_id, child_id, type, status, blueprint_snapshot, photo_asset_ids, parent_job_id, progress)
       VALUES ($1, $2, 'preview', $3, $4, $5, $6, $7) RETURNING id, status, created_at`,
      [
        user_id,
        parentJob.child_id,
        JOB_STATUS.QUEUED,
        JSON.stringify(parentJob.blueprint_snapshot),
        parentJob.photo_asset_ids,
        parent_id,
        JSON.stringify({ stage: "queued", completed_count: 0, total_count: 1 }),
      ]
    );
    const newJob = newJobRows[0];

    if (!newJob) {
      return apiError("JOB_CREATE_FAILED", "Failed to regenerate", 500);
    }

    // Worker polls jobs table; no external queue needed
    return NextResponse.json({
      job_id: newJob.id,
      status: newJob.status,
      created_at: newJob.created_at,
    });
  } catch (err) {
    console.error("POST /api/jobs/[id]/regenerate:", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
