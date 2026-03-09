import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const ConsentSchema = z.object({
  consent_type: z.enum(["generation", "marketing_demo"]),
  child_id: z.string().uuid().optional(),
  text_version: z.string().optional(),
});

/**
 * POST /api/consents
 * Record consent (03 compliance).
 */
export async function POST(request: NextRequest) {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ConsentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { consent_type, child_id, text_version } = parsed.data;

    const rows = await db.query<{ id: string; consent_type: string; granted_at: string }>(
      `INSERT INTO consents (user_id, child_id, consent_type, text_version)
       VALUES ($1, $2, $3, $4) RETURNING id, consent_type, granted_at`,
      [user_id, child_id ?? null, consent_type, text_version ?? "v1"]
    );
    const consent = rows[0];

    if (!consent) {
      return NextResponse.json(
        { error: "Failed to record consent" },
        { status: 500 }
      );
    }

    return NextResponse.json(consent);
  } catch (err) {
    console.error("POST /api/consents:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consents
 * List user's consents.
 */
export async function GET() {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consents = await db.query<{
      id: string;
      consent_type: string;
      child_id: string | null;
      granted_at: string;
      revoked_at: string | null;
    }>(
      "SELECT id, consent_type, child_id, granted_at, revoked_at FROM consents WHERE user_id = $1 ORDER BY granted_at DESC",
      [user_id]
    );

    return NextResponse.json({ consents });
  } catch (err) {
    console.error("GET /api/consents:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
