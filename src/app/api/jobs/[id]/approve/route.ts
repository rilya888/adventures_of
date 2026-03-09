import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { JOB_STATUS } from "@/lib/constants";
import { passesPreviewQualityGate } from "@/lib/quality-gate";
import { createFullBlueprintFromTemplate } from "@/lib/create-flow/blueprint-server";

/**
 * POST /api/jobs/[id]/approve
 * Approve character preview, create full book job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: preview_id } = await params;
    const user_id = await getUserId();
    if (!user_id) {
      return apiError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const previewJob = await db.queryOne<{
      id: string;
      child_id: string;
      photo_asset_ids: unknown;
      status: string;
      progress: unknown;
    }>(
      "SELECT id, child_id, photo_asset_ids, status, progress FROM jobs WHERE id = $1 AND user_id = $2 AND type = 'preview'",
      [preview_id, user_id]
    );

    if (!previewJob) {
      return apiError("PREVIEW_JOB_NOT_FOUND", "Preview job not found", 404);
    }

    if (previewJob.status !== JOB_STATUS.READY) {
      return apiError("PREVIEW_NOT_READY", "Preview must be ready before approval", 400);
    }

    const progress = previewJob.progress as { preview_image_url?: string } | null;
    const previewUrl = progress?.preview_image_url;
    if (!passesPreviewQualityGate(previewUrl)) {
      return apiError(
        "PREVIEW_QUALITY_FAILED",
        "Preview did not pass quality check. Please regenerate.",
        400
      );
    }

    const child = await db.queryOne<{
      name: string;
      age_band: string;
      interests: string[];
      favorites: string[];
      fears_to_avoid: string[];
    }>(
      "SELECT name, age_band, interests, favorites, fears_to_avoid FROM children WHERE id = $1",
      [previewJob.child_id]
    );

    if (!child) {
      return apiError("CHILD_NOT_FOUND", "Child not found", 404);
    }

    const childData = {
      name: child.name,
      age_band: child.age_band as "4-6" | "7-9",
      interests: child.interests ?? [],
      favorites: child.favorites ?? [],
      fears_to_avoid: child.fears_to_avoid ?? [],
    };

    const fullBlueprint = await createFullBlueprintFromTemplate(childData);

    const body = await request.json().catch(() => ({}));
    const idempotency_key = body?.idempotency_key as string | undefined;

    const fullJobRows = await db.query<{ id: string; status: string; created_at: string }>(
      `INSERT INTO jobs (user_id, child_id, type, status, blueprint_snapshot, photo_asset_ids, preview_job_id, idempotency_key, progress)
       VALUES ($1, $2, 'full', 'queued', $3, $4, $5, $6, $7) RETURNING id, status, created_at`,
      [
        user_id,
        previewJob.child_id,
        JSON.stringify(fullBlueprint),
        previewJob.photo_asset_ids,
        preview_id,
        idempotency_key ?? null,
        JSON.stringify({ stage: "queued", completed_count: 0, total_count: fullBlueprint.beats.length }),
      ]
    );
    const fullJob = fullJobRows[0];

    if (!fullJob) {
      return apiError("JOB_CREATE_FAILED", "Failed to create full job", 500);
    }

    // Worker polls jobs table; no external queue needed
    return NextResponse.json({
      job_id: fullJob.id,
      status: fullJob.status,
      created_at: fullJob.created_at,
    });
  } catch (err) {
    console.error("POST /api/jobs/[id]/approve:", err);
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
