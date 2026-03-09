/**
 * App constants. Support email from env for production.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@adventuresof.com";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Refund window (27): within N days of purchase */
export const REFUND_WINDOW_DAYS = 7;

/** Job status values. Must match DB enum job_status. */
export const JOB_STATUS = {
  QUEUED: "queued",
  GENERATING: "generating",
  ASSEMBLING: "assembling",
  READY: "ready",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/** Order status. Must match DB enum order_status. */
export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** Payment status. Must match DB enum payment_status. */
export const PAYMENT_STATUS = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/** Placeholder fallback: when true, return placeholder on provider error (dev/demo). When false, throw (production). */
export const PLACEHOLDER_FALLBACK_ENABLED =
  process.env.DISABLE_PLACEHOLDER_FALLBACK !== "true";

/** Full book page count (2 beats = 2 texts + 2 images). For future: process.env.FULL_BOOK_PAGE_COUNT ?? 2 */
export const FULL_BOOK_PAGE_COUNT = 2;

/** Default caption position for comic layout. Used by BookStep, download route, process-job. */
export const DEFAULT_CAPTION_POSITION = "right" as const;

/** Max retries for transient image generation failures (network, timeout, 5xx). */
export const IMAGE_GENERATION_RETRY_COUNT = parseInt(
  process.env.IMAGE_GENERATION_RETRY_COUNT ?? "2",
  10
);
