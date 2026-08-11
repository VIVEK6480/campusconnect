import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==============================
// GET SINGLE MEMBERSHIP
// ==============================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        user: true,
        club: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        membership,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET MEMBERSHIP ERROR:", error);

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
// DELETE MEMBERSHIP (Leave Club)
// ==============================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const membership = await prisma.membership.findUnique({
      where: { id },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership not found",
        },
        { status: 404 }
      );
    }

    await prisma.membership.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Membership deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE MEMBERSHIP ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete membership",
      },
      { status: 500 }
    );
  }
}