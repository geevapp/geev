import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
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
  ];
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

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
