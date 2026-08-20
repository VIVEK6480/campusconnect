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