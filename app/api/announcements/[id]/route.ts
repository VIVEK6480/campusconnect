import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==============================
// GET SINGLE ANNOUNCEMENT
// ==============================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        club: true,
      },
    });

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        announcement,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET ANNOUNCEMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// ==============================
// UPDATE ANNOUNCEMENT
// ==============================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { title, content } = body;

    const existingAnnouncement =
      await prisma.announcement.findUnique({
        where: { id },
      });

    if (!existingAnnouncement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found",
        },
        { status: 404 }
      );
    }

    const announcement =
      await prisma.announcement.update({
        where: { id },
        data: {
          title,
          content,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message: "Announcement updated successfully",
        announcement,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE ANNOUNCEMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update announcement",
      },
      { status: 500 }
    );
  }
}

// ==============================
// DELETE ANNOUNCEMENT
// ==============================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingAnnouncement =
      await prisma.announcement.findUnique({
        where: { id },
      });

    if (!existingAnnouncement) {
      return NextResponse.json(
        {
          success: false,
          message: "Announcement not found",
        },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Announcement deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE ANNOUNCEMENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete announcement",
      },
      { status: 500 }
    );
  }
}