/**
 * Replicate provider: FLUX PuLID (model 2/6).
 * Identity preservation, start_step 1 for stylized illustrations.
 */

import Replicate from "replicate";
import type { ImageGenerationInput, ImageProvider } from "./types";
import { buildIdeogramPrompt, getPromptVariantForJob, REPLICATE_NEGATIVE_PROMPT } from "./prompt";

const PULID_MODEL =
  "bytedance/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b" as `${string}/${string}`;

function logTelemetry(params: {
  jobId: string;
  beatId: string;
  prompt_version: string;
  attempt: string;
  status: "success" | "error";
  latency_ms: number;
  content_type?: string;
}) {
  console.log(
    `[image-generator] replicate telemetry: ${JSON.stringify(params)}`
  );
}

async function runPuLID(
  replicate: Replicate,
  input: ImageGenerationInput
): Promise<{ output: unknown }> {
  const faceUrl = input.photoUrls[0]!;
  const prompt = buildIdeogramPrompt(input);

  const replicateInput: Record<string, unknown> = {
    main_face_image: faceUrl,
    prompt,
    start_step: 1,
    num_outputs: 1,
    negative_prompt:
      process.env.REPLICATE_NEGATIVE_PROMPT_OVERRIDE ?? REPLICATE_NEGATIVE_PROMPT,
  };

  const output = await replicate.run(PULID_MODEL, { input: replicateInput });
  return { output };
}

function parseOutput(output: unknown): string {
  if (output == null) return "";
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const raw = output[0];
    if (typeof raw === "string") return raw;
    if (typeof raw === "object" && raw !== null && "url" in raw) {
      const url = (raw as { url: string | (() => string) }).url;
      return typeof url === "function" ? url() : String(url);
    }
  }
  if (typeof output === "object" && "url" in output) {
    const url = (output as { url: string | (() => string) }).url;
    return typeof url === "function" ? url() : String(url);
  }
  return "";
}

function getContentType(res: Response): string {
  const ct = res.headers.get("Content-Type");
  if (ct && ct.includes("image/")) return ct;
  return "image/png";
}

export const replicateProvider: ImageProvider = {
  id: "replicate",
  async generate(
    input: ImageGenerationInput
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error("REPLICATE_API_TOKEN not set");
    }

    const faceUrl = input.photoUrls[0];
    if (!faceUrl) {
      throw new Error("No photo URL for face input");
    }

    const promptVersion = getPromptVariantForJob(input.jobId) ?? "v2";
    const replicate = new Replicate({ auth: token, useFileOutput: false });
    const startMs = Date.now();

    let output: unknown;
    try {
      output = (await runPuLID(replicate, input)).output;
    } catch (err) {
      const latencyMs = Date.now() - startMs;
      logTelemetry({
        jobId: input.jobId,
        beatId: input.beat.beat_id,
        prompt_version: promptVersion,
        attempt: "pulid",
        status: "error",
        latency_ms: latencyMs,
      });
      throw err;
    }

    const outputUrl = parseOutput(output);
    const attempt = "pulid";
    if (!outputUrl.startsWith("http")) {
      const latencyMs = Date.now() - startMs;
      logTelemetry({
        jobId: input.jobId,
        beatId: input.beat.beat_id,
        prompt_version: promptVersion,
        attempt,
        status: "error",
        latency_ms: latencyMs,
      });
      throw new Error("Invalid Replicate output");
    }

    const res = await fetch(outputUrl);
    if (!res.ok) {
      const latencyMs = Date.now() - startMs;
      logTelemetry({
        jobId: input.jobId,
        beatId: input.beat.beat_id,
        prompt_version: promptVersion,
        attempt,
        status: "error",
        latency_ms: latencyMs,
      });
      throw new Error("Failed to fetch generated image");
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = getContentType(res);
    const latencyMs = Date.now() - startMs;

    logTelemetry({
      jobId: input.jobId,
      beatId: input.beat.beat_id,
      prompt_version: promptVersion,
      attempt,
      status: "success",
      latency_ms: latencyMs,
      content_type: contentType,
    });

    return { buffer, contentType };
  },
};
