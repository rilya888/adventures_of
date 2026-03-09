/**
 * OpenAI gpt-image-1.5 provider.
 * With photo: images.edit + input_fidelity high (face preservation).
 * Without photo: images.generate (text-to-image, no face).
 */

import OpenAI, { toFile } from "openai";
import type { ImageGenerationInput, ImageProvider } from "./types";
import { buildPromptForProvider, buildEditPrompt } from "./prompt";

const QUALITY_VALUES = ["low", "medium", "high", "auto"] as const;
type QualityValue = (typeof QUALITY_VALUES)[number];

const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50MB

function getQuality(): QualityValue {
  const env = process.env.OPENAI_IMAGE_QUALITY?.toLowerCase();
  if (env && QUALITY_VALUES.includes(env as QualityValue)) {
    return env as QualityValue;
  }
  return "low";
}

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey: key });
}

function getFileExtension(contentType: string | null): string {
  if (!contentType) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "png";
}

function parseResponse(
  response: { data?: Array<{ b64_json?: string }>; output_format?: string }
): { buffer: Buffer; contentType: string } {
  const first = response.data?.[0];
  if (!first?.b64_json) {
    throw new Error("OpenAI image API returned no image");
  }
  const buffer = Buffer.from(first.b64_json, "base64");
  const contentType =
    response.output_format === "jpeg" ? "image/jpeg" : "image/png";
  return { buffer, contentType };
}

export const openaiProvider: ImageProvider = {
  id: "openai",
  async generate(input: ImageGenerationInput): Promise<{ buffer: Buffer; contentType: string }> {
    const openai = getOpenAI();
    const faceUrl = input.photoUrls[0];

    if (faceUrl) {
      return runEdit(openai, input, faceUrl);
    }

    return runGenerate(openai, input);
  },
};

async function runEdit(
  openai: OpenAI,
  input: ImageGenerationInput,
  faceUrl: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(faceUrl);
  if (!res.ok) {
    console.error(
      "[image-generator] OpenAI edit: failed to fetch reference photo -> placeholder",
      res.status,
      res.statusText
    );
    throw new Error(`Failed to fetch reference photo: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_IMAGE_BYTES) {
    console.error(
      "[image-generator] OpenAI edit: image too large (>50MB) -> placeholder"
    );
    throw new Error("Reference image exceeds 50MB limit");
  }

  const contentType = res.headers.get("Content-Type");
  const ext = getFileExtension(contentType);
  const imageFile = await toFile(buffer, `face.${ext}`, {
    type: contentType || "image/png",
  });

  const response = await openai.images.edit({
    model: "gpt-image-1.5",
    image: imageFile,
    prompt: buildEditPrompt(input),
    input_fidelity: "high",
    quality: getQuality(),
    size: "1024x1536",
    output_format: "png",
    n: 1,
  });

  return parseResponse(response);
}

async function runGenerate(
  openai: OpenAI,
  input: ImageGenerationInput
): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await openai.images.generate({
    model: "gpt-image-1.5",
    prompt: buildPromptForProvider(input, "openai"),
    size: "1024x1536",
    quality: getQuality(),
    n: 1,
  });

  return parseResponse(response);
}
