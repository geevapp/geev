import { describe, it, expect } from "vitest";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  validateFile,
} from "@/lib/file-validation";

describe("File Validation", () => {
  describe("Constants", () => {
    it("should have correct allowed image types", () => {
      expect(ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
      expect(ALLOWED_IMAGE_TYPES).toContain("image/png");
      expect(ALLOWED_IMAGE_TYPES).toContain("image/webp");
      expect(ALLOWED_IMAGE_TYPES).toContain("image/gif");
      expect(ALLOWED_IMAGE_TYPES).toHaveLength(4);
    });

    it("should have correct allowed video types", () => {
      expect(ALLOWED_VIDEO_TYPES).toContain("video/mp4");
      expect(ALLOWED_VIDEO_TYPES).toContain("video/webm");
      expect(ALLOWED_VIDEO_TYPES).toContain("video/quicktime");
      expect(ALLOWED_VIDEO_TYPES).toHaveLength(3);
    });

    it("should combine image and video types", () => {
      expect(ALLOWED_TYPES).toHaveLength(7);
      expect(ALLOWED_TYPES).toEqual([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ]);
    });

    it("should have correct size limits", () => {
      expect(MAX_IMAGE_SIZE).toBe(10 * 1024 * 1024); // 10 MB
      expect(MAX_VIDEO_SIZE).toBe(100 * 1024 * 1024); // 100 MB
    });
  });

  describe("validateFile", () => {
    it("should accept valid image types within size limit", () => {
      const result = validateFile("image/jpeg", 5 * 1024 * 1024);
      expect(result).toBeNull();
    });

    it("should accept valid video types within size limit", () => {
      const result = validateFile("video/mp4", 50 * 1024 * 1024);
      expect(result).toBeNull();
    });

    it("should reject unsupported file types", () => {
      const result = validateFile("application/pdf", 1024);
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_TYPE");
      expect(result?.message).toContain("not allowed");
    });

    it("should reject executable files", () => {
      const result = validateFile("application/x-executable", 1024);
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_TYPE");
    });

    it("should reject script files", () => {
      const result = validateFile("text/javascript", 1024);
      expect(result).not.toBeNull();
      expect(result?.code).toBe("INVALID_TYPE");
    });

    it("should reject images exceeding size limit", () => {
      const result = validateFile("image/jpeg", 11 * 1024 * 1024);
      expect(result).not.toBeNull();
      expect(result?.code).toBe("FILE_TOO_LARGE");
      expect(result?.message).toContain("10 MB");
    });

    it("should reject videos exceeding size limit", () => {
      const result = validateFile("video/mp4", 101 * 1024 * 1024);
      expect(result).not.toBeNull();
      expect(result?.code).toBe("FILE_TOO_LARGE");
      expect(result?.message).toContain("100 MB");
    });

    it("should accept image at exact size limit", () => {
      const result = validateFile("image/png", MAX_IMAGE_SIZE);
      expect(result).toBeNull();
    });

    it("should accept video at exact size limit", () => {
      const result = validateFile("video/webm", MAX_VIDEO_SIZE);
      expect(result).toBeNull();
    });

    it("should reject image 1 byte over limit", () => {
      const result = validateFile("image/gif", MAX_IMAGE_SIZE + 1);
      expect(result).not.toBeNull();
      expect(result?.code).toBe("FILE_TOO_LARGE");
    });

    it("should reject video 1 byte over limit", () => {
      const result = validateFile("video/quicktime", MAX_VIDEO_SIZE + 1);
      expect(result).not.toBeNull();
      expect(result?.code).toBe("FILE_TOO_LARGE");
    });

    it("should accept very small files", () => {
      const result = validateFile("image/jpeg", 1024);
      expect(result).toBeNull();
    });

    it("should accept zero-byte files", () => {
      const result = validateFile("image/png", 0);
      expect(result).toBeNull();
    });

    it("should handle all allowed image types", () => {
      for (const type of ALLOWED_IMAGE_TYPES) {
        const result = validateFile(type, 1024);
        expect(result).toBeNull();
      }
    });

    it("should handle all allowed video types", () => {
      for (const type of ALLOWED_VIDEO_TYPES) {
        const result = validateFile(type, 1024);
        expect(result).toBeNull();
      }
    });

    it("should reject similar but invalid types", () => {
      expect(validateFile("image/jpg", 1024)?.code).toBe("INVALID_TYPE");
      expect(validateFile("image/bmp", 1024)?.code).toBe("INVALID_TYPE");
      expect(validateFile("image/tiff", 1024)?.code).toBe("INVALID_TYPE");
      expect(validateFile("video/avi", 1024)?.code).toBe("INVALID_TYPE");
      expect(validateFile("video/x-msvideo", 1024)?.code).toBe("INVALID_TYPE");
    });
  });
});
