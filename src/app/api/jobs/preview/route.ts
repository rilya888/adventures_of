import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { JOB_STATUS } from "@/lib/constants";
import { logInfo } from "@/lib/observability";
import { z } from "zod";

const PREVIEW_JOBS_PER_HOUR = 5;

const PreviewJobSchema = z.object({
  child_id: z.string().uuid(),
  photo_asset_ids: z.array(z.string().uuid()).min(2).max(3),
  blueprint_snapshot: z.record(z.string(), z.unknown()).optional(),
  idempotency_key: z.string().optional(),
});

/**
 * POST /api/jobs/preview
 * Create character preview job (1 illustration)
 */
export async function POST(request: NextRequest) {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return apiError("UNAUTHORIZED", "Unauthorized. Sign in or continue as guest.", 401);
    }

    const body = await request.json();
    const parsed = PreviewJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", code: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { child_id, photo_asset_ids, blueprint_snapshot, idempotency_key } =
      parsed.data;

    if (idempotency_key) {
      const existing = await db.queryOne<{ id: string; status: string; created_at: string }>(
        "SELECT id, status, created_at FROM jobs WHERE idempotency_key = $1 AND user_id = $2",
        [idempotency_key, user_id]
      );
      if (existing) {
        return NextResponse.json({
          job_id: existing.id,
          status: existing.status,
          created_at: existing.created_at,
          idempotent: true,
        });
      }
    }

    const recentCount = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM jobs
       WHERE user_id = $1 AND type = 'preview' AND created_at > now() - interval '1 hour'`,
      [user_id]
    );
    if (parseInt(recentCount?.count ?? "0", 10) >= PREVIEW_JOBS_PER_HOUR) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        "Too many preview requests. Please try again in an hour.",
        429
      );
    }

    const child = await db.queryOne<{ id: string }>(
      "SELECT id FROM children WHERE id = $1 AND user_id = $2",
      [child_id, user_id]
    );
    if (!child) {
      return apiError("CHILD_NOT_FOUND", "Child not found", 404);
    }

    const jobRows = await db.query<{ id: string; status: string; created_at: string }>(
      `INSERT INTO jobs (user_id, child_id, type, status, blueprint_snapshot, photo_asset_ids, idempotency_key, progress)
       VALUES ($1, $2, 'preview', $3, $4, $5, $6, $7) RETURNING id, status, created_at`,
      [
        user_id,
        child_id,
        JOB_STATUS.QUEUED,
        JSON.stringify(blueprint_snapshot ?? {}),
        photo_asset_ids,
        idempotency_key ?? null,
        JSON.stringify({ stage: "queued", completed_count: 0, total_count: 1 }),
      ]
    );
    const job = jobRows[0];

    if (!job) {
      return apiError("JOB_CREATE_FAILED", "Failed to create job", 500);
    }

    logInfo("Preview job created", {
      job_id: job.id,
      child_id,
      request_id: request.headers.get("x-request-id"),
    });

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      created_at: job.created_at,
    });
  } catch (err) {
    console.error("POST /api/jobs/preview:", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
