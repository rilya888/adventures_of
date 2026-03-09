import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/templates
 * List story templates. Optional: age_band filter.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const age_band = searchParams.get("age_band");

    let templates: { id: string; name: string; version: number; age_bands: string[]; config: unknown }[];
    if (age_band && (age_band === "4-6" || age_band === "7-9")) {
      templates = await db.query(
        "SELECT id, name, version, age_bands, config FROM templates WHERE $1 = ANY(age_bands) ORDER BY name",
        [age_band]
      );
    } else {
      templates = await db.query(
        "SELECT id, name, version, age_bands, config FROM templates ORDER BY name"
      );
    }

    return NextResponse.json({ templates: templates ?? [] });
  } catch (err) {
    console.error("GET /api/templates:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
