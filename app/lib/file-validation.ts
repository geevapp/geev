export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const;
export type AllowedType = (typeof ALLOWED_TYPES)[number];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export interface ValidationError {
  code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "MIME_MISMATCH";
  message: string;
}

/**
 * Sniffs MIME type using magic bytes (file signatures).
 * This prevents attacks where malicious files have fake extensions.
 */
export async function sniffMimeType(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Convert to hex string for comparison
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";

  // JPEG: FF D8 FF
  if (hex.startsWith("ffd8ff")) return "image/jpeg";

  // GIF: 47 49 46 38 (GIF8)
  if (hex.startsWith("47494638")) return "image/gif";

  // WebP: RIFF....WEBP
  if (hex.startsWith("52494646") && hex.includes("57454250"))
    return "image/webp";

  // MP4: 00 00 00 ... 66 74 79 70 (ftyp)
  if (hex.includes("66747970")) return "video/mp4";

  // WebM: 1A 45 DF A3
  if (hex.startsWith("1a45dfa3")) return "video/webm";

  // QuickTime/MOV: 00 00 00 14 66 74 79 70
  if (hex.includes("667479707174") || hex.includes("6d6f6f76"))
    return "video/quicktime";

  return null;
}

/**
 * Validates that the declared MIME type matches the actual file content.
 * Returns an error if there's a mismatch (potential security issue).
 */
export async function validateMimeType(
  file: File,
  declaredType: string,
): Promise<ValidationError | null> {
  const sniffedType = await sniffMimeType(file);

  // If we can't sniff the type, allow it if the declared type is valid
  // (some rare but legitimate formats may not have magic bytes)
  if (!sniffedType) {
    const isAllowedType = (ALLOWED_TYPES as readonly string[]).includes(
      declaredType as any,
    );
    if (!isAllowedType) {
      return {
        code: "INVALID_TYPE",
        message: `File type "${declaredType}" is not allowed. Accepted: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV).`,
      };
    }
    return null;
  }

  // Check if sniffed type matches declared type
  if (sniffedType !== declaredType) {
    // Strict mode: if we can sniff the type, it must match exactly
    // This prevents attacks where files have wrong extensions
    return {
      code: "MIME_MISMATCH",
      message: `File content mismatch: declared as "${declaredType}" but actual content is "${sniffedType}". The file may be corrupted or malicious.`,
    };
  }

  return null;
}

export function validateFile(
  mimeType: string,
  sizeBytes: number,
): ValidationError | null {
  if (!(ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
    return {
      code: "INVALID_TYPE",
      message: `File type "${mimeType}" is not allowed. Accepted: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV).`,
    };
  }

  const isVideo = (ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType);
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const label = isVideo ? "100 MB" : "10 MB";

  if (sizeBytes > maxSize) {
    return {
      code: "FILE_TOO_LARGE",
      message: `File exceeds the ${label} limit.`,
    };
  }

  return null;
}

/**
 * Complete validation pipeline: checks type, size, and magic bytes.
 * This is the main validation function for server-side use.
 */
export async function validateFileWithContent(
  file: File,
): Promise<ValidationError | null> {
  // Step 1: Validate declared type and size
  const basicValidation = validateFile(file.type, file.size);
  if (basicValidation) return basicValidation;

  // Step 2: Validate that file content matches declared type
  const mimeValidation = await validateMimeType(file, file.type);
  if (mimeValidation) return mimeValidation;

  return null;
}

/**
 * Get the file category (image or video) from MIME type.
 */
export function getFileCategory(
  mimeType: string,
): "image" | "video" | "unknown" {
  if ((ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType as any)) {
    return "image";
  }
  if ((ALLOWED_VIDEO_TYPES as readonly string[]).includes(mimeType as any)) {
    return "video";
  }
  return "unknown";
}

/**
 * Get the recommended file extension for a MIME type.
 */
export function getExtensionForMimeType(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return extensionMap[mimeType] || "";
}
