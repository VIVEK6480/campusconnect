import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =========================================================
// GET ALL PENDING APPROVALS
// =========================================================

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        approvalStatus: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: users.length,
        users,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET APPROVALS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch pending approvals",
      },
      {
        status: 500,
      }
    );
  }
}