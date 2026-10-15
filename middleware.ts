import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./lib/auth/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("hz_session")?.value;
  const isSessionValid = token ? !!verifySessionToken(token) : false;

  const isAuthRoute = pathname.startsWith("/login");
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/settings");

  // Root redirect
  if (pathname === "/") {
    if (isSessionValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If trying to access login while already logged in
  if (isAuthRoute && isSessionValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If trying to access protected route while unauthenticated
  if (isProtectedRoute && !isSessionValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/products/:path*",
    "/quotations/:path*",
    "/settings/:path*",
  ],
};
