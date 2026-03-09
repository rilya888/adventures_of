/**
 * Blueprint for MVP (Block 05 alignment)
 * Template-based full blueprint; rule-based preview
 */

export interface ChildData {
  name: string;
  age_band: "4-6" | "7-9";
  interests: string[];
  favorites: string[];
  fears_to_avoid: string[];
  reading_preference?: string;
}

export interface BlueprintBeat {
  beat_id: string;
  act: string;
  page_index: number;
  narrative_summary: string;
  illustration_instructions: string;
  safety_tags?: string[];
}

export interface Blueprint {
  child_name: string;
  child_gender?: string;
  pronouns?: string;
  reading_level: string;
  fears_to_avoid?: string[];
  beats: BlueprintBeat[];
}

export function createPreviewBlueprint(child: ChildData): Blueprint {
  return {
    child_name: child.name,
    reading_level: child.age_band,
    fears_to_avoid: child.fears_to_avoid?.length ? child.fears_to_avoid : undefined,
    beats: [
      {
        beat_id: "preview_1",
        act: "setup",
        page_index: 1,
        narrative_summary: `${child.name} as hero in a storybook scene`,
        illustration_instructions: `Child in storybook style, full body, neutral scene, ${child.interests[0] || "adventure"} theme`,
      },
    ],
  };
}

/** When child has fears, add safe atmosphere to illustrations. */
const FEAR_SAFE_SUFFIX = "daylight, warm and friendly atmosphere";

function personalizeInstructions(text: string, child: ChildData): string {
  let out = text.replace(/Child/g, child.name);
  const favorites = child.favorites.filter(Boolean);
  if (favorites.length && out.includes("storybook")) {
    out = `${out}, ${favorites.slice(0, 2).join(" and ")} elements`;
  }
  if ((child.fears_to_avoid ?? []).length > 0) {
    out = `${out}, ${FEAR_SAFE_SUFFIX}`;
  }
  return out;
}

export function createFullBlueprint(child: ChildData): Blueprint {
  const interests = child.interests.join(", ") || "adventure";
  const baseBeats: Array<{ beat_id: string; act: string; page_index: number; narrative_summary: string; illustration_instructions: string }> = [
    {
      beat_id: "page_1",
      act: "setup",
      page_index: 1,
      narrative_summary: `${child.name} discovers a magical world and meets a friendly guide who explains the mission`,
      illustration_instructions: `Child standing in a magical forest, curious expression, storybook style`,
    },
    {
      beat_id: "page_2",
      act: "challenge",
      page_index: 2,
      narrative_summary: `${child.name} faces a challenge, overcomes it, completes the mission and returns home with memories`,
      illustration_instructions: `Child victorious, celebrating with friendly characters, warm scene, ${interests} theme`,
    },
  ];

  const beats: BlueprintBeat[] = baseBeats.map((b) => ({
    ...b,
    narrative_summary: b.narrative_summary.replace(/Child/g, child.name),
    illustration_instructions: personalizeInstructions(b.illustration_instructions, child),
  }));

  return {
    child_name: child.name,
    reading_level: child.age_band,
    fears_to_avoid: child.fears_to_avoid?.length ? child.fears_to_avoid : undefined,
    beats,
  };
}
