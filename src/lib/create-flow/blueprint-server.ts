/**
 * Server-only: template-based blueprint (uses DB)
 */

import { db } from "@/lib/db";
import { FULL_BOOK_PAGE_COUNT } from "@/lib/constants";
import {
  createFullBlueprint,
  type ChildData,
  type Blueprint,
  type BlueprintBeat,
} from "./blueprint";

/**
 * Create full blueprint from template (DB) or fallback to default.
 */
export async function createFullBlueprintFromTemplate(
  child: ChildData
): Promise<Blueprint> {
  const templates = await db.query<{ id: string; name: string; config: unknown }>(
    "SELECT id, name, config FROM templates WHERE $1 = ANY(age_bands) ORDER BY name",
    [child.age_band]
  );

  if (templates.length) {
    const interests = child.interests.map((i) => i.toLowerCase());
    const interestKeywords: Record<string, string[]> = {
      dinosaurs: ["dinosaur", "dinosaurs", "dino"],
      space: ["space", "rocket", "astronaut", "stars"],
      animals: ["animal", "animals", "pet", "pets"],
    };
    const matched =
      templates.find((t) => {
        const theme = ((t.config as { theme?: string })?.theme ?? t.name ?? "").toLowerCase();
        const keywords = interestKeywords[theme] ?? [theme];
        return interests.some((i) =>
          keywords.some((k) => i.includes(k) || k.includes(i)) ||
          theme.includes(i) ||
          i.includes(theme)
        );
      }) ?? templates[0];
    const templateBeats = ((matched.config as { beats?: BlueprintBeat[] })?.beats ?? []) as BlueprintBeat[];
    if (templateBeats.length >= FULL_BOOK_PAGE_COUNT) {
      const sliced = templateBeats.slice(0, FULL_BOOK_PAGE_COUNT);
      const personalize = (text: string) => {
        let out = text.replace(/Child/g, child.name);
        const favs = child.favorites.filter(Boolean);
        if (favs.length && out.includes("storybook")) {
          out = `${out}, ${favs.slice(0, 2).join(" and ")} elements`;
        }
        if ((child.fears_to_avoid ?? []).length > 0) {
          out = `${out}, daylight, warm and friendly atmosphere`;
        }
        return out;
      };
      const beats = sliced.map((b, i) => ({
        ...b,
        page_index: i + 1,
        narrative_summary: b.narrative_summary.replace(/Child/g, child.name),
        illustration_instructions: personalize(b.illustration_instructions),
      }));
      return {
        child_name: child.name,
        reading_level: child.age_band,
        fears_to_avoid: child.fears_to_avoid?.length ? child.fears_to_avoid : undefined,
        beats,
      };
    }
  }
  return createFullBlueprint(child);
}
