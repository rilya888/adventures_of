import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/books/by-story/[storyId]
 * Returns book id for given story if owned by current user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const book = await db.queryOne<{ id: string }>(
      "SELECT id FROM books WHERE story_id = $1 AND user_id = $2",
      [storyId, user_id]
    );

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ id: book.id });
  } catch (err) {
    console.error("GET /api/books/by-story/[storyId]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
