/**
 * AI Orchestration (Block 12)
 * Preview: 1 beat, 1 image
 * Full: N beats (from blueprint, configurable via FULL_BOOK_PAGE_COUNT)
 * Image generation: placeholder until 23 spike (testing stage)
 */

import OpenAI from "openai";
import { db } from "@/lib/db";
import { JOB_STATUS } from "@/lib/constants";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey: key });
}

export interface Beat {
  beat_id: string;
  act: string;
  page_index: number;
  narrative_summary: string;
  illustration_instructions: string;
  safety_tags?: string[];
}

export interface Blueprint {
  child_name: string;
  child_gender?: string;
  pronouns?: string;
  reading_level?: string;
  fears_to_avoid?: string[];
  beats: Beat[];
}

const MAX_TEXT_RETRIES = 2;
const MIN_TEXT_LENGTH = 10;

/** Block 04: Text moderation via OpenAI Moderation API. S0/S1 = fail. */
export async function moderateText(text: string): Promise<{ pass: boolean; categories?: string[] }> {
  if (!text || text.length < 3) return { pass: true };
  try {
    const openai = getOpenAI();
    const mod = await openai.moderations.create({
      input: text,
      model: "text-moderation-latest",
    });
    const result = mod.results[0];
    if (!result?.flagged) return { pass: true };
    const categories = Object.entries(result.categories ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k);
    return { pass: false, categories };
  } catch {
    return { pass: true }; // fail open on moderation API error (MVP)
  }
}

export async function generateTextForBeat(
  beat: Beat,
  blueprint: Blueprint,
  isModerationRetry = false
): Promise<string> {
  const readingLevel =
    blueprint.reading_level === "4-6"
      ? "2-3 sentences per page, simple words"
      : "4-5 sentences per page, compound sentences";

  const fearsBlock =
    blueprint.fears_to_avoid && blueprint.fears_to_avoid.length > 0
      ? ` NEVER include or mention: ${blueprint.fears_to_avoid.join(", ")}. These are the child's fears to avoid.`
      : "";

  const openai = getOpenAI();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_TEXT_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a children's story writer. Create warm, age-appropriate content. 
No violence, no fear triggers.${fearsBlock} Output format: ${readingLevel}.
Use child's name: ${blueprint.child_name}.${isModerationRetry ? " The previous draft was flagged. Generate a completely different, safe, age-appropriate version with no problematic content." : ""}`,
          },
          {
            role: "user",
            content: `Expand this into a full page for a children's story: "${beat.narrative_summary}"`,
          },
        ],
        max_tokens: 200,
      });

      const text = response.choices[0]?.message?.content?.trim() ?? "";
      if (text.length >= MIN_TEXT_LENGTH) return text;
      lastError = new Error("Generated text too short");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < MAX_TEXT_RETRIES) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return "";
}

/** Block 04: Generate text with moderation. Max 1 retry on S0/S1. */
export async function generateTextForBeatWithModeration(
  beat: Beat,
  blueprint: Blueprint
): Promise<string> {
  let text = await generateTextForBeat(beat, blueprint);
  const mod = await moderateText(text);
  if (mod.pass) return text;
  text = await generateTextForBeat(beat, blueprint, true);
  const modRetry = await moderateText(text);
  if (modRetry.pass) return text;
  return ""; // fail job
}

import { generateIllustration } from "./image-generator";

/**
 * Generate image for beat. Uses image-generator abstraction (06).
 * mode: strict for preview (max likeness), balanced for full book.
 */
export async function generateImageForBeat(
  beat: Beat,
  photoUrls: string[],
  jobId: string,
  options?: { mode?: "strict" | "balanced" | "artistic" }
): Promise<string> {
  const result = await generateIllustration({
    beat,
    photoUrls,
    jobId,
    mode: options?.mode,
  });
  return result.url;
}

export async function updateJobProgress(
  jobId: string,
  progress: { stage: string; completed_count: number; total_count: number }
) {
  await db.query(
    `UPDATE jobs SET progress = $1, updated_at = $2 WHERE id = $3`,
    [JSON.stringify(progress), new Date().toISOString(), jobId]
  );
}

export async function markJobReady(jobId: string, outputUrl?: string) {
  await db.query(
    `UPDATE jobs SET status = $1, progress = $2, updated_at = $3 WHERE id = $4`,
    [
      JOB_STATUS.READY,
      JSON.stringify({
        stage: "ready",
        completed_count: 1,
        total_count: 1,
        preview_image_url: outputUrl,
      }),
      new Date().toISOString(),
      jobId,
    ]
  );
}

export async function markJobFailed(
  jobId: string,
  error: string,
  failedAtBeatId?: string
) {
  await db.query(
    `UPDATE jobs SET status = $1, error = $2, failed_at_beat_id = $3, updated_at = $4 WHERE id = $5`,
    [JOB_STATUS.FAILED, error, failedAtBeatId ?? null, new Date().toISOString(), jobId]
  );
}
