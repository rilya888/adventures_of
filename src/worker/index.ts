/**
 * Background worker: polls jobs table and processes queued jobs.
 * Runs as separate Railway service. No Inngest needed.
 */

import { db } from "@/lib/db";
import { JOB_STATUS } from "@/lib/constants";
import { processJob } from "@/lib/process-job";

const POLL_INTERVAL_MS = 3000;

async function runWorker() {
  console.log("[worker] Starting job worker...");

  while (true) {
    try {
      const job = await db.withTransaction(async (tx) => {
        const row = await tx.queryOne<{ id: string }>(
          `SELECT id FROM jobs WHERE status = $1 ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`,
          [JOB_STATUS.QUEUED]
        );
        return row;
      });

      if (job) {
        console.log("[worker] Processing job", job.id);
        try {
          const result = await processJob(job.id);
          console.log("[worker] Job completed", job.id, result);
        } catch (err) {
          console.error("[worker] Job failed", job.id, err);
          // Job is marked failed in processJob; continue
        }
        continue; // Process next job immediately
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    } catch (err) {
      console.error("[worker] Poll error:", err);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS * 2));
    }
  }
}

runWorker().catch((err) => {
  console.error("[worker] Fatal:", err);
  process.exit(1);
});
