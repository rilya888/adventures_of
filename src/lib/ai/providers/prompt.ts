/**
 * Shared prompt builder for all image providers.
 * Tuned for children's books where the uploaded child photo must remain recognizable.
 */

import type { ImageGenerationInput } from "./types";
import type { ImageProviderId, ImageGenerationMode } from "./types";

/** Core identity-preserving instructions shared across providers. */
const IDENTITY_GUARDRAILS = [
  "preserve the child's identity and clear likeness",
  "keep the original facial proportions",
  "keep the original forehead size and natural hairline",
  "preserve the original face shape, eye spacing, nose shape, mouth shape, and smile",
  "keep the child clearly recognizable to the parents",
  "stylize texture, lighting, and rendering only",
  "do not reshape, beautify, or reconstruct the face",
  "natural child anatomy",
  "age-appropriate expression and proportions",
];

/** Extra tokens for strict mode (character preview). Maximizes likeness preservation. */
const STRICT_MODE_SUFFIX = [
  "character reference sheet",
  "identity-preserving",
  "minimal artistic interpretation",
  "child must be instantly recognizable",
].join(", ");

/** Style tokens for Replicate/SDXL. Comma-separated for better model adherence. */
function getReplicateStyleSuffix(mode?: ImageGenerationMode): string {
  const base = [
    "children's storybook illustration",
    "watercolor and gouache style",
    "whimsical storybook art",
    "soft painterly digital illustration",
    "Pixar-style 3D illustration",
    "warm muted earth tones",
    "soft diffused natural lighting",
    "cozy warm ambiance",
    "highly detailed",
    "sharp focus on child",
    "soft background depth of field",
    "professional quality",
    ...IDENTITY_GUARDRAILS,
  ];
  if (mode === "strict") {
    return [...base, STRICT_MODE_SUFFIX].join(", ");
  }
  return base.join(", ");
}

/** Negative prompt for Replicate. Strong anti-photorealistic for storybook style. */
export const REPLICATE_NEGATIVE_PROMPT = [
  "ugly",
  "deformed",
  "blurry",
  "low quality",
  "oversaturated",
  "harsh lighting",
  "photorealistic",
  "photograph",
  "photo",
  "realistic",
  "hyperrealistic",
  "cinematic",
  "dark",
  "scary",
  "violent",
  "large forehead",
  "big forehead",
  "oversized forehead",
  "high forehead",
  "receding hairline",
  "altered face shape",
  "different identity",
  "unrecognizable face",
  "altered hair",
  "altered facial hair",
  "added hair",
  "removed facial hair",
  "doll face",
  "baby face",
  "exaggerated facial proportions",
  "reshaped eyes",
  "reshaped nose",
  "reshaped mouth",
  "face reconstruction",
  "beautified face",
  "adult-looking child",
  "asymmetrical facial distortion",
].join(", ");

function cleanText(value?: string | null): string {
  return value?.trim() ?? "";
}

function normalizeTokens(values?: Array<string | null | undefined>): string[] {
  if (!values?.length) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const cleaned = cleanText(raw);
    if (!cleaned) continue;

    const normalizedKey = cleaned.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalizedKey)) continue;

    seen.add(normalizedKey);
    result.push(cleaned);
  }

  return result;
}

function getSceneDescription(input: ImageGenerationInput): string {
  return (
    cleanText(input.beat.illustration_instructions) ||
    "child as the main character in a children's storybook scene"
  );
}

function getStyleHints(input: ImageGenerationInput): string[] {
  return normalizeTokens(input.styleHints);
}

/**
 * Builds prompt for Replicate InstantID.
 * SDXL-style models usually respond better to comma-separated instructions.
 * strict mode = preview, strongest identity preservation.
 */
export function buildReplicatePrompt(input: ImageGenerationInput): string {
  const scene = getSceneDescription(input);
  const styleHints = getStyleHints(input);
  const styleSuffix = getReplicateStyleSuffix(input.mode);

  const parts = [scene, styleSuffix, ...styleHints];
  return parts.join(", ");
}

/**
 * Builds prompt for Replicate PhotoMaker.
 * Must include trigger word "img" after class word (e.g. "child img").
 */
export function buildPhotoMakerPrompt(
  input: ImageGenerationInput,
  options?: { variant?: "v1" | "v2" }
): string {
  const scene = getSceneDescription(input);
  const styleHints = getStyleHints(input);
  const styleSuffix = getReplicateStyleSuffix(input.mode);

  const version = options?.variant ?? (process.env.REPLICATE_PROMPT_VERSION ?? "v2").toLowerCase();
  const isV1 = version === "v1";

  const trigger = "a child img";
  const likenessLead = "preserve exact face likeness from reference photo, same recognizable child";
  const stylePart = isV1
    ? "children's storybook illustration, warm and age-appropriate"
    : styleSuffix;

  const parts = [`${trigger}, ${likenessLead}, ${scene}`, stylePart, ...styleHints];
  return parts.join(", ");
}

/**
 * Builds prompt for Replicate FlashFace.
 * CRITICAL: Describe only SCENE and STYLE, NOT the person (no hair, beard, age).
 * FlashFace preserves face from reference; conflicting text (e.g. "child with hair") overrides it.
 */
