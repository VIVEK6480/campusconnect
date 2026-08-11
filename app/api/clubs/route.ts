import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===============================
// GET ALL CLUBS
// ===============================
export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      clubs,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch clubs",
      },
      {
        status: 500,
      }
    );
  }
}

// ===============================
// CREATE CLUB
// ===============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, description, category } = body;

    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Name and description are required",
        },
        {
          status: 400,
        }
      );
    }

    const existingClub = await prisma.club.findUnique({
      where: {
        name,
      },
    });

    if (existingClub) {
      return NextResponse.json(
        {
          success: false,
          message: "Club already exists",
        },
        {
          status: 400,
        }
      );
    }

    const club = await prisma.club.create({
      data: {
        name,
        description,
        category,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club created successfully",
        club,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

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