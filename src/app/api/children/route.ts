import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const ChildSchema = z.object({
  name: z.string().min(1),
  age_band: z.enum(["4-6", "7-9"]),
  interests: z.array(z.string()),
  favorites: z.array(z.string()),
  fears_to_avoid: z.array(z.string()),
});

/**
 * POST /api/children
 * Create child
 */
export async function POST(request: NextRequest) {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ChildSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, age_band, interests, favorites, fears_to_avoid } = parsed.data;

    const rows = await db.query<{ id: string }>(
      `INSERT INTO children (user_id, name, age_band, interests, favorites, fears_to_avoid)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, name, age_band, interests, favorites, fears_to_avoid]
    );
    const child = rows[0];

    if (!child) {
      return NextResponse.json(
        { error: "Failed to create child" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: child.id });
  } catch (err) {
    console.error("POST /api/children:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/children
 * List user's children
 */
export async function GET() {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const children = await db.query<{ id: string; name: string; age_band: string }>(
      "SELECT id, name, age_band FROM children WHERE user_id = $1 AND deleted_at IS NULL",
      [user_id]
    );

    return NextResponse.json({ children });
  } catch (err) {
    console.error("GET /api/children:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
