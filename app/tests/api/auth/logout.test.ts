import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/(auth)/logout/route";
import { NextRequest } from "next/server";

describe("Logout API Route", () => {
  it("should clear the legacy auth-token and Auth.js session cookies", async () => {
    const request = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);
    const cookies = response.cookies.getAll();

    // Check for legacy auth-token
    const authTokenCookie = cookies.find((c) => c.name === "auth-token");
    expect(authTokenCookie).toBeDefined();
    expect(authTokenCookie?.value).toBe("");
    expect(authTokenCookie?.maxAge).toBe(0);

    // Check for Auth.js cookies
    const sessionTokenCookie = cookies.find(
      (c) => c.name === "next-auth.session-token"
    );
    expect(sessionTokenCookie).toBeDefined();
    expect(sessionTokenCookie?.value).toBe("");
    expect(sessionTokenCookie?.maxAge).toBe(0);

    const secureSessionTokenCookie = cookies.find(
      (c) => c.name === "__Secure-next-auth.session-token"
    );
    expect(secureSessionTokenCookie).toBeDefined();
    expect(secureSessionTokenCookie?.value).toBe("");
    expect(secureSessionTokenCookie?.maxAge).toBe(0);

    // Check for deprecation header
    expect(response.headers.get("Warning")).toContain("299");
    expect(response.headers.get("Warning")).toContain("Deprecated");
  });

  it("should return a success message", async () => {
    const request = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe("Successfully logged out");
  });

  it("should clear cookies even if they are not present in the request", async () => {
    // This is implicitly tested by the first test, but being explicit:
    const request = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
      // No cookies in request
    });

    const response = await POST(request);
    const cookies = response.cookies.getAll();

    // The response should still contain the "clear" instructions (Max-Age=0)
    expect(cookies.some((c) => c.name === "auth-token")).toBe(true);
    expect(cookies.some((c) => c.name === "next-auth.session-token")).toBe(true);
    expect(cookies.some((c) => c.name === "__Secure-next-auth.session-token")).toBe(true);
  });
});
