import { describe, it, expect } from "vitest";
import {
  sniffMimeType,
  validateMimeType,
  validateFileWithContent,
  getFileCategory,
  getExtensionForMimeType,
} from "@/lib/file-validation";

describe("Magic Byte Validation", () => {
  function createFileWithBytes(
    bytes: number[],
    fileName: string,
    mimeType: string,
  ): File {
    const uint8Array = new Uint8Array(bytes);
    return new File([uint8Array], fileName, { type: mimeType });
  }

  describe("sniffMimeType", () => {
    it("should detect PNG files from magic bytes", async () => {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const file = createFileWithBytes(pngBytes, "test.png", "image/png");
      const sniffed = await sniffMimeType(file);
      expect(sniffed).toBe("image/png");
    });

    it("should detect JPEG files from magic bytes", async () => {
      // JPEG signature: FF D8 FF
      const jpegBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
      const file = createFileWithBytes(jpegBytes, "test.jpg", "image/jpeg");
      const sniffed = await sniffMimeType(file);
      expect(sniffed).toBe("image/jpeg");
    });

    it("should detect GIF files from magic bytes", async () => {
      // GIF signature: 47 49 46 38 (GIF8)
      const gifBytes = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
      const file = createFileWithBytes(gifBytes, "test.gif", "image/gif");
      const sniffed = await sniffMimeType(file);
      expect(sniffed).toBe("image/gif");
    });

    it("should detect WebP files from magic bytes", async () => {
      // WebP signature: RIFF....WEBP
      const webpBytes = [
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // size placeholder
        0x57,
        0x45,
        0x42,
        0x50, // WEBP
      ];
      const file = createFileWithBytes(webpBytes, "test.webp", "image/webp");
      const sniffed = await sniffMimeType(file);
      expect(sniffed).toBe("image/webp");
    });

    it("should detect MP4 files from ftyp box", async () => {
      // MP4 contains 'ftyp' (66 74 79 70)
      const mp4Bytes = [
        0x00,
        0x00,
        0x00,
        0x14,
        0x66,
        0x74,
        0x79,
        0x70, // ftyp
        0x69,
        0x73,
        0x6f,
        0x6d,
      ];
      const file = createFileWithBytes(mp4Bytes, "test.mp4", "video/mp4");
      const sniffed = await sniffMimeType(file);
      expect(sniffed).toBe("video/mp4");
    });

    it("should detect WebM files from magic bytes", async () => {
      // WebM signature: 1A 45 DF A3
      const webmBytes = [0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00];
      const file = createFileWithBytes(webmBytes, "test.webm", "video/webm");
      const sniffed = await sniffMimeType(file);
      expect(sniffed).toBe("video/webm");
    });

    it("should return null for unrecognized files", async () => {
      const unknownBytes = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05];
      const file = createFileWithBytes(
        unknownBytes,
        "test.xyz",
        "application/octet-stream",
      );
      const sniffed = await sniffMimeType(file);
      expect(sniffed).toBeNull();
    });
  });

  describe("validateMimeType", () => {
    it("should accept matching MIME types", async () => {
      const jpegBytes = [0xff, 0xd8, 0xff, 0xe0];
      const file = createFileWithBytes(jpegBytes, "photo.jpg", "image/jpeg");
      const error = await validateMimeType(file, "image/jpeg");
      expect(error).toBeNull();
    });

    it("should reject MIME type mismatches across categories", async () => {
      // File has JPEG magic bytes but claims to be PDF
      const jpegBytes = [0xff, 0xd8, 0xff, 0xe0];
      const file = createFileWithBytes(
        jpegBytes,
        "malicious.pdf",
        "application/pdf",
      );
      const error = await validateMimeType(file, "application/pdf");
      expect(error).not.toBeNull();
      expect(error?.code).toBe("MIME_MISMATCH");
      expect(error?.message).toContain("mismatch");
    });

    it("should reject executable disguised as image", async () => {
      // File has JPEG magic bytes but claims to be executable
      const jpegBytes = [0xff, 0xd8, 0xff, 0xe0];
      const file = createFileWithBytes(
        jpegBytes,
        "virus.exe",
        "application/x-executable",
      );
      const error = await validateMimeType(file, "application/x-executable");
      expect(error).not.toBeNull();
      expect(error?.code).toBe("MIME_MISMATCH");
    });

    it("should allow unrecognized types if declared type is valid", async () => {
      // Can't sniff this, but declared type is allowed
      const unknownBytes = [0x00, 0x01, 0x02, 0x03];
      const file = createFileWithBytes(unknownBytes, "image.jpg", "image/jpeg");
      const error = await validateMimeType(file, "image/jpeg");
      // Should pass because we can't sniff it, but declared type is valid
      expect(error).toBeNull();
    });

    it("should reject unrecognized types if declared type is invalid", async () => {
      const unknownBytes = [0x00, 0x01, 0x02, 0x03];
      const file = createFileWithBytes(
        unknownBytes,
        "script.js",
        "text/javascript",
      );
      const error = await validateMimeType(file, "text/javascript");
      expect(error).not.toBeNull();
      expect(error?.code).toBe("INVALID_TYPE");
    });
  });

  describe("validateFileWithContent", () => {
    it("should pass validation for valid JPEG", async () => {
      const jpegBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
      const file = createFileWithBytes(jpegBytes, "photo.jpg", "image/jpeg");
      const error = await validateFileWithContent(file);
      expect(error).toBeNull();
    });

    it("should reject oversized files", async () => {
      const jpegBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
      // Create a file and override size to simulate oversized file
      const file = createFileWithBytes(jpegBytes, "huge.jpg", "image/jpeg");
      Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
      const error = await validateFileWithContent(file);
      expect(error).not.toBeNull();
      expect(error?.code).toBe("FILE_TOO_LARGE");
    });

    it("should reject invalid file types", async () => {
      const pdfBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF
      const file = createFileWithBytes(
        pdfBytes,
        "document.pdf",
        "application/pdf",
      );
      const error = await validateFileWithContent(file);
      expect(error).not.toBeNull();
      expect(error?.code).toBe("INVALID_TYPE");
    });

    it("should detect MIME type mismatches", async () => {
      // Has JPEG bytes but claims to be PNG
      const jpegBytes = [0xff, 0xd8, 0xff, 0xe0];
      const file = createFileWithBytes(jpegBytes, "fake.png", "image/png");
      const error = await validateFileWithContent(file);
      expect(error).not.toBeNull();
      expect(error?.code).toBe("MIME_MISMATCH");
    });
  });

  describe("getFileCategory", () => {
    it('should return "image" for image types', () => {
      expect(getFileCategory("image/jpeg")).toBe("image");
      expect(getFileCategory("image/png")).toBe("image");
      expect(getFileCategory("image/webp")).toBe("image");
      expect(getFileCategory("image/gif")).toBe("image");
    });

    it('should return "video" for video types', () => {
      expect(getFileCategory("video/mp4")).toBe("video");
      expect(getFileCategory("video/webm")).toBe("video");
      expect(getFileCategory("video/quicktime")).toBe("video");
    });

    it('should return "unknown" for invalid types', () => {
      expect(getFileCategory("application/pdf")).toBe("unknown");
      expect(getFileCategory("text/javascript")).toBe("unknown");
      expect(getFileCategory("")).toBe("unknown");
    });
  });

  describe("getExtensionForMimeType", () => {
    it("should return correct extension for image types", () => {
      expect(getExtensionForMimeType("image/jpeg")).toBe(".jpg");
      expect(getExtensionForMimeType("image/png")).toBe(".png");
      expect(getExtensionForMimeType("image/webp")).toBe(".webp");
      expect(getExtensionForMimeType("image/gif")).toBe(".gif");
    });

    it("should return correct extension for video types", () => {
      expect(getExtensionForMimeType("video/mp4")).toBe(".mp4");
      expect(getExtensionForMimeType("video/webm")).toBe(".webm");
      expect(getExtensionForMimeType("video/quicktime")).toBe(".mov");
    });

    it("should return empty string for unknown types", () => {
      expect(getExtensionForMimeType("application/pdf")).toBe("");
      expect(getExtensionForMimeType("")).toBe("");
    });
  });
});
