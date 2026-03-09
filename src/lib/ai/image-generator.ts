/**
 * Image generation abstraction (Block 06).
 * Provider selection via IMAGE_PROVIDER env. Supports replicate and openai (both face-preserving with photo).
 * See docs/OPENAI_IMAGE_PROVIDER_PLAN.md for architecture.
 */

import type { Beat } from "./orchestrator";
import { uploadFile } from "@/lib/storage";
import { PLACEHOLDER_FALLBACK_ENABLED } from "@/lib/constants";
import { computeQualityScore } from "@/lib/quality-gate";
import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
} from "./providers/types";
import { replicateProvider } from "./providers/replicate";
import { openaiProvider } from "./providers/openai";

export type { ImageGenerationInput, ImageGenerationResult };

/** Input shape for consumers; Beat from orchestrator satisfies ImageGenerationBeat. */
export interface ImageGenerationInputPublic {
  beat: Beat;
  photoUrls: string[];
  jobId: string;
  styleHints?: string[];
  /** strict for preview, balanced for full book. */
  mode?: "strict" | "balanced" | "artistic";
}

function getImageProvider(): ImageProvider | null {
  const env = process.env.IMAGE_PROVIDER?.toLowerCase();

  if (env === "replicate") {
    if (process.env.REPLICATE_API_TOKEN) return replicateProvider;
    return null;
  }

  if (env === "openai") {
    if (process.env.OPENAI_API_KEY) return openaiProvider;
    return null;
  }

  // Default: replicate if token present, else openai if key present
  if (process.env.REPLICATE_API_TOKEN) return replicateProvider;
  if (process.env.OPENAI_API_KEY) return openaiProvider;
  return null;
}

async function uploadAndGetProxyUrl(
  buffer: Buffer,
  contentType: string,
  jobId: string,
  beatId: string
): Promise<string> {
  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
  const key = `generated/${jobId}/${beatId}.${ext}`;
  await uploadFile(key, buffer, contentType);
  return `/api/assets/signed?key=${encodeURIComponent(key)}`;
}

function getPlaceholder(input: ImageGenerationInput): ImageGenerationResult {
  return {
    url: "https://placehold.co/1024x1024/f5f5dc/8b4513?text=Illustration+Placeholder",
    metadata: { placeholder: true, beat_id: input.beat.beat_id },
  };
}

/**
 * Generate illustration for a story beat.
 * Uses provider from IMAGE_PROVIDER; falls back to placeholder on error or missing config.
 */
export async function generateIllustration(
  input: ImageGenerationInputPublic
): Promise<ImageGenerationResult> {
  const { jobId, beat } = input;
  const provider = getImageProvider();

  if (!provider) {
    console.log(
      `[image-generator] jobId=${jobId} beatId=${beat.beat_id} provider=none (no token) -> placeholder`
    );
    return getPlaceholder(input);
  }

  console.log(
    `[image-generator] jobId=${jobId} beatId=${beat.beat_id} provider=${provider.id} generating...`
  );

  try {
    const { buffer, contentType } = await provider.generate(input);
    const url = await uploadAndGetProxyUrl(
      buffer,
      contentType,
      jobId,
      beat.beat_id
    );
    console.log(
      `[image-generator] jobId=${jobId} beatId=${beat.beat_id} provider=${provider.id} done`
    );
    const metadata = {
      source: provider.id,
      model: provider.id === "replicate" ? "flux-pulid" : "gpt-image-1.5",
      quality_score: computeQualityScore(url, { placeholder: false }),
    };
    return { url, metadata };
  } catch (err) {
    console.error(`[image-generator] jobId=${jobId} beatId=${beat.beat_id} provider=${provider.id} failed:`, err);
    if (!PLACEHOLDER_FALLBACK_ENABLED) {
      throw err;
    }
    console.log(`[image-generator] jobId=${jobId} beatId=${beat.beat_id} -> placeholder (fallback)`);
    return getPlaceholder(input);
  }
}
