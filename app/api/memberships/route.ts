import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==============================
// GET ALL MEMBERSHIPS
// ==============================
export async function GET() {
  try {
    const memberships = await prisma.membership.findMany({
      include: {
        user: true,
        club: true,
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        memberships,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET MEMBERSHIPS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch memberships",
      },
      {
        status: 500,
      }
    );
  }
}

// ==============================
// JOIN CLUB
// ==============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { userId, clubId } = body;

    if (!userId || !clubId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and Club ID are required",
        },
        {
          status: 400,
        }
      );
    }

    // Check User
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // Check Club
    const club = await prisma.club.findUnique({
      where: {
        id: clubId,
      },
    });

    if (!club) {
      return NextResponse.json(
        {
          success: false,
          message: "Club not found",
        },
        {
          status: 404,
        }
      );
    }

    // Check Existing Membership
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId,
        clubId,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          message: "User already joined this club",
        },
        {
          status: 409,
        }
      );
    }

    // Create Membership
    const membership = await prisma.membership.create({
      data: {
        userId,
        clubId,
      },
      include: {
        user: true,
        club: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club joined successfully",
        membership,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("JOIN CLUB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown Error",
      },
      {
        status: 500,
      }
    );
  }
}