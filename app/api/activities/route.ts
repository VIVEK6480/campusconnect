import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ============================================================
// GET ALL ACTIVITIES
// ============================================================

export async function GET() {
  try {
    const activities = await prisma.$queryRaw<
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
    console.error("GET ACTIVITIES ERROR:", error);

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
// CREATE ACTIVITY
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      venue,
      activityDate,
    } = body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

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

    const parsedDate = new Date(activityDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid activity date.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // CREATE ACTIVITY
    // --------------------------------------------------------

    const id = crypto.randomUUID();

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

    // --------------------------------------------------------
    // FETCH CREATED ACTIVITY
    // --------------------------------------------------------

    const activities = await prisma.$queryRaw<
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
        message: "Activity created successfully.",
        activity: activities[0] ?? null,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("CREATE ACTIVITY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create activity.",
      },
      {
        status: 500,
      }
    );
  }
}