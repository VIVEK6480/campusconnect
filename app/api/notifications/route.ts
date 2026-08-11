import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ======================================
// GET ALL NOTIFICATIONS
// ======================================
export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: notifications.length,
        notifications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}

// ======================================
// CREATE NOTIFICATION
// ======================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Title and Message are required",
        },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully",
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}