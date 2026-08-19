import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // =========================================================
  // PUBLIC AUTHENTICATION APIs
  // =========================================================

  const publicApiRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",

    // Forgot password
    "/api/auth/forgot-password",
    "/api/auth/student-forgot-password",
    "/api/auth/faculty/forgot-password",

    // Password reset
    "/api/auth/reset-password",
    "/api/auth/student-reset-password",
    "/api/auth/faculty/reset-password",

    // Admin login
    "/api/admin/login",
  ];

  const isPublicApiRoute =
    publicApiRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    );

  // =========================================================
  // PUBLIC API
  // =========================================================

  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // =========================================================
  // FACULTY APPROVAL API
  // =========================================================

  const isFacultyApprovalApi =
    pathname ===
      "/api/admin/approvals/Faculty" ||
    pathname.startsWith(
      "/api/admin/approvals/Faculty/"
    );

  if (isFacultyApprovalApi) {
    return NextResponse.next();
  }

  // =========================================================
  // STUDENT APPROVAL API
  // =========================================================

  const isStudentApprovalApi =
    pathname ===
      "/api/admin/approvals/students" ||
    pathname.startsWith(
      "/api/admin/approvals/students/"
    );

  if (isStudentApprovalApi) {
    return NextResponse.next();
  }

  // =========================================================
  // AUTHORIZATION HEADER
  // =========================================================

  const authHeader =
    req.headers.get("authorization");

  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader
      .substring(7)
      .trim();
  }

  // =========================================================
  // HTTP-ONLY COOKIE
  // =========================================================

  if (!token) {
    token = req.cookies.get("token")?.value;
  }

  // =========================================================
  // PROTECTED API ROUTES
  // =========================================================

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

// =========================================================
// API MATCHER
// =========================================================

export const config = {
  matcher: ["/api/:path*"],
};