import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/users/export
 * GDPR data portability: export all user data as JSON.
 */
export async function GET() {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, children, consents, jobs, orders, books] = await Promise.all([
      db.queryOne("SELECT * FROM users WHERE id = $1", [user_id]),
      db.query("SELECT * FROM children WHERE user_id = $1", [user_id]),
      db.query("SELECT * FROM consents WHERE user_id = $1", [user_id]),
      db.query("SELECT id, type, status, created_at, updated_at FROM jobs WHERE user_id = $1", [user_id]),
      db.query("SELECT id, status, amount_cents, currency, created_at FROM orders WHERE user_id = $1", [user_id]),
      db.query("SELECT id, story_id, created_at FROM books WHERE user_id = $1", [user_id]),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id,
      user,
      children: children ?? [],
      consents: consents ?? [],
      jobs: jobs ?? [],
      orders: orders ?? [],
      books: books ?? [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="adventures-of-export-${user_id.slice(0, 8)}.json"`,
      },
    });
  } catch (err) {
    console.error("GET /api/users/export:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
