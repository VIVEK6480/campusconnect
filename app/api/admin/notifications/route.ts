import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type NotificationAudience = "ALL" | "FACULTY";

type NotificationBody = {
  title?: unknown;
  message?: unknown;
  audience?: unknown;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: CACHE_HEADERS,
    },
  );
}

function getToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") || "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    const bearer = authorization.slice(7).trim();

    if (bearer) {
      return bearer;
    }
  }

  return request.cookies.get("token")?.value || "";
}

function authenticateAdmin(request: NextRequest) {
  const token = getToken(request);

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      message: "Administrator authentication is required.",
    };
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return {
      ok: false as const,
      status: 500,
      message: "JWT_SECRET is not configured.",
    };
  }

  try {
    const decoded = jwt.verify(
      token,
      secret,
    ) as TokenPayload;

    const role = String(
      decoded.role || "",
    ).toUpperCase();

    if (
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return {
        ok: false as const,
        status: 403,
        message: "Administrator access required.",
      };
    }

    return {
      ok: true as const,
      decoded,
    };
  } catch {
    return {
      ok: false as const,
      status: 401,
      message: "Invalid or expired administrator session.",
    };
  }
}

function parseAudience(value: unknown): NotificationAudience | null {
  const normalized = String(value ?? "ALL")
    .trim()
    .toUpperCase();

  if (
    normalized !== "ALL" &&
    normalized !== "FACULTY"
  ) {
    return null;
  }

  return normalized as NotificationAudience;
}

/*
 * GET
 * Admin notification management list.
 *
 * Admin sees every notification, including the selected audience.
 */
export async function GET(request: NextRequest) {
  const auth = authenticateAdmin(request);

  if (!auth.ok) {
    return jsonError(
      auth.message,
      auth.status,
    );
  }

  try {
    const notifications =
      await prisma.notification.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          message: true,
          audience: true,
          isRead: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        notifications,
        count: notifications.length,
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN GET NOTIFICATIONS ERROR:",
      error,
    );

    return jsonError(
      "Failed to fetch notifications.",
      500,
    );
  }
}

/*
 * POST
 * Create a notification for:
 * - ALL       -> Student + Faculty
 * - FACULTY   -> Faculty only
 */
export async function POST(request: NextRequest) {
  const auth = authenticateAdmin(request);

  if (!auth.ok) {
    return jsonError(
      auth.message,
      auth.status,
    );
  }

  try {
    const body =
      (await request.json()) as NotificationBody;

    const title = String(
      body?.title ?? "",
    ).trim();

    const message = String(
      body?.message ?? "",
    ).trim();

    const audience = parseAudience(
      body?.audience,
    );

    if (!title) {
      return jsonError(
        "Notification title is required.",
        400,
      );
    }

    if (!message) {
      return jsonError(
        "Notification message is required.",
        400,
      );
    }

    if (!audience) {
      return jsonError(
        "Invalid notification audience.",
        400,
      );
    }

    if (title.length > 150) {
      return jsonError(
        "Notification title cannot exceed 150 characters.",
        400,
      );
    }

    if (message.length > 2000) {
      return jsonError(
        "Notification message cannot exceed 2000 characters.",
        400,
      );
    }

    const notification =
      await prisma.notification.create({
        data: {
          title,
          message,
          audience,
          isRead: false,
        },
        select: {
          id: true,
          title: true,
          message: true,
          audience: true,
          isRead: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          audience === "FACULTY"
            ? "Faculty-only notification created successfully."
            : "Notification created successfully for Student and Faculty portals.",
        notification,
      },
      {
        status: 201,
        headers: CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN CREATE NOTIFICATION ERROR:",
      error,
    );

    return jsonError(
      "Failed to create notification.",
      500,
    );
  }
}

/*
 * DELETE
 * Admin can remove a previously created notification.
 */
export async function DELETE(request: NextRequest) {
  const auth = authenticateAdmin(request);

  if (!auth.ok) {
    return jsonError(
      auth.message,
      auth.status,
    );
  }

  const id =
    request.nextUrl.searchParams
      .get("id")
      ?.trim();

  if (!id) {
    return jsonError(
      "Notification id is required.",
      400,
    );
  }

  try {
    const existing =
      await prisma.notification.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return jsonError(
        "Notification not found.",
        404,
      );
    }

    await prisma.notification.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Notification deleted successfully.",
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN DELETE NOTIFICATION ERROR:",
      error,
    );

    return jsonError(
      "Failed to delete notification.",
      500,
    );
  }
}
