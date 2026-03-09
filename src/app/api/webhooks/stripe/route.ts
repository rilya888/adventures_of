import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.error("STRIPE_WEBHOOK_SECRET not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid signature";
      console.error("Stripe webhook signature verification failed:", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id;

      if (!orderId) {
        console.error("checkout.session.completed: missing order_id in metadata");
        return NextResponse.json({ received: true });
      }

      const existing = await db.queryOne<{ status: string }>(
        "SELECT status FROM orders WHERE id = $1",
        [orderId]
      );

      if (existing?.status === ORDER_STATUS.PAID) {
        return NextResponse.json({ received: true });
      }

      await db.query(
        `UPDATE orders SET status = $1, payment_provider_id = $2, updated_at = $3 WHERE id = $4`,
        [ORDER_STATUS.PAID, session.payment_intent ?? session.id, new Date().toISOString(), orderId]
      );

      await db.query(
        `UPDATE payments SET status = $1, provider_payment_id = $2 WHERE order_id = $3`,
        [PAYMENT_STATUS.SUCCEEDED, (session.payment_intent as string) ?? session.id, orderId]
      );

      const order = await db.queryOne<{ book_id: string | null }>(
        "SELECT book_id FROM orders WHERE id = $1",
        [orderId]
      );

      if (order?.book_id) {
        await db.query(
          "UPDATE books SET order_id = $1 WHERE id = $2",
          [orderId, order.book_id]
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
