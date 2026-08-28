import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
      },

      select: {
        id: true,
        campusUserId: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        profileImage: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: students.length,
        students,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET STUDENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch students.",
        students: [],
      },
      { status: 500 }
    );
  }
}