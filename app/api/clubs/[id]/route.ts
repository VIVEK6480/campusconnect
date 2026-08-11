import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// =========================
// GET SINGLE CLUB
// =========================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("GET CLUB ID:", id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Club ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const club = await prisma.club.findUnique({
      where: {
        id,
      },
    });

    console.log("FOUND CLUB:", club);

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

    return NextResponse.json(
      {
        success: true,
        club,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET CLUB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// UPDATE CLUB
// =========================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { name, description, category } = body;

    const existingClub = await prisma.club.findUnique({
      where: {
        id,
      },
    });

    if (!existingClub) {
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

    const updatedClub = await prisma.club.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        category,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club updated successfully",
        club: updatedClub,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("UPDATE CLUB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update club",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// DELETE CLUB
// =========================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingClub = await prisma.club.findUnique({
      where: {
        id,
      },
    });

    if (!existingClub) {
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

    await prisma.club.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("DELETE CLUB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete club",
      },
      {
        status: 500,
      }
    );
  }
}