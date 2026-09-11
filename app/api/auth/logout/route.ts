import { NextResponse } from "next/server";

type LogoutPortal =
  | "admin"
  | "student"
  | "faculty"
  | "";

export async function POST(req: Request) {
  try {
    let portal: LogoutPortal = "";

    try {
      const body = await req.json();

      portal = String(body?.portal || "")
        .trim()
        .toLowerCase() as LogoutPortal;
    } catch {
      // Empty body is allowed.
    }

    const referer = req.headers.get("referer") || "";

    // =========================================================
    // DETERMINE PORTAL FROM REFERER WHEN BODY IS NOT PROVIDED
    // =========================================================

    if (!portal) {
      try {
        const refererUrl = new URL(referer);
        const pathname = refererUrl.pathname;

        if (
          pathname === "/admin/login" ||
          pathname.startsWith("/admin/")
        ) {
          portal = "admin";
        } else if (
          pathname === "/faculty/login" ||
          pathname.startsWith("/faculty/")
        ) {
          portal = "faculty";
        } else if (
          pathname === "/auth/login" ||
          pathname.startsWith("/auth/")
        ) {
          portal = "student";
        }
      } catch {
        // Ignore invalid referer.
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      {
        status: 200,
      }
    );

    // =========================================================
    // COOKIE OPTIONS
    // =========================================================

    const cookieOptions = {
      value: "",
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    };

    // =========================================================
    // PORTAL-SPECIFIC LOGOUT
    // =========================================================

    if (portal === "admin") {
      response.cookies.set({
        name: "token",
        ...cookieOptions,
      });
    } else if (portal === "student") {
      response.cookies.set({
        name: "studentToken",
        ...cookieOptions,
      });
    } else if (portal === "faculty") {
      response.cookies.set({
        name: "facultyToken",
        ...cookieOptions,
      });
    } else {
      // =======================================================
      // FALLBACK
      //
      // Do NOT remove all three cookies here.
      // Keeping unknown logout non-destructive prevents one
      // portal from logging out another portal accidentally.
      // =======================================================
    }

    return response;
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to logout",
      },
      {
        status: 500,
      }
    );
  }
}