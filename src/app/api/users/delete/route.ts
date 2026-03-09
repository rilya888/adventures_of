import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

/**
 * POST /api/users/delete
 * GDPR right to erasure: delete all user data and purge storage (11).
 */
export async function POST() {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assets = await db.query<{ storage_path: string }>(
      "SELECT storage_path FROM assets WHERE owner_user_id = $1",
      [user_id]
    );
    for (const a of assets) {
      try {
        await deleteFile(a.storage_path);
      } catch (e) {
        console.warn("Storage purge failed for", a.storage_path, e);
      }
    }

    await db.query("DELETE FROM books WHERE user_id = $1", [user_id]);
    await db.query("DELETE FROM orders WHERE user_id = $1", [user_id]);
    await db.query("DELETE FROM jobs WHERE user_id = $1", [user_id]);
    await db.query("DELETE FROM consents WHERE user_id = $1", [user_id]);
    await db.query("DELETE FROM assets WHERE owner_user_id = $1", [user_id]);
    await db.query("DELETE FROM children WHERE user_id = $1", [user_id]);
    await db.query("DELETE FROM users WHERE id = $1", [user_id]);

    const response = NextResponse.json({ success: true });
    response.cookies.delete("ao_guest_id");
    return response;
  } catch (err) {
    console.error("POST /api/users/delete:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
