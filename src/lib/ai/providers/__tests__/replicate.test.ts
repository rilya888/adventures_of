import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ImageGenerationInput } from "../types";

vi.mock("replicate", () => ({
  default: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue("https://replicate.delivery/out.png"),
  })),
}));

const baseInput: ImageGenerationInput = {
  beat: {
    beat_id: "beat_1",
    illustration_instructions: "Child in forest",
  },
  photoUrls: ["https://example.com/face.jpg"],
  jobId: "job-123",
};

describe("replicateProvider", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, REPLICATE_API_TOKEN: "test" };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  });

  it("throws when REPLICATE_API_TOKEN is not set", async () => {
    process.env.REPLICATE_API_TOKEN = "";
    const { replicateProvider } = await import("../replicate");
    await expect(replicateProvider.generate(baseInput)).rejects.toThrow(
      "REPLICATE_API_TOKEN not set"
    );
  });

  it("throws when no photo URL", async () => {
    const input: ImageGenerationInput = {
      ...baseInput,
      photoUrls: [],
    };
    const { replicateProvider } = await import("../replicate");
    await expect(replicateProvider.generate(input)).rejects.toThrow(
      "No photo URL for face input"
    );
  });

  it("returns buffer and contentType from fetch response", async () => {
    const mockPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockPngBytes.buffer),
      headers: new Headers({ "Content-Type": "image/png" }),
    });

    const { replicateProvider } = await import("../replicate");
    const result = await replicateProvider.generate(baseInput);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.contentType).toBe("image/png");
  });

  it("falls back to image/png when Content-Type header is missing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      headers: new Headers(),
    });

    const { replicateProvider } = await import("../replicate");
    const result = await replicateProvider.generate(baseInput);

    expect(result.contentType).toBe("image/png");
  });
});
