import imageCompression from "browser-image-compression";

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercent: number;
}

export interface ThumbnailResult {
  file: File;
  dataUrl: string;
}

const MAX_SIZE_MB = 0.5;
const MAX_DIMENSION = 1200;
const THUMB_DIMENSION = 300;
const QUALITY = 0.82;

function supportsWebP(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

/**
 * Compress an image file to <500 KB with max 1200×1200 dimensions.
 * Converts to WebP when the browser supports it.
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  const outputType = supportsWebP() ? "image/webp" : "image/jpeg";

  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: outputType,
    initialQuality: QUALITY,
    preserveExif: false,
  };

  let compressed: File;
  try {
    compressed = await imageCompression(file, options);
  } catch {
    // Return the original on failure so uploads never silently break.
    compressed = file;
  }

  const compressedSize = compressed.size;
  const savedBytes = originalSize - compressedSize;

  return {
    file: compressed,
    originalSize,
    compressedSize,
    savedBytes,
    savedPercent: originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0,
  };
}

/**
 * Generate a 300×300 thumbnail from an image file.
 * Returns both a File object and a data URL for immediate preview.
 */
export async function generateThumbnail(file: File): Promise<ThumbnailResult> {
  const options = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: THUMB_DIMENSION,
    useWebWorker: true,
    fileType: supportsWebP() ? "image/webp" : "image/jpeg",
    initialQuality: 0.75,
    preserveExif: false,
  };

  let thumbFile: File;
  try {
    thumbFile = await imageCompression(file, options);
  } catch {
    thumbFile = file;
  }

  const dataUrl = await imageCompression.getDataUrlFromFile(thumbFile);

  return { file: thumbFile, dataUrl };
}

/**
 * Human-readable file size string, e.g. "1.2 MB" or "450 KB".
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
