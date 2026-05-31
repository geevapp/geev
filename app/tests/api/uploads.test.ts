import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/uploads/route";
import { parseResponse } from "../helpers/api";
import { createTestUser } from "../helpers/db";
import { prisma } from "@/lib/prisma";

// Mock S3 upload
vi.mock("@/lib/storage", () => ({
  uploadToS3: vi.fn().mockResolvedValue({
    url: "https://cdn.example.com/uploads/test-file.jpg",
    key: "uploads/test-file.jpg",
  }),
}));

describe("Uploads API", () => {
  let testUser: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    if (process.env.MOCK_DB === "true") {
      testUser = {
        id: "user_123",
        walletAddress: "GTEST123",
        name: "Test User",
        bio: "Test bio",
        xp: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      testUser = await createTestUser();
    }

    // Mock authentication
    vi.spyOn(await import("@/lib/auth"), "getCurrentUser").mockResolvedValue(
      testUser,
    );
  });

  describe("POST /api/uploads", () => {
    it("should reject unauthenticated requests", async () => {
      vi.spyOn(await import("@/lib/auth"), "getCurrentUser").mockResolvedValue(
        null,
      );

      const formData = new FormData();
      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject requests with no file", async () => {
      const formData = new FormData();
      formData.append("folder", "images");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("No file provided");
    });

    it("should reject invalid file types (PDF)", async () => {
      const formData = new FormData();
      const pdfBlob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
      formData.append("file", pdfBlob, "test.pdf");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toContain("not allowed");
    });

    it("should reject invalid file types (executable)", async () => {
      const formData = new FormData();
      const exeBlob = new Blob(["MZ"], { type: "application/x-executable" });
      formData.append("file", exeBlob, "malware.exe");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toContain("not allowed");
    });

    it("should reject oversized images", async () => {
      const formData = new FormData();
      // Create a blob larger than 10 MB
      const oversizedBlob = new Blob([new ArrayBuffer(11 * 1024 * 1024)], {
        type: "image/jpeg",
      });
      formData.append("file", oversizedBlob, "huge.jpg");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toContain("10 MB");
    });

    it("should reject oversized videos", async () => {
      const formData = new FormData();
      // Create a blob larger than 100 MB
      const oversizedBlob = new Blob([new ArrayBuffer(101 * 1024 * 1024)], {
        type: "video/mp4",
      });
      formData.append("file", oversizedBlob, "huge.mp4");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toContain("100 MB");
    });

    it("should accept valid JPEG image", async () => {
      const formData = new FormData();
      const jpegBlob = new Blob([new ArrayBuffer(1024)], {
        type: "image/jpeg",
      });
      formData.append("file", jpegBlob, "photo.jpg");
      formData.append("folder", "images");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("url");
      expect(data.data).toHaveProperty("key");
      expect(data.message).toBe("upload successful");
    });

    it("should accept valid PNG image", async () => {
      const formData = new FormData();
      const pngBlob = new Blob([new ArrayBuffer(2048)], { type: "image/png" });
      formData.append("file", pngBlob, "screenshot.png");
      formData.append("folder", "images");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("url");
      expect(data.data).toHaveProperty("key");
    });

    it("should accept valid WebP image", async () => {
      const formData = new FormData();
      const webpBlob = new Blob([new ArrayBuffer(1500)], {
        type: "image/webp",
      });
      formData.append("file", webpBlob, "image.webp");
      formData.append("folder", "images");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("url");
    });

    it("should accept valid GIF image", async () => {
      const formData = new FormData();
      const gifBlob = new Blob([new ArrayBuffer(3000)], { type: "image/gif" });
      formData.append("file", gifBlob, "animation.gif");
      formData.append("folder", "images");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("url");
    });

    it("should accept valid MP4 video", async () => {
      const formData = new FormData();
      const mp4Blob = new Blob([new ArrayBuffer(50 * 1024)], {
        type: "video/mp4",
      });
      formData.append("file", mp4Blob, "video.mp4");
      formData.append("folder", "videos");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("url");
      expect(data.data).toHaveProperty("key");
    });

    it("should accept valid WebM video", async () => {
      const formData = new FormData();
      const webmBlob = new Blob([new ArrayBuffer(40 * 1024)], {
        type: "video/webm",
      });
      formData.append("file", webmBlob, "clip.webm");
      formData.append("folder", "videos");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("url");
    });

    it("should accept valid MOV video", async () => {
      const formData = new FormData();
      const movBlob = new Blob([new ArrayBuffer(60 * 1024)], {
        type: "video/quicktime",
      });
      formData.append("file", movBlob, "movie.mov");
      formData.append("folder", "videos");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty("url");
    });

    it("should use default folder when not specified", async () => {
      const formData = new FormData();
      const jpegBlob = new Blob([new ArrayBuffer(1024)], {
        type: "image/jpeg",
      });
      formData.append("file", jpegBlob, "photo.jpg");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle S3 upload errors gracefully", async () => {
      const { uploadToS3 } = await import("@/lib/storage");
      vi.mocked(uploadToS3).mockRejectedValueOnce(
        new Error("S3 connection failed"),
      );

      const formData = new FormData();
      const jpegBlob = new Blob([new ArrayBuffer(1024)], {
        type: "image/jpeg",
      });
      formData.append("file", jpegBlob, "photo.jpg");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(502);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Upload failed. Please try again.");
    });

    it("should return predictable response structure for frontend", async () => {
      const formData = new FormData();
      const jpegBlob = new Blob([new ArrayBuffer(1024)], {
        type: "image/jpeg",
      });
      formData.append("file", jpegBlob, "photo.jpg");
      formData.append("folder", "images");

      const request = new NextRequest("http://localhost:3000/api/uploads", {
        method: "POST",
        body: formData,
      });

      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      // Verify response structure is predictable
      expect(data).toHaveProperty("success");
      expect(typeof data.success).toBe("boolean");

      if (data.success) {
        expect(data).toHaveProperty("data");
        expect(data.data).toHaveProperty("url");
        expect(data.data).toHaveProperty("key");
        expect(data.data).toHaveProperty("type");
        expect(data.data).toHaveProperty("category");
        expect(data.data).toHaveProperty("size");
        expect(data.data).toHaveProperty("name");
        expect(typeof data.data.url).toBe("string");
        expect(typeof data.data.key).toBe("string");
        expect(typeof data.data.type).toBe("string");
        expect(typeof data.data.category).toBe("string");
        expect(typeof data.data.size).toBe("number");
        expect(typeof data.data.name).toBe("string");
        expect(["image", "video"]).toContain(data.data.category);
      } else {
        expect(data).toHaveProperty("error");
        expect(typeof data.error).toBe("string");
      }
    });
  });
});