export function buildFlashFacePrompt(
  input: ImageGenerationInput,
  options?: { variant?: "v1" | "v2" }
): string {
  const scene = getSceneDescription(input);
  const styleHints = getStyleHints(input);

  const styleTokens = [
    "children's storybook illustration",
    "watercolor and gouache style",
    "whimsical storybook art",
    "soft painterly digital illustration",
    "warm muted earth tones",
    "soft diffused natural lighting",
    "cozy warm ambiance",
    "highly detailed",
    "sharp focus on main character",
    "soft background depth of field",
  ];

  const version = options?.variant ?? (process.env.REPLICATE_PROMPT_VERSION ?? "v2").toLowerCase();
  const isV1 = version === "v1";

  // "The main character" = neutral, no age/hair/beard implied
  const lead = isV1
    ? "The main character in a children's storybook scene"
    : "The main character";

  const parts = [`${lead}, ${scene}`, ...styleTokens, ...styleHints];
  return parts.join(", ");
}

/**
 * Builds prompt for Ideogram Character.
 * Auto-detects face/hair from reference; describe only scene and style.
 */
export function buildIdeogramPrompt(input: ImageGenerationInput): string {
  const scene = getSceneDescription(input);
  const styleHints = getStyleHints(input);

  const styleTokens = [
    "children's storybook illustration",
    "watercolor and gouache style",
    "whimsical storybook art",
    "soft painterly digital illustration",
    "warm muted earth tones",
    "soft diffused natural lighting",
    "cozy warm ambiance",
    "highly detailed",
    "sharp focus on main character",
  ];

  const parts = [scene, ...styleTokens, ...styleHints];
  return parts.join(", ");
}

/**
 * A/B: deterministic variant per job. When REPLICATE_PROMPT_AB_RATIO=0.5, 50% get v1.
 * Returns "v1" | "v2" or null for override.
 */
export function getPromptVariantForJob(jobId: string): "v1" | "v2" | null {
  const ratio = parseFloat(process.env.REPLICATE_PROMPT_AB_RATIO ?? "");
  if (Number.isNaN(ratio) || ratio <= 0 || ratio >= 1) return null;
  let hash = 0;
  for (let i = 0; i < jobId.length; i++) hash = (hash + jobId.charCodeAt(i)) % 1000;
  return hash / 1000 < ratio ? "v1" : "v2";
}

/**
 * Single entry point for provider-specific prompts. Routes by providerId.
 * v1 = conservative (buildPrompt), v2 = enhanced identity-preserving replicate prompt.
 * A/B: pass variant from getPromptVariantForJob when REPLICATE_PROMPT_AB_RATIO is set.
 */
export function buildPromptForProvider(
  input: ImageGenerationInput,
  providerId: ImageProviderId,
  options?: { variant?: "v1" | "v2" }
): string {
  const explicit = process.env.REPLICATE_PROMPT_VERSION?.toLowerCase();
  const variant = options?.variant ?? (explicit === "v1" || explicit === "v2" ? explicit : null);
  const version = variant ?? (process.env.REPLICATE_PROMPT_VERSION ?? "v2").toLowerCase();

  if (providerId === "replicate") {
    return version === "v1" ? buildPrompt(input) : buildReplicatePrompt(input);
  }

  if (providerId === "openai") {
    return buildPrompt(input);
  }

  return buildPrompt(input);
}

/**
 * General prompt for providers that prefer sentence-style instructions.
 */
export function buildPrompt(input: ImageGenerationInput): string {
  const scene = getSceneDescription(input);
  const styleHints = getStyleHints(input);

  const parts = [
    scene,
    "Create a warm, age-appropriate children's storybook illustration.",
    "The uploaded child must remain clearly recognizable.",
    "Preserve the original facial proportions, forehead size, hairline, face shape, eye spacing, nose, mouth, and smile.",
    "Apply stylization only to rendering, brushwork, color palette, texture, and lighting.",
    "Do not beautify, reconstruct, or reshape the face.",
    styleHints.length ? `Additional style hints: ${styleHints.join(", ")}.` : "",
  ].filter(Boolean);

  return parts.join(" ");
}

/**
 * Prompt for images.edit or photo-to-illustration workflows.
 * This version is intentionally strict about likeness preservation.
 */
export function buildEditPrompt(input: ImageGenerationInput): string {
  const scene = getSceneDescription(input);
  const styleHints = getStyleHints(input);

  const styleSection = styleHints.length
    ? ` Additional style hints: ${styleHints.join(", ")}.`
    : "";

  return [
    "Transform the uploaded child photo into a children's storybook illustration.",
    `Scene to depict: ${scene}.`,
    "Preserve the child's exact identity and likeness.",
    "Keep the original forehead size, natural hairline, face shape, eye spacing, nose shape, mouth shape, and smile close to the source photo.",
    "The child must still look like the same real child from the uploaded photo.",
    "Stylize only the medium and atmosphere: painterly rendering, storybook texture, soft lighting, and illustration finish.",
    "Do not enlarge the forehead.",
    "Do not make the face rounder, younger, more doll-like, or more generic.",
    "Do not reconstruct or beautify the facial structure.",
    styleSection,
  ]
    .filter(Boolean)
    .join(" ");
}
