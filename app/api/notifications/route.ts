import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type NotificationAudience = "ALL" | "FACULTY";

type AuthResult = {
  authenticated: boolean;
  role: string | null;
};

function isAuthenticated(
  request: NextRequest,
  allowedRoles: string[]
): AuthResult {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "JWT_SECRET is missing from environment variables."
    );

    return {
      authenticated: false,
      role: null,
    };
  }

  const tokens: string[] = [];

  const authorization =
    request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const bearerToken =
      authorization.slice(7).trim();

    if (bearerToken) {
      tokens.push(bearerToken);
    }
  }

  const studentToken =
    request.cookies.get(
      "studentToken"
    )?.value;

  const facultyToken =
    request.cookies.get(
      "facultyToken"
    )?.value;

  const adminToken =
    request.cookies.get("token")?.value;

  if (studentToken) {
    tokens.push(studentToken);
  }

  if (facultyToken) {
    tokens.push(facultyToken);
  }

  if (adminToken) {
    tokens.push(adminToken);
  }

  for (const token of tokens) {
    try {
      const decoded = jwt.verify(
        token,
        secret
      ) as TokenPayload;

      const role = String(
        decoded.role ?? ""
      ).toUpperCase();

      if (allowedRoles.includes(role)) {
        return {
          authenticated: true,
          role,
        };
      }
    } catch {
      continue;
    }
  }

  return {
    authenticated: false,
    role: null,
  };
}

function getAudience(
  value: unknown
): NotificationAudience | null {
  const audience = String(
    value ?? "ALL"
  )
    .trim()
    .toUpperCase();

  if (
    audience !== "ALL" &&
    audience !== "FACULTY"
  ) {
    return null;
  }

  return audience as NotificationAudience;
}

// ======================================
// GET ALL NOTIFICATIONS
// ======================================

export async function GET(
  request: NextRequest
) {
  try {
    const auth = isAuthenticated(
      request,
      [
        "ADMIN",
        "SUPER_ADMIN",
        "STUDENT",
        "FACULTY",
      ]
    );

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    let whereCondition = {};

    /*
     * STUDENT:
     * Only notifications sent to everyone.
     */
    if (auth.role === "STUDENT") {
      whereCondition = {
        audience: "ALL",
      };
    }

    /*
     * FACULTY:
     * Can see both:
     * - ALL
     * - FACULTY
     */
    else if (
      auth.role === "FACULTY"
    ) {
      whereCondition = {
        audience: {
          in: [
            "ALL",
            "FACULTY",
          ],
        },
      };
    }

    /*
     * ADMIN / SUPER_ADMIN:
     * Can see all notifications.
     */
    else {
      whereCondition = {};
    }

    const notifications =
      await prisma.notification.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        count:
          notifications.length,
        notifications,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET NOTIFICATIONS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch notifications",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================
// CREATE NOTIFICATION - ADMIN ONLY
// ======================================

export async function POST(
  req: NextRequest
) {
  try {
    const auth = isAuthenticated(
      req,
      [
        "ADMIN",
        "SUPER_ADMIN",
      ]
    );

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const {
      title,
      message,
      audience,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title and Message are required",
        },
        {
          status: 400,
        }
      );
    }

    const selectedAudience =
      getAudience(audience);

    if (!selectedAudience) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid notification audience. Use ALL or FACULTY.",
        },
        {
          status: 400,
        }
      );
    }

    const notification =
      await prisma.notification.create({
        data: {
          title:
            String(title).trim(),
          message:
            String(message).trim(),
          audience:
            selectedAudience,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          selectedAudience ===
          "FACULTY"
            ? "Faculty notification created successfully"
            : "Notification created successfully for Students and Faculty",
        notification,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE NOTIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================
// DELETE NOTIFICATION - ADMIN ONLY
// ======================================

export async function DELETE(
  req: NextRequest
) {
  try {
    const auth = isAuthenticated(
      req,
      [
        "ADMIN",
        "SUPER_ADMIN",
      ]
    );

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const existingNotification =
      await prisma.notification.findUnique(
        {
          where: {
            id,
          },
        }
      );

    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification not found",
        },
        {
          status: 404,
        }
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
          "Notification deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE NOTIFICATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete notification",
      },
      {
        status: 500,
      }
    );
  }
}