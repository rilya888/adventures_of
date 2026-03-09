import { NextRequest, NextResponse } from "next/server";
import { getSignedReadUrl } from "@/lib/storage";

/**
 * GET /api/assets/signed?key=generated/jobId/beat.png
 * Redirects to a pre-signed URL for private storage (Railway/S3).
 */
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }
    if (!/^generated\/[a-zA-Z0-9-]+\/[a-zA-Z0-9_.-]+\.(png|webp|jpg|jpeg)$/i.test(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    const signedUrl = await getSignedReadUrl(key);
    return NextResponse.redirect(signedUrl, 302);
  } catch (err) {
    console.error("[assets/signed]", err);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
