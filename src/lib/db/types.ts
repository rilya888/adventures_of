/**
 * Database types (Block 11 entity schemas)
 */

export type JobType = "preview" | "full";
export type JobStatus =
  | "queued"
  | "generating"
  | "assembling"
  | "ready"
  | "failed"
  | "cancelled";
export type OrderStatus = "pending" | "paid" | "refunded" | "failed";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface User {
  id: string;
  email: string | null;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Child {
  id: string;
  user_id: string;
  name: string;
  age_band: "4-6" | "7-9";
  interests: string[];
  favorites: string[];
  fears_to_avoid: string[];
  reading_preference: string | null;
  gender: string | null;
  pronouns: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Job {
  id: string;
  user_id: string;
  child_id: string;
  type: JobType;
  status: JobStatus;
  blueprint_snapshot: Record<string, unknown> | null;
  photo_asset_ids: string[];
  preview_job_id: string | null;
  parent_job_id: string | null;
  idempotency_key: string | null;
  progress: Record<string, unknown>;
  error: string | null;
  failed_at_beat_id: string | null;
  story_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressEvent {
  stage: "text" | "images" | "assembling";
  completed_count: number;
  total_count: number;
  current_beat_id?: string;
  eta_seconds?: number;
}
