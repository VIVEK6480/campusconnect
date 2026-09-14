import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  campusUserId?: string;
  role?: string;
  email?: string;
};

type NotificationBody = {
  title?: unknown;
  message?: unknown;
  audience?: unknown;
};

type NotificationAudience =
  | "STUDENT"
  | "ADMIN";

const CACHE_HEADERS = {
  "Cache-Control":
    "private, no-store, max-age=0",
};

/* =========================================================
   GET REQUEST TOKEN
========================================================= */

function getRequestToken(
  request: NextRequest
): string {
  const authorization =
    request.headers.get("authorization") || "";

  if (
    authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    const bearer =
      authorization
        .slice(7)
        .trim();

    if (bearer) {
      return bearer;
    }
  }

  /*
   * Faculty login uses facultyToken.
   */
  const facultyToken =
    request.cookies.get(
      "facultyToken"
    )?.value || "";

  if (facultyToken) {
    return facultyToken;
  }

  /*
   * Existing CampusConnect routes also
   * support the normal token cookie.
   */
  return (
    request.cookies.get(
      "token"
    )?.value || ""
  );
}

/* =========================================================
   GET FACULTY ID
========================================================= */

function getFacultyId(
  request: NextRequest
): string | null {
  const token =
    getRequestToken(request);

  if (
    !token ||
    !process.env.JWT_SECRET
  ) {
    return null;
  }

  try {
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      ) as TokenPayload;

    const role = String(
      decoded.role ?? ""
    )
      .trim()
      .toUpperCase();

    /*
     * Only reject an explicitly different role.
     * Some older tokens may not carry the role field,
     * so the database verification below remains the
     * final authority.
     */
    if (
      role &&
      role !== "FACULTY"
    ) {
      console.error(
        "FACULTY NOTIFICATION ROLE CHECK FAILED:",
        {
          role,
          id: decoded.id,
          userId: decoded.userId,
          facultyId: decoded.facultyId,
          email: decoded.email,
        }
      );

      return null;
    }

    return (
      (typeof decoded.id === "string" &&
        decoded.id) ||
      (typeof decoded.userId === "string" &&
        decoded.userId) ||
      (typeof decoded.facultyId === "string" &&
        decoded.facultyId) ||
      (typeof decoded.sub === "string" &&
        decoded.sub) ||
      null
    );
  } catch (error) {
    console.error(
      "FACULTY NOTIFICATION JWT ERROR:",
      error
    );

    return null;
  }
}

/* =========================================================
   REQUIRE FACULTY
========================================================= */

async function requireFaculty(
  request: NextRequest
) {
  const facultyId =
    getFacultyId(request);

  if (!facultyId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Faculty authentication is required. Please login again.",
          notifications: [],
        },
        {
          status: 401,
          headers: CACHE_HEADERS,
        }
      ),
    };
  }

  const faculty =
    await prisma.user.findUnique({
      where: {
        id: facultyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

  if (
    !faculty ||
    String(faculty.role)
      .trim()
      .toUpperCase() !==
      "FACULTY"
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Faculty account not found.",
          notifications: [],
        },
        {
          status: 404,
          headers: CACHE_HEADERS,
        }
      ),
    };
  }

  return {
    ok: true as const,
    faculty,
  };
}

/* =========================================================
   ERROR RESPONSE
========================================================= */

function jsonError(
  message: string,
  status: number
) {
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

/* =========================================================
   AUDIENCE
========================================================= */

function parseAudience(
  value: unknown
): NotificationAudience | null {
  const normalized =
    String(value ?? "")
      .trim()
      .toUpperCase();

  if (
    normalized !== "STUDENT" &&
    normalized !== "ADMIN"
  ) {
    return null;
  }

  return normalized as NotificationAudience;
}

/* =========================================================
   GET NOTIFICATIONS
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireFaculty(request);

    if (auth.response) {
      return auth.response;
    }

    const facultyId =
      auth.faculty.id;

    const notifications =
      await prisma.notification.findMany({
        where: {
          OR: [
            /*
             * Admin broadcasts to everyone.
             */
            {
              audience: "ALL",
            },

            /*
             * Admin notifications for Faculty.
             */
            {
              audience: "FACULTY",
            },

            /*
             * Faculty can see their own
             * outgoing notifications.
             */
            {
              senderRole: "FACULTY",
              senderId: facultyId,
            },
          ],
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          title: true,
          message: true,
          audience: true,
          senderRole: true,
          senderId: true,
          isRead: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        count: notifications.length,
        notifications,
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "FACULTY GET NOTIFICATIONS ERROR:",
      error
    );

    return jsonError(
      "Failed to fetch faculty notifications.",
      500
    );
  }
}

/* =========================================================
   POST NOTIFICATION
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await requireFaculty(request);

    if (auth.response) {
      return auth.response;
    }

    const body =
      (await request.json()) as NotificationBody;

    const title =
      String(
        body?.title ?? ""
      ).trim();

    const message =
      String(
        body?.message ?? ""
      ).trim();

    const audience =
      parseAudience(
        body?.audience
      );

    if (!title) {
      return jsonError(
        "Notification title is required.",
        400
      );
    }

    if (!message) {
      return jsonError(
        "Notification message is required.",
        400
      );
    }

    if (!audience) {
      return jsonError(
        "Notification audience must be STUDENT or ADMIN.",
        400
      );
    }

    if (title.length > 150) {
      return jsonError(
        "Notification title cannot exceed 150 characters.",
        400
      );
    }

    if (message.length > 2000) {
      return jsonError(
        "Notification message cannot exceed 2000 characters.",
        400
      );
    }

    const notification =
      await prisma.notification.create({
        data: {
          title,
          message,
          audience,

          senderRole:
            "FACULTY",

          senderId:
            auth.faculty.id,

          isRead: false,
        },

        select: {
          id: true,
          title: true,
          message: true,
          audience: true,
          senderRole: true,
          senderId: true,
          isRead: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          audience === "STUDENT"
            ? "Notification sent successfully to Students."
            : "Notification sent successfully to Admin.",
        notification,
      },
      {
        status: 201,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    console.error(
      "FACULTY CREATE NOTIFICATION ERROR:",
      error
    );

    return jsonError(
      "Failed to create faculty notification.",
      500
    );
  }
}

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth =
      await requireFaculty(request);

    if (auth.response) {
      return auth.response;
    }

    const id =
      request.nextUrl
        .searchParams
        .get("id")
        ?.trim();

    if (!id) {
      return jsonError(
        "Notification id is required.",
        400
      );
    }

    const existing =
      await prisma.notification.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          senderRole: true,
          senderId: true,
        },
      });

    if (!existing) {
      return jsonError(
        "Notification not found.",
        404
      );
    }

    /*
     * Faculty can delete only notifications
     * created by the same faculty account.
     */
    if (
      existing.senderRole !==
        "FACULTY" ||
      existing.senderId !==
        auth.faculty.id
    ) {
      return jsonError(
        "You can delete only notifications sent from your own Faculty account.",
        403
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
      }
    );
  } catch (error) {
    console.error(
      "FACULTY DELETE NOTIFICATION ERROR:",
      error
    );

    return jsonError(
      "Failed to delete faculty notification.",
      500
    );
  }
}