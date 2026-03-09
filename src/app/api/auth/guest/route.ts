import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { setGuestCookie } from "@/lib/auth";

/**
 * POST /api/auth/guest
 * Create guest session (cookie-based, Railway)
 */
export async function POST() {
  try {
    const userId = crypto.randomUUID();

    await db.query(
      `INSERT INTO users (id, email, is_guest, updated_at)
       VALUES ($1, NULL, true, $2)`,
      [userId, new Date().toISOString()]
    );

    const response = NextResponse.json({
      user_id: userId,
      is_guest: true,
    });

    const cookieList = setGuestCookie(userId);
    cookieList.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (err) {
    console.error("POST /api/auth/guest:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
