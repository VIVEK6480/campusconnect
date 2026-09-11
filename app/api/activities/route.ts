import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

function isAuthenticated(
  request: NextRequest,
  allowedRoles: string[]
): boolean {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "JWT_SECRET is missing from environment variables."
    );
    return false;
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
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

// ============================================================
// GET ALL ACTIVITIES
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    const authenticated =
      isAuthenticated(request, [
        "ADMIN",
        "SUPER_ADMIN",
        "STUDENT",
        "FACULTY",
      ]);

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
          activities: [],
        },
        {
          status: 401,
        }
      );
    }

    const activities =
      await prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          description: string;
          venue: string;
          activityDate: Date;
          createdAt: Date;
          updatedAt: Date;
        }>
      >`
        SELECT 
          "id",
          "title",
          "description",
          "venue",
          "activityDate",
          "createdAt",
          "updatedAt"
        FROM "Activity"
        ORDER BY "activityDate" ASC
      `;

    return NextResponse.json(
      {
        success: true,
        count: activities.length,
        activities,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET ACTIVITIES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch activities",
        activities: [],
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// CREATE ACTIVITY - ADMIN ONLY
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
    const authenticated =
      isAuthenticated(request, [
        "ADMIN",
        "SUPER_ADMIN",
      ]);

    if (!authenticated) {
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
      await request.json();

    const {
      title,
      description,
      venue,
      activityDate,
    } = body;

    if (
      !title ||
      !description ||
      !venue ||
      !activityDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title, description, venue and activity date are required.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedDate =
      new Date(activityDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid activity date.",
        },
        {
          status: 400,
        }
      );
    }

    const id =
      crypto.randomUUID();

    await prisma.$executeRaw`
      INSERT INTO "Activity"
      (
        "id",
        "title",
        "description",
        "venue",
        "activityDate",
        "createdAt",
        "updatedAt"
      )
      VALUES
      (
        ${id},
        ${String(title).trim()},
        ${String(description).trim()},
        ${String(venue).trim()},
        ${parsedDate},
        NOW(),
        NOW()
      )
    `;

    const activities =
      await prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          description: string;
          venue: string;
          activityDate: Date;
          createdAt: Date;
          updatedAt: Date;
        }>
      >`
        SELECT
          "id",
          "title",
          "description",
          "venue",
          "activityDate",
          "createdAt",
          "updatedAt"
        FROM "Activity"
        WHERE "id" = ${id}
        LIMIT 1
      `;

    return NextResponse.json(
      {
        success: true,
        message:
          "Activity created successfully.",
        activity:
          activities[0] ?? null,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE ACTIVITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create activity.",
      },
      {
        status: 500,
      }
    );
  }
}