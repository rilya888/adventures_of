import { describe, it, expect } from "vitest";
import { FULL_BOOK_PAGE_COUNT } from "@/lib/constants";
import {
  createPreviewBlueprint,
  createFullBlueprint,
  type ChildData,
} from "../blueprint";

const sampleChild: ChildData = {
  name: "Alex",
  age_band: "4-6",
  interests: ["dinosaurs", "space"],
  favorites: ["pizza"],
  fears_to_avoid: ["dark"],
};

describe("createPreviewBlueprint", () => {
  it("creates blueprint with one preview beat", () => {
    const bp = createPreviewBlueprint(sampleChild);
    expect(bp.child_name).toBe("Alex");
    expect(bp.reading_level).toBe("4-6");
    expect(bp.beats).toHaveLength(1);
    expect(bp.beats[0]!.beat_id).toBe("preview_1");
    expect(bp.beats[0]!.illustration_instructions).toContain("storybook");
    expect(bp.beats[0]!.illustration_instructions).toContain("dinosaurs");
  });

  it("includes fears_to_avoid when provided", () => {
    const bp = createPreviewBlueprint(sampleChild);
    expect(bp.fears_to_avoid).toEqual(["dark"]);
  });
});

describe("createFullBlueprint", () => {
  it("creates blueprint with FULL_BOOK_PAGE_COUNT beats", () => {
    const bp = createFullBlueprint(sampleChild);
    expect(bp.beats).toHaveLength(FULL_BOOK_PAGE_COUNT);
    expect(bp.beats).toHaveLength(2);
    expect(bp.child_name).toBe("Alex");
  });

  it("creates 2 beats with page_1 and page_2 structure", () => {
    const bp = createFullBlueprint(sampleChild);
    expect(bp.beats[0]?.beat_id).toBe("page_1");
    expect(bp.beats[0]?.page_index).toBe(1);
    expect(bp.beats[1]?.beat_id).toBe("page_2");
    expect(bp.beats[1]?.page_index).toBe(2);
  });

  it("personalizes beats with child name", () => {
    const bp = createFullBlueprint(sampleChild);
    const firstBeat = bp.beats[0]!;
    expect(firstBeat.narrative_summary).toContain("Alex");
    expect(firstBeat.illustration_instructions).toContain("storybook");
  });

  it("includes interests in illustration instructions", () => {
    const bp = createFullBlueprint(sampleChild);
    const beatWithInterests = bp.beats.find(
      (b) =>
        b.illustration_instructions.includes("dinosaurs") ||
        b.illustration_instructions.includes("space")
    );
    expect(beatWithInterests).toBeDefined();
  });

  it("adds favorites and fear-safe atmosphere when provided", () => {
    const bp = createFullBlueprint(sampleChild);
    const firstWithStorybook = bp.beats.find((b) => b.illustration_instructions.includes("storybook"));
    expect(firstWithStorybook?.illustration_instructions).toContain("pizza");
    expect(firstWithStorybook?.illustration_instructions).toContain("daylight");
  });
});
