/**
 * Preview quality gate. Rejects placeholder or invalid preview before full book approval.
 * Per audit: "даже простая эвристика лучше, чем отсутствие контроля".
 */

const PLACEHOLDER_URL_PATTERN = /placehold\.co/i;

export function isPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return PLACEHOLDER_URL_PATTERN.test(url);
}

/** Returns true if preview passes quality gate. */
export function passesPreviewQualityGate(previewImageUrl: string | null | undefined): boolean {
  if (!previewImageUrl || typeof previewImageUrl !== "string") return false;
  if (isPlaceholderUrl(previewImageUrl)) return false;
  return true;
}

/**
 * Quality score 0–1. Placeholder for future ML scoring.
 * 0 = placeholder/fail, 1 = real image (stub), null = unknown.
 */
export function computeQualityScore(
  url: string | null | undefined,
  metadata?: { placeholder?: boolean }
): number | null {
  if (!url || typeof url !== "string") return null;
  if (metadata?.placeholder || isPlaceholderUrl(url)) return 0;
  return 1; // Stub: real images get 1 until ML scoring is added
}
