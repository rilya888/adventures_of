import { describe, it, expect, vi } from "vitest";
import { isTransientError, withRetry } from "../retry";

describe("retry", () => {
  describe("isTransientError", () => {
    it("returns true for timeout errors", () => {
      expect(isTransientError(new Error("Request timeout"))).toBe(true);
      expect(isTransientError(new Error("ETIMEDOUT"))).toBe(true);
    });

    it("returns true for network errors", () => {
      expect(isTransientError(new Error("fetch failed"))).toBe(true);
      expect(isTransientError(new Error("ECONNRESET"))).toBe(true);
    });

    it("returns true for 5xx errors", () => {
      expect(isTransientError(new Error("502 Bad Gateway"))).toBe(true);
      expect(isTransientError(new Error("503 Service Unavailable"))).toBe(true);
      expect(isTransientError(new Error("504 Gateway Timeout"))).toBe(true);
    });

    it("returns false for validation errors", () => {
      expect(isTransientError(new Error("Invalid input"))).toBe(false);
      expect(isTransientError(new Error("REPLICATE_API_TOKEN not set"))).toBe(false);
    });
  });

  describe("withRetry", () => {
    it("returns result on first success", async () => {
      const fn = vi.fn().mockResolvedValue(42);
      const result = await withRetry(fn, { maxRetries: 2 });
      expect(result).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on transient error then succeeds", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("timeout"))
        .mockResolvedValueOnce(42);
      const result = await withRetry(fn, { maxRetries: 2, delayMs: 1 });
      expect(result).toBe(42);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("throws after max retries on transient error", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("timeout"));
      await expect(withRetry(fn, { maxRetries: 2, delayMs: 1 })).rejects.toThrow("timeout");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("does not retry on non-transient error", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Invalid input"));
      await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow("Invalid input");
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
