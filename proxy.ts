import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

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
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
