import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================
// GET ALL ATTENDANCE
// ======================
export async function GET() {
  try {
    const attendance = await prisma.attendance.findMany({
      include: {
        user: true,
        event: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        markedAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: attendance.length,
        attendance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance",
      },
      { status: 500 }
    );
  }
}

// ======================
// MARK ATTENDANCE
// ======================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { userId, eventId, status } = body;

    if (!userId || !eventId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and Event ID are required.",
        },
        { status: 400 }
      );
    }

    // Check User
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Check Event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        { status: 404 }
      );
    }

    // Already Marked?
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance already marked.",
        },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        status: status || "Present",
        user: {
          connect: {
            id: userId,
          },
        },
        event: {
          connect: {
            id: eventId,
          },
        },
      },
      include: {
        user: true,
        event: {
          include: {
            club: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance marked successfully.",
        attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}