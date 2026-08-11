import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =============================
// GET SINGLE ATTENDANCE
// =============================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        user: true,
        event: {
          include: {
            club: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        attendance,
      },
      { status: 200 }
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

// =============================
// UPDATE ATTENDANCE
// =============================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { status } = body;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance not found",
        },
        { status: 404 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance updated successfully",
        attendance: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update attendance",
      },
      { status: 500 }
    );
  }
}

// =============================
// DELETE ATTENDANCE
// =============================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance not found",
        },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete attendance",
      },
      { status: 500 }
    );
  }
}