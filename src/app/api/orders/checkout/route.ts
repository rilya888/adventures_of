import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe, BOOK_PRICE_CENTS, BOOK_CURRENCY } from "@/lib/stripe";
import { ORDER_STATUS } from "@/lib/constants";
import { z } from "zod";

const CheckoutSchema = z.object({
  book_id: z.string().uuid(),
  idempotency_key: z.string().optional(),
});

/**
 * POST /api/orders/checkout
 * Create order and Stripe Checkout session for $15 digital book.
 */
export async function POST(request: NextRequest) {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json(
        { error: "Unauthorized. Sign in or continue as guest." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { book_id } = parsed.data;

    const book = await db.queryOne<{ id: string }>(
      "SELECT id FROM books WHERE id = $1 AND user_id = $2",
      [book_id, user_id]
    );

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const existingOrder = await db.queryOne<{ id: string }>(
      `SELECT id FROM orders WHERE book_id = $1 AND user_id = $2 AND status = $3`,
      [book_id, user_id, ORDER_STATUS.PAID]
    );

    if (existingOrder) {
      return NextResponse.json(
        { error: "Already purchased", order_id: existingOrder.id },
        { status: 409 }
      );
    }

    const orderRows = await db.query<{ id: string }>(
      `INSERT INTO orders (user_id, book_id, status, amount_cents, currency)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user_id, book_id, ORDER_STATUS.PENDING, BOOK_PRICE_CENTS, BOOK_CURRENCY]
    );
    const order = orderRows[0];

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    await db.query(
      `INSERT INTO payments (order_id, status, amount_cents) VALUES ($1, 'pending', $2)`,
      [order.id, BOOK_PRICE_CENTS]
    );

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: BOOK_CURRENCY,
            product_data: {
              name: "Digital Storybook",
              description: "Personalized AI-generated children's book",
            },
            unit_amount: BOOK_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout/success?order_id=${order.id}`,
      cancel_url: `${baseUrl}/create`,
      metadata: {
        order_id: order.id,
        book_id,
        user_id,
      },
      client_reference_id: order.id,
    });

    return NextResponse.json({
      checkout_url: session.url,
      order_id: order.id,
    });
  } catch (err) {
    console.error("POST /api/orders/checkout:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
