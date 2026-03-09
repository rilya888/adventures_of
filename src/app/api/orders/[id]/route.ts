import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/orders/[id]
 * Returns order status for current user.
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

    const order = await db.queryOne<{
      id: string;
      status: string;
      book_id: string | null;
      amount_cents: number;
      currency: string;
    }>(
      "SELECT id, status, book_id, amount_cents, currency FROM orders WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("GET /api/orders/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
