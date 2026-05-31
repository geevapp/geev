import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { uploadToS3 } from "@/lib/storage";
import {
  validateFileWithContent,
  getFileCategory,
  getExtensionForMimeType,
} from "@/lib/file-validation";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError("Unauthorized", 401);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError("Invalid multipart body", 400);
    }

    const file = formData.get("file");
    if (!(file instanceof File)) return apiError("No file provided", 400);

    const folder = (formData.get("folder") as string | null) ?? "uploads";

    // Enhanced validation: type, size, and magic byte verification
    const validationError = await validateFileWithContent(file);
    if (validationError) {
      const status = validationError.code === "MIME_MISMATCH" ? 422 : 422;
      return apiError(validationError.message, status);
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Normalize file extension based on actual MIME type for consistency
      const correctExt = getExtensionForMimeType(file.type);
      const originalName = file.name || `upload${correctExt}`;

      // Ensure the file has the correct extension
      const baseName = path.basename(originalName, path.extname(originalName));
      const sanitizedName = `${baseName}${correctExt}`;

      const { url, key } = await uploadToS3(
        buffer,
        sanitizedName,
        file.type,
        folder,
      );

      // Return predictable response structure for frontend
      return apiSuccess(
        {
          url,
          key,
          type: file.type,
          category: getFileCategory(file.type),
          size: file.size,
          name: sanitizedName,
        },
        "upload successful",
      );
    } catch (uploadError) {
      console.error("[upload] S3 error:", uploadError);
      return apiError("Upload failed. Please try again.", 502);
    }
  } catch (error) {
    console.error("[upload] Unexpected error:", error);
    return apiError("Upload failed", 500);
  }
}
