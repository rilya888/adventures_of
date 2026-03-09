import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/ready
 * Readiness check (DB connectivity)
 */
export async function GET() {
  try {
    await db.query("SELECT id FROM users LIMIT 1");
    return NextResponse.json({ ready: true });
  } catch {
    return NextResponse.json({ ready: false }, { status: 503 });
  }
}
