import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==============================
// GET ALL ANNOUNCEMENTS
// ==============================
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        club: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        announcements,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET ANNOUNCEMENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch announcements",
      },
      { status: 500 }
    );
  }
}

// ==============================
// CREATE ANNOUNCEMENT
// ==============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { title, content, clubId } = body;

    if (!title || !content || !clubId) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, Content and Club ID are required",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        club: {
          connect: {
            id: club.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Announcement created successfully",
        announcement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ANNOUNCEMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}