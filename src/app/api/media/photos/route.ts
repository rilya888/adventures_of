import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, getPublicUrl } from "@/lib/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (22)
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

/**
 * POST /api/media/photos
 * Upload photo (returns asset_id)
 */
export async function POST(request: NextRequest) {
  try {
    const user_id = await getUserId();
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const child_id = formData.get("child_id") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5 MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid format. Use JPEG or PNG." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const assetId = crypto.randomUUID();
    const storagePath = `photos/${user_id}/${assetId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadFile(storagePath, buffer, file.type);

    const url = getPublicUrl(storagePath);

    const rows = await db.query<{ id: string }>(
      `INSERT INTO assets (type, owner_user_id, child_id, storage_path, cdn_url, mime_type, size_bytes)
       VALUES ('photo', $1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, child_id || null, storagePath, url, file.type, file.size]
    );
    const asset = rows[0];

    if (!asset) {
      return NextResponse.json(
        { error: "Failed to save asset" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      asset_id: asset.id,
      storage_path: storagePath,
      url,
    });
  } catch (err) {
    console.error("POST /api/media/photos:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
