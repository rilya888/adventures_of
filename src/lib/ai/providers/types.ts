/**
 * Image provider types. Kept minimal to avoid circular deps with orchestrator.
 */

export type ImageProviderId = "replicate" | "openai";

/** Minimal beat shape required for image generation (avoids importing full Beat from orchestrator). */
export interface ImageGenerationBeat {
  beat_id: string;
  illustration_instructions: string;
}

/** Generation mode: strict = max likeness (preview), balanced = storybook, artistic = more creative. */
export type ImageGenerationMode = "strict" | "balanced" | "artistic";

export interface ImageGenerationInput {
  beat: ImageGenerationBeat;
  photoUrls: string[];
  jobId: string;
  styleHints?: string[];
  /** strict for character preview, balanced for full book pages. */
  mode?: ImageGenerationMode;
}

export interface ImageGenerationResult {
  url: string;
  metadata?: Record<string, unknown>;
}

/** Provider returns raw buffer; image-generator handles upload and proxy URL. */
export interface ImageProvider {
  id: ImageProviderId;
  generate(input: ImageGenerationInput): Promise<{ buffer: Buffer; contentType: string }>;
}
