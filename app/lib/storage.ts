import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

const s3 = new S3Client({
  region:      process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const CDN_BASE = process.env.CDN_BASE_URL ?? `https://${BUCKET}.s3.amazonaws.com`;

export type UploadResult = { url: string; key: string };

/**
 * Upload a Buffer to S3 and return the public CDN URL + the storage key.
 * The key is stored in the DB so we can delete the object later.
 */
export async function uploadToS3(
  buffer:   Buffer,
  originalName: string,
  mimeType: string,
  folder    = 'uploads',
): Promise<UploadResult> {
  const ext = path.extname(originalName).toLowerCase();
  const key = `${folder}/${randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
      // Objects are public-read — remove if you serve via a signed CDN
      ACL:         'public-read',
    }),
  );

  return { url: `${CDN_BASE}/${key}`, key };
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}