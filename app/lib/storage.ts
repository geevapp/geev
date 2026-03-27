/**
 * storage.ts
 *
 * Pluggable storage utility for handling file uploads.
 * - Real S3 upload/delete via AWS SDK (server-side)
 * - Simulator for local/dev use (client-side, no credentials needed)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET   = process.env.AWS_S3_BUCKET!;
const CDN_BASE = process.env.CDN_BASE_URL ?? `https://${BUCKET}.s3.amazonaws.com`;

export interface UploadResult {
  url:       string;
  key?:      string;   // S3 storage key — present for real uploads, absent for simulated ones
  thumbnail?: string;
}

/**
 * Upload a Buffer to S3 and return the public CDN URL + the storage key.
 * The key is stored in the DB so we can delete the object later.
 */
export async function uploadToS3(
  buffer:       Buffer,
  originalName: string,
  mimeType:     string,
  folder        = 'uploads',
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

/**
 * Simulates a cloud storage upload.
 * Replace uploadFile's body with a real S3/Cloudinary/Uploadthing call when ready.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const isImage      = file.type.startsWith('image/');
  const simulatedUrl = URL.createObjectURL(file);

  return {
    url:       simulatedUrl,
    thumbnail: isImage ? simulatedUrl : undefined,
  };
}

/**
 * Specialised avatar upload helper.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const result = await uploadFile(file);
  return result.url;
}