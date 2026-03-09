/**
 * Railway Object Storage (S3-compatible)
 * Replaces Supabase Storage
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3(): S3Client {
  const endpoint = process.env.RAILWAY_BUCKET_ENDPOINT ?? process.env.S3_ENDPOINT;
  const region = process.env.RAILWAY_BUCKET_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  const accessKey = process.env.RAILWAY_BUCKET_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("Storage credentials not set (RAILWAY_BUCKET_* or AWS_*)");
  }

  return new S3Client({
    region,
    endpoint: endpoint ?? undefined,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: !!endpoint,
  });
}

const BUCKET = process.env.RAILWAY_BUCKET_NAME ?? process.env.S3_BUCKET ?? "assets";

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const client = getS3();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export function getPublicUrl(key: string): string {
  const endpoint = process.env.RAILWAY_BUCKET_ENDPOINT ?? process.env.S3_ENDPOINT;
  if (endpoint) {
    return `${endpoint}/${BUCKET}/${key}`;
  }
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
}

/** Generate a presigned URL for reading a private object. Expires in 1 hour. */
export async function getSignedReadUrl(key: string): Promise<string> {
  const client = getS3();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/** Delete an object from storage. */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3();
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

