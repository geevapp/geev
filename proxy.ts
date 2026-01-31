import { auth } from "./auth";
import { NextResponse } from "next/server";
import { authMiddleware } from "./lib/auth-middleware";

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Log the request
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // Protected routes
  const protectedRoutes = [
    "/feed",
    "/profile",
    "/wallet",
    "/settings",
    "/activity",
    "/api/posts", // All posts routes except GET
    "/api/wallet",
  ];
  
  const publicRoutes = [
    "/",
    "/login",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/session",
    "/api/health",
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  
  const isPublic = publicRoutes.some((route) =>
    pathname === route || (route !== "/" && pathname.startsWith(route)),
  );

  // Handle API routes with custom auth middleware
  if (pathname.startsWith("/api/")) {
    // Allow public API routes
    if (isPublic && !isProtected) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }
    
    // Apply custom auth middleware for protected API routes
    if (isProtected) {
      // Special case: Allow GET requests to /api/posts (public)
      if (pathname.startsWith("/api/posts") && req.method === "GET") {
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        return response;
      }
      
      // Apply custom authentication middleware
      return await authMiddleware(req);
    }
  }

  // If protected route and not logged in → redirect to login
  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }

  // If login page and already logged in → redirect to feed
  if (pathname === "/login" && isLoggedIn) {
    return Response.redirect(new URL("/feed", req.url));
  }

  // CORS headers for API routes
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/:path*"
  ],
};
