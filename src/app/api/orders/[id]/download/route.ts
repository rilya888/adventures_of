import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { APP_URL, ORDER_STATUS } from "@/lib/constants";

/**
 * GET /api/orders/[id]/download
 * Returns book content for paid order. MVP: HTML page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await db.queryOne<{ id: string; status: string; book_id: string | null }>(
      "SELECT id, status, book_id FROM orders WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== ORDER_STATUS.PAID) {
      return NextResponse.json(
        { error: "Payment required to download" },
        { status: 403 }
      );
    }

    if (!order.book_id) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const book = await db.queryOne<{ story_id: string }>(
      "SELECT story_id FROM books WHERE id = $1 AND user_id = $2",
      [order.book_id, user_id]
    );

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const story = await db.queryOne<{ title: string; beats: unknown }>(
      "SELECT title, beats FROM stories WHERE id = $1",
      [book.story_id]
    );

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const beats = (story.beats ?? []) as Array<{
      generated_text?: string;
      generated_image_url?: string;
    }>;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(story.title)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 2rem; background: #fefce8; color: #1c1917; }
    h1 { font-size: 1.5rem; margin-bottom: 2rem; }
    .page { position: relative; margin-bottom: 2rem; border-radius: 8px; overflow: hidden; }
    .page img { display: block; max-width: 100%; height: auto; }
    .caption { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.75rem 1rem; font-family: "Comic Sans MS", "Comic Neue", cursive; font-size: 0.875rem; line-height: 1.4; background: rgba(254, 249, 195, 0.95); color: #1c1917; border-top: 1px solid #fde68a; }
    @media (min-width: 768px) { .caption { padding: 1rem 1.25rem; font-size: 1rem; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(story.title)}</h1>
  ${beats
    .map(
      (beat) => {
        const imgSrc = beat.generated_image_url
          ? (beat.generated_image_url.startsWith("/") ? APP_URL.replace(/\/$/, "") + beat.generated_image_url : beat.generated_image_url)
          : "";
        const caption = beat.generated_text ? escapeHtml(beat.generated_text) : "";
        return `
  <div class="page">
    ${imgSrc ? `<img src="${escapeHtml(imgSrc)}" alt="Page" />` : ""}
    ${caption ? `<div class="caption">${caption}</div>` : ""}
  </div>`;
      }
    )
    .join("")}
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${escapeFilename(story.title)}.html"`,
      },
    });
  } catch (err) {
    console.error("GET /api/orders/[id]/download:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
}
