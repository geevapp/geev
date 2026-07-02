import { test, expect, describe, vi, beforeEach } from "vitest";

describe("JWT Configuration Fail-Fast", () => {
  beforeEach(() => {
    vi.resetModules(); // Ensure we get a fresh import of jwt.ts each time
  });

  test("should throw an Error on import if NEXTAUTH_SECRET is missing", async () => {
    // Explicitly unset the secret to simulate missing production config
    vi.stubEnv("NEXTAUTH_SECRET", "");
    
    await expect(async () => {
      await import("@/lib/jwt");
    }).rejects.toThrow("NEXTAUTH_SECRET is missing. It must be set in production config.");
  });

  test("should successfully import if NEXTAUTH_SECRET is provided", async () => {
    // Provide a valid secret
    vi.stubEnv("NEXTAUTH_SECRET", "valid-secret-for-test");
    
    const jwt = await import("@/lib/jwt");
    expect(jwt.createToken).toBeDefined();
    expect(jwt.verifyToken).toBeDefined();
  });
});
