import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =====================================
// GET SINGLE NOTIFICATION
// =====================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// =====================================
// UPDATE NOTIFICATION
// =====================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { title, message, isRead } = body;

    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        title: title ?? existingNotification.title,
        message: message ?? existingNotification.message,
        isRead:
          isRead !== undefined
            ? isRead
            : existingNotification.isRead,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification updated successfully",
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update notification",
      },
      { status: 500 }
    );
  }
}

// =====================================
// DELETE NOTIFICATION
// =====================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingNotification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found",
        },
        { status: 404 }
      );
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete notification",
      },
      { status: 500 }
    );
  }
}