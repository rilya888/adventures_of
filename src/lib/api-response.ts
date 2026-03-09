/**
 * Unified API error envelope. Keeps `error` as message for backward compat.
 * Use `code` for programmatic handling and i18n.
 */
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "RATE_LIMIT_EXCEEDED"
  | "REGENERATION_LIMIT_EXCEEDED"
  | "CHILD_NOT_FOUND"
  | "JOB_NOT_FOUND"
  | "PREVIEW_JOB_NOT_FOUND"
  | "PREVIEW_NOT_READY"
  | "PREVIEW_QUALITY_FAILED"
  | "BOOK_NOT_FOUND"
  | "STORY_NOT_FOUND"
  | "ORDER_NOT_FOUND"
  | "ASSET_UPLOAD_FAILED"
  | "JOB_CREATE_FAILED"
  | "INTERNAL_ERROR";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}
