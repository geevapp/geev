/**
 * Validates file size based on media type.
 * Images: Max 10MB
 * Videos: Max 50MB
 */
export function validateFileSize(file: File): { isValid: boolean; error?: string } {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB

  if (isImage && file.size > maxImageSize) {
    return { isValid: false, error: "Image size must be less than 10MB" };
  }

  if (isVideo && file.size > maxVideoSize) {
    return { isValid: false, error: "Video size must be less than 50MB" };
  }

  return { isValid: true };
}

/**
 * Sniffs MIME type using magic bytes.
 * Supports PNG, JPEG, GIF, and basic MP4/MOV detection.
 */
export async function sniffMimeType(file: File): Promise<string | null> {
  const arr = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  let header = "";
  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16).padStart(2, "0");
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (header.startsWith("89504e47")) return "image/png";

  // JPEG: FF D8 FF
  if (header.startsWith("ffd8ff")) return "image/jpeg";

  // GIF: 47 49 46 38
  if (header.startsWith("47494638")) return "image/gif";

  // MP4: 00 00 00 ... 66 74 79 70
  // Often 4th to 8th bytes are 'ftyp' (66 74 79 70)
  if (header.includes("66747970")) return "video/mp4";

  // QuickTime (MOV): 6d 6f 6f 76 or 66 74 79 70 71 74
  if (header.includes("6d6f6f76") || header.includes("71742020")) return "video/quicktime";

  return null;
}

/**
 * Combined validation: checks type, size, and magic bytes.
 */
export async function validateMedia(file: File): Promise<{ isValid: boolean; error?: string }> {
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) return sizeValidation;

  const sniffedType = await sniffMimeType(file);
  const browserType = file.type;

  // We trust browser type if sniffing matches the general category or if sniffing fails (for rare types)
  // but we strictly reject if sniffing identifies a mismatch.
  if (sniffedType) {
    const sniffedBase = sniffedType.split("/")[0];
    const browserBase = browserType.split("/")[0];
    
    if (sniffedBase !== browserBase) {
      return { isValid: false, error: `File content mismatch: expected ${browserBase}, found ${sniffedBase}` };
    }
  } else {
    // If we can't sniff it, we check if it's a known browser type we support
    if (!browserType.startsWith("image/") && !browserType.startsWith("video/")) {
      return { isValid: false, error: "Unsupported file type" };
    }
  }

  return { isValid: true };
}
