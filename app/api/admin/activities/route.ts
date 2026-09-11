import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  adminId?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
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
    }
  );
}

function getAdminAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value || "";

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized. Admin session not found.",
    } as const;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return {
      ok: false,
      status: 500,
      message: "JWT_SECRET is not configured.",
    } as const;
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    const role = String(decoded.role || "")
      .trim()
      .toUpperCase();

    if (
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN" &&
      decoded.isAdmin !== true &&
      decoded.isSuperAdmin !== true
    ) {
      return {
        ok: false,
        status: 403,
        message: "Admin access required.",
      } as const;
    }

    return {
      ok: true,
      decoded,
    } as const;
  } catch (error) {
    console.error("ADMIN ACTIVITIES JWT VERIFY ERROR:", error);

    return {
      ok: false,
      status: 401,
      message: "Invalid or expired admin session.",
    } as const;
  }
}

function parseActivityDate(value: unknown) {
  const dateString = String(value ?? "").trim();

  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();

  try {
    if (id) {
      const activity = await prisma.activity.findUnique({
        where: {
          id,
        },
      });

      if (!activity) {
        return jsonError("Activity not found.", 404);
      }

      return NextResponse.json(
        {
          success: true,
          activity,
        },
        {
          status: 200,
          headers: CACHE_HEADERS,
        }
      );
    }

    const activities = await prisma.activity.findMany({
      orderBy: {
        activityDate: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        activities,
        count: activities.length,
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("GET ADMIN ACTIVITIES ERROR:", error);

    return jsonError("Failed to fetch activities.", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = getAdminAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  try {
    const body = await request.json();

    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const venue = String(body?.venue || "").trim();
    const activityDate = parseActivityDate(body?.activityDate);

    if (!title) {
      return jsonError("Activity title is required.", 400);
    }

    if (!description) {
      return jsonError("Activity description is required.", 400);
    }

    if (!venue) {
      return jsonError("Activity venue is required.", 400);
    }

    if (!activityDate) {
      return jsonError("A valid activity date and time are required.", 400);
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        venue,
        activityDate,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Activity created successfully.",
        activity,
      },
      {
        status: 201,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("CREATE ADMIN ACTIVITY ERROR:", error);

    return jsonError("Failed to create activity.", 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = getAdminAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("Activity id is required.", 400);
  }

  try {
    const body = await request.json();

    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const venue = String(body?.venue || "").trim();
    const activityDate = parseActivityDate(body?.activityDate);

    if (!title) {
      return jsonError("Activity title is required.", 400);
    }

    if (!description) {
      return jsonError("Activity description is required.", 400);
    }

    if (!venue) {
      return jsonError("Activity venue is required.", 400);
    }

    if (!activityDate) {
      return jsonError("A valid activity date and time are required.", 400);
    }

    const existingActivity = await prisma.activity.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingActivity) {
      return jsonError("Activity not found.", 404);
    }

    const activity = await prisma.activity.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        venue,
        activityDate,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Activity updated successfully.",
        activity,
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("UPDATE ADMIN ACTIVITY ERROR:", error);

    return jsonError("Failed to update activity.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = getAdminAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("Activity id is required.", 400);
  }

  try {
    const existingActivity = await prisma.activity.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!existingActivity) {
      return jsonError("Activity not found.", 404);
    }

    await prisma.activity.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Activity "${existingActivity.title}" deleted successfully.`,
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error("DELETE ADMIN ACTIVITY ERROR:", error);

    return jsonError("Failed to delete activity.", 500);
  }
}
