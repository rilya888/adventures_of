import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health
 * Health check (no auth)
 */
export async function GET() {
  try {
    await db.query("SELECT 1");
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
