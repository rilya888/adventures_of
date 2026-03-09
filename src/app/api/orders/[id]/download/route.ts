import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { APP_URL, DEFAULT_CAPTION_POSITION, ORDER_STATUS } from "@/lib/constants";

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

    const book = await db.queryOne<{ story_id: string; metadata: unknown }>(
      "SELECT story_id, metadata FROM books WHERE id = $1 AND user_id = $2",
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

    const metadata = (book.metadata ?? {}) as { layout?: { caption_position?: string } };
    const captionPosition =
      metadata.layout?.caption_position ?? DEFAULT_CAPTION_POSITION;
    const validPosition = ["top", "bottom", "right", "left"].includes(captionPosition)
      ? captionPosition
      : DEFAULT_CAPTION_POSITION;

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
    .caption { font-family: "Comic Sans MS", "Comic Neue", cursive; font-size: 0.875rem; line-height: 1.5; }
    .caption-right, .caption-left { position: absolute; padding: 1rem; border-radius: 8px; background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: white; display: flex; flex-direction: column; justify-content: center; white-space: pre-line; }
    @supports not (backdrop-filter: blur(8px)) { .caption-right, .caption-left { background: rgba(0,0,0,0.5); } }
    .caption-right { top: 1rem; right: 1rem; bottom: 1rem; width: 40%; max-width: 280px; }
    .caption-left { top: 1rem; left: 1rem; bottom: 1rem; width: 40%; max-width: 280px; }
    .caption-top, .caption-bottom { position: absolute; left: 0; right: 0; padding: 0.75rem 1rem; background: rgba(254,249,195,0.95); color: #1c1917; }
    .caption-top { top: 0; border-bottom: 1px solid #fde68a; }
    .caption-bottom { bottom: 0; border-top: 1px solid #fde68a; }
    @media (min-width: 768px) { .caption { font-size: 1rem; padding: 1.25rem; } }
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
        const rawCaption = beat.generated_text?.trim() ?? "";
        const captionHtml = rawCaption
          ? rawCaption
              .split(/\n\n+/)
              .filter(Boolean)
              .map((p) => `<p>${escapeHtml(p)}</p>`)
              .join("")
          : "";
        return `
  <div class="page">
    ${imgSrc ? `<img src="${escapeHtml(imgSrc)}" alt="Page" />` : ""}
    ${captionHtml ? `<div class="caption caption-${validPosition}">${captionHtml}</div>` : ""}
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
