/**
 * Process job: preview (1 image) or full (N images from blueprint)
 * Shared logic for background worker (no Inngest).
 */

import { db } from "@/lib/db";
import { JOB_STATUS } from "@/lib/constants";
import { getSignedReadUrl } from "@/lib/storage";
import {
  generateTextForBeatWithModeration,
  generateImageForBeat,
  updateJobProgress,
  markJobReady,
  markJobFailed,
  type Blueprint,
  type Beat,
} from "@/lib/ai/orchestrator";
import { IMAGE_GENERATION_RETRY_COUNT } from "@/lib/constants";
import { withRetry } from "@/lib/retry";

export async function processJob(jobId: string): Promise<{ success: boolean; imageCount: number }> {
  const job = await db.queryOne<{
    id: string;
    type: string;
    status: string;
    blueprint_snapshot: unknown;
    photo_asset_ids: unknown;
    child_id: string;
    user_id: string;
  }>("SELECT id, type, status, blueprint_snapshot, photo_asset_ids, child_id, user_id FROM jobs WHERE id = $1", [
    jobId,
  ]);

  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  if (job.status !== JOB_STATUS.QUEUED) {
    return { success: false, imageCount: 0 };
  }

  await db.query(
    `UPDATE jobs SET status = $1, updated_at = $2 WHERE id = $3`,
    [JOB_STATUS.GENERATING, new Date().toISOString(), jobId]
  );

  const blueprint = (job.blueprint_snapshot ?? {}) as Blueprint;
  const beats = blueprint.beats ?? [];
  const isPreview = job.type === "preview";

  if (beats.length === 0) {
    const defaultBeat: Beat = {
      beat_id: "preview_1",
      act: "setup",
      page_index: 1,
      narrative_summary: "Child as hero in a storybook scene",
      illustration_instructions: "Child in storybook style, full body, neutral scene",
    };
    blueprint.beats = [defaultBeat];
    blueprint.child_name = blueprint.child_name ?? "Hero";
    blueprint.reading_level = blueprint.reading_level ?? "4-6";
  }

  const beatsToProcess = isPreview ? blueprint.beats.slice(0, 1) : blueprint.beats;
  const totalBeats = beatsToProcess.length;

  const photoAssetIds = (job.photo_asset_ids ?? []) as string[];
  let photoUrls: string[] = [];
  if (photoAssetIds.length > 0) {
    const placeholders = photoAssetIds.map((_, i) => `$${i + 1}`).join(", ");
    const assets = await db.query<{ storage_path: string }>(
      `SELECT storage_path FROM assets WHERE id IN (${placeholders})`,
      photoAssetIds
    );
    photoUrls = await Promise.all(
      assets.map((a) => a.storage_path).filter(Boolean).map((p) => getSignedReadUrl(p))
    );
  }

  const generatedImages: string[] = [];
  const generatedBeats: Array<Beat & { generated_text?: string; generated_image_url: string }> = [];

  try {
    for (let i = 0; i < beatsToProcess.length; i++) {
      const beat = beatsToProcess[i];

      let generatedText = "";
      if (!isPreview) {
        generatedText = await generateTextForBeatWithModeration(beat, blueprint);
        if (!generatedText) {
          await markJobFailed(
            jobId,
            "We couldn't generate content that meets our safety standards. Please try again.",
            beat.beat_id
          );
          throw new Error(`Text moderation failed for beat ${beat.beat_id}`);
        }
      }

      const imageUrl = await withRetry(
        () =>
          generateImageForBeat(beat, photoUrls, jobId, {
            mode: isPreview ? "strict" : "balanced",
          }),
        { maxRetries: IMAGE_GENERATION_RETRY_COUNT }
      );
      generatedImages.push(imageUrl);
      generatedBeats.push({
        ...beat,
        generated_text: generatedText || undefined,
        generated_image_url: imageUrl,
      });

      await updateJobProgress(jobId, {
        stage: "images",
        completed_count: i + 1,
        total_count: totalBeats,
      });
    }

    if (isPreview) {
      await markJobReady(jobId, generatedImages[0]);
    } else {
      const child = await db.queryOne<{ name: string }>(
        "SELECT name FROM children WHERE id = $1",
        [job.child_id]
      );

      const storyRows = await db.query<{ id: string }>(
        `INSERT INTO stories (job_id, blueprint, title, beats, reading_level)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          jobId,
          JSON.stringify(blueprint),
          `${child?.name ?? "Hero"}'s Adventure`,
          JSON.stringify(generatedBeats),
          blueprint.reading_level ?? "4-6",
        ]
      );
      const story = storyRows[0];

      if (story) {
        await db.query(
          `INSERT INTO books (story_id, user_id, asset_ids, metadata)
           VALUES ($1, $2, '{}', $3)`,
          [story.id, job.user_id, JSON.stringify({ pages: totalBeats, image_urls: generatedImages })]
        );

        await db.query(
          `UPDATE jobs SET story_id = $1, status = $2, progress = $3, updated_at = $4 WHERE id = $5`,
          [
            story.id,
            JOB_STATUS.READY,
            JSON.stringify({ stage: "ready", completed_count: totalBeats, total_count: totalBeats }),
            new Date().toISOString(),
            jobId,
          ]
        );
      } else {
        await markJobFailed(jobId, "Failed to create story");
      }
    }

    return { success: true, imageCount: generatedImages.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markJobFailed(jobId, message);
    throw err;
  }
}
