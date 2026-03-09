import { describe, it, expect, afterEach } from "vitest";
import {
  buildPrompt,
  buildReplicatePrompt,
  buildPromptForProvider,
  getPromptVariantForJob,
  REPLICATE_NEGATIVE_PROMPT,
} from "../prompt";
import type { ImageGenerationInput } from "../types";

const baseInput: ImageGenerationInput = {
  beat: {
    beat_id: "test_1",
    illustration_instructions: "Child standing in magical forest, curious expression",
  },
  photoUrls: ["https://example.com/photo.jpg"],
  jobId: "job-123",
};

describe("buildReplicatePrompt", () => {
  it("includes scene and style suffix", () => {
    const result = buildReplicatePrompt(baseInput);
    expect(result).toContain("Child standing in magical forest, curious expression");
    expect(result).toContain("painterly");
    expect(result).toContain("cozy warm ambiance");
    expect(result).toContain("preserve the child's identity");
  });

  it("uses fallback when illustration_instructions is empty", () => {
    const input: ImageGenerationInput = {
      ...baseInput,
      beat: { ...baseInput.beat, illustration_instructions: "" },
    };
    const result = buildReplicatePrompt(input);
    expect(result).toContain("child as the main character in a children's storybook scene");
    expect(result).toContain("painterly");
  });

  it("appends styleHints when provided", () => {
    const input: ImageGenerationInput = {
      ...baseInput,
      styleHints: ["adventure", "exploration"],
    };
    const result = buildReplicatePrompt(input);
    expect(result).toContain("adventure");
    expect(result).toContain("exploration");
  });

  it("uses comma-separated format", () => {
    const result = buildReplicatePrompt(baseInput);
    expect(result).not.toMatch(/\.\s+[a-z]/);
    expect(result.split(",").length).toBeGreaterThan(2);
  });

  it("strict mode adds identity-preserving tokens", () => {
    const strictInput: ImageGenerationInput = { ...baseInput, mode: "strict" };
    const result = buildReplicatePrompt(strictInput);
    expect(result).toContain("character reference sheet");
    expect(result).toContain("identity-preserving");
    expect(result).toContain("child must be instantly recognizable");
  });

  it("balanced mode uses base style without strict suffix", () => {
    const balancedInput: ImageGenerationInput = { ...baseInput, mode: "balanced" };
    const result = buildReplicatePrompt(balancedInput);
    expect(result).not.toContain("character reference sheet");
    expect(result).toContain("preserve the child's identity");
  });
});

describe("buildPromptForProvider", () => {
  const origEnv = process.env.REPLICATE_PROMPT_VERSION;

  afterEach(() => {
    process.env.REPLICATE_PROMPT_VERSION = origEnv;
  });

  it("replicate v2 returns buildReplicatePrompt result", () => {
    process.env.REPLICATE_PROMPT_VERSION = "v2";
    const result = buildPromptForProvider(baseInput, "replicate");
    expect(result).toContain("painterly");
    expect(result).toContain("Child standing in magical forest");
  });

  it("replicate v1 returns buildPrompt result", () => {
    process.env.REPLICATE_PROMPT_VERSION = "v1";
    const result = buildPromptForProvider(baseInput, "replicate");
    expect(result).toBe(buildPrompt(baseInput));
    expect(result).toContain("children's storybook illustration");
  });

  it("openai returns buildPrompt result", () => {
    const result = buildPromptForProvider(baseInput, "openai");
    expect(result).toBe(buildPrompt(baseInput));
  });

  it("respects variant override", () => {
    const result = buildPromptForProvider(baseInput, "replicate", { variant: "v1" });
    expect(result).toBe(buildPrompt(baseInput));
  });
});

describe("getPromptVariantForJob", () => {
  const orig = process.env.REPLICATE_PROMPT_AB_RATIO;

  afterEach(() => {
    process.env.REPLICATE_PROMPT_AB_RATIO = orig;
  });

  it("returns null when REPLICATE_PROMPT_AB_RATIO not set", () => {
    delete process.env.REPLICATE_PROMPT_AB_RATIO;
    expect(getPromptVariantForJob("job-1")).toBeNull();
  });

  it("returns deterministic variant when ratio set", () => {
    process.env.REPLICATE_PROMPT_AB_RATIO = "0.5";
    const v1 = getPromptVariantForJob("job-1");
    const v2 = getPromptVariantForJob("job-1");
    expect(v1).toBe(v2);
    expect(["v1", "v2"]).toContain(v1);
  });
});

describe("REPLICATE_NEGATIVE_PROMPT", () => {
  it("contains expected tokens", () => {
    expect(REPLICATE_NEGATIVE_PROMPT).toContain("ugly");
    expect(REPLICATE_NEGATIVE_PROMPT).toContain("blurry");
    expect(REPLICATE_NEGATIVE_PROMPT).toContain("violent");
  });
});
