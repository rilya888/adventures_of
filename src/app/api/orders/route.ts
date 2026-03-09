import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { REFUND_WINDOW_DAYS, ORDER_STATUS } from "@/lib/constants";

/**
 * GET /api/orders
 * List orders for current user.
 */
export async function GET() {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db.query<{
      id: string;
      status: string;
      book_id: string | null;
      amount_cents: number;
      currency: string;
      created_at: string;
      story_title?: string;
    }>(
      `SELECT o.id, o.status, o.book_id, o.amount_cents, o.currency, o.created_at,
              s.title AS story_title
       FROM orders o
       LEFT JOIN books b ON b.id = o.book_id
       LEFT JOIN stories s ON s.id = b.story_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [user_id]
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - REFUND_WINDOW_DAYS);

    const enriched = orders.map((o) => ({
      ...o,
      can_refund:
        o.status === ORDER_STATUS.PAID &&
        new Date(o.created_at) > cutoff,
    }));

    return NextResponse.json({ orders: enriched });
  } catch (err) {
    console.error("GET /api/orders:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
