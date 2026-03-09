import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { REFUND_WINDOW_DAYS, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";

/**
 * POST /api/orders/[id]/refund-request
 * Refund eligible order (27: within 7 days).
 */
export async function POST(
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
      payment_provider_id: string | null;
      created_at: string;
    }>(
      "SELECT id, status, payment_provider_id, created_at FROM orders WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== ORDER_STATUS.PAID) {
      return NextResponse.json(
        { error: "Only paid orders can be refunded" },
        { status: 400 }
      );
    }

    const created = new Date(order.created_at);
    const now = new Date();
    const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > REFUND_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `Refund window expired (${REFUND_WINDOW_DAYS} days)` },
        { status: 400 }
      );
    }

    const paymentProviderId = order.payment_provider_id;
    if (!paymentProviderId) {
      return NextResponse.json(
        { error: "Payment provider reference not found" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    let paymentIntentId: string | null = null;

    if (paymentProviderId.startsWith("pi_")) {
      paymentIntentId = paymentProviderId;
    } else if (paymentProviderId.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(
        paymentProviderId,
        { expand: ["payment_intent"] }
      );
      const pi = session.payment_intent as { id?: string } | null;
      paymentIntentId = pi?.id ?? null;
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Could not process refund" },
        { status: 500 }
      );
    }

    await stripe.refunds.create({ payment_intent: paymentIntentId });

    await db.query(
      `UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3`,
      [ORDER_STATUS.REFUNDED, new Date().toISOString(), id]
    );

    await db.query(
      `UPDATE payments SET status = $1 WHERE order_id = $2`,
      [PAYMENT_STATUS.REFUNDED, id]
    );

    return NextResponse.json({ success: true, status: ORDER_STATUS.REFUNDED });
  } catch (err) {
    console.error("POST /api/orders/[id]/refund-request:", err);
    return NextResponse.json(
      { error: "Refund failed" },
      { status: 500 }
    );
  }
}
