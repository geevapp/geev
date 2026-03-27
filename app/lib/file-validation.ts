export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] as const;
export type AllowedType = (typeof ALLOWED_TYPES)[number];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export interface ValidationError {
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE';
  message: string;
}

export function validateFile(
  mimeType: string,
  sizeBytes: number,
): ValidationError | null {
  if (!(ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
    return {
      code:    'INVALID_TYPE',
      message: `File type "${mimeType}" is not allowed. Accepted: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV).`,
    };
  }

  const isVideo = (ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType);
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const label   = isVideo ? '100 MB' : '10 MB';

  if (sizeBytes > maxSize) {
    return {
      code:    'FILE_TOO_LARGE',
      message: `File exceeds the ${label} limit.`,
    };
  }

  return null;
}