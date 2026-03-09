import { describe, it, expect } from "vitest";
import {
  isPlaceholderUrl,
  passesPreviewQualityGate,
  computeQualityScore,
} from "../quality-gate";

describe("quality-gate", () => {
  describe("isPlaceholderUrl", () => {
    it("returns true for placehold.co URLs", () => {
      expect(isPlaceholderUrl("https://placehold.co/1024x1024/f5f5dc/8b4513?text=Placeholder")).toBe(true);
      expect(isPlaceholderUrl("https://placehold.co/600x400")).toBe(true);
    });

    it("returns false for real image URLs", () => {
      expect(isPlaceholderUrl("https://example.com/image.png")).toBe(false);
      expect(isPlaceholderUrl("/api/assets/signed?key=generated/job/beat.png")).toBe(false);
    });

    it("returns false for null/undefined/empty", () => {
      expect(isPlaceholderUrl(null)).toBe(false);
      expect(isPlaceholderUrl(undefined)).toBe(false);
      expect(isPlaceholderUrl("")).toBe(false);
    });
  });

  describe("passesPreviewQualityGate", () => {
    it("returns false for placeholder URLs", () => {
      expect(passesPreviewQualityGate("https://placehold.co/1024x1024")).toBe(false);
    });

    it("returns false for null/undefined/empty", () => {
      expect(passesPreviewQualityGate(null)).toBe(false);
      expect(passesPreviewQualityGate(undefined)).toBe(false);
      expect(passesPreviewQualityGate("")).toBe(false);
    });

  it("returns true for valid preview URLs", () => {
    expect(passesPreviewQualityGate("/api/assets/signed?key=generated/job/beat.png")).toBe(true);
    expect(passesPreviewQualityGate("https://storage.example.com/generated/123/beat.png")).toBe(true);
  });
});

describe("computeQualityScore", () => {
  it("returns 0 for placeholder", () => {
    expect(computeQualityScore("https://placehold.co/1024", { placeholder: true })).toBe(0);
    expect(computeQualityScore("https://placehold.co/1024")).toBe(0);
  });

  it("returns 1 for real image", () => {
    expect(computeQualityScore("/api/assets/signed?key=gen/1/b.png", { placeholder: false })).toBe(1);
  });

  it("returns null for empty", () => {
    expect(computeQualityScore(null)).toBeNull();
    expect(computeQualityScore("")).toBeNull();
  });
});
});
