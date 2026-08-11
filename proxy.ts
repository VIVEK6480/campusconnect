import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  /*
   * =========================================
   * PUBLIC AUTHENTICATION APIs
   * =========================================
   *
   * These routes must work without an existing
   * login token because they are used for:
   *
   * - Login
   * - Registration
   * - Forgot password
   * - Password reset
   */

  const publicApiRoutes = [
    // Normal authentication
    "/api/auth/login",
    "/api/auth/register",

    // Forgot password
    "/api/auth/forgot-password",
    "/api/auth/student-forgot-password",

    // Password reset
    "/api/auth/reset-password",
    "/api/auth/student-reset-password",

    // Admin login
    "/api/admin/login",
  ];

  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  /*
   * =========================================
   * ALLOW PUBLIC AUTH APIs
   * =========================================
   */

  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  /*
   * =========================================
   * CHECK AUTHORIZATION HEADER
   * =========================================
   */

  const authHeader = req.headers.get("authorization");

  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  /*
   * =========================================
   * CHECK HTTP-ONLY COOKIE
   * =========================================
   */

  if (!token) {
    token = req.cookies.get("token")?.value;
  }

  /*
   * =========================================
   * PROTECT OTHER API ROUTES
   * =========================================
   */

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};