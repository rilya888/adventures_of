/**
 * Retry policy for transient failures.

 * Per audit: retry for provider timeout, network failure, storage failure.
 */

const TRANSIENT_PATTERNS = [
  /timeout/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /fetch failed/i,
  /network/i,
  /502 Bad Gateway/i,
  /503 Service Unavailable/i,
  /504 Gateway Timeout/i,
  /rate limit/i,
];

export function isTransientError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return TRANSIENT_PATTERNS.some((p) => p.test(message));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; delayMs?: number }
): Promise<T> {
  const { maxRetries, delayMs = 2000 } = options;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries && isTransientError(err)) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
