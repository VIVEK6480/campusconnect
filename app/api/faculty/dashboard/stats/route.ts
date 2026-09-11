import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

function getFacultyId(request: NextRequest): string | null {
  const authorization =
    request.headers.get("authorization") || "";

  const bearer =
    authorization
      .toLowerCase()
      .startsWith("bearer ")
      ? authorization.slice(7).trim()
      : "";

  /*
   * Faculty authentication:
   *
   * Authorization: Bearer <faculty-token>
   * OR
   * facultyToken HTTP-only cookie
   */
  const token =
    bearer ||
    request.cookies.get("facultyToken")?.value ||
    "";

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as TokenPayload;

    const role = String(decoded.role ?? "")
      .trim()
      .toUpperCase();

    if (role !== "FACULTY") {
      return null;
    }

    return (
      (typeof decoded.id === "string" &&
        decoded.id) ||
      (typeof decoded.userId === "string" &&
        decoded.userId) ||
      (typeof decoded.facultyId === "string" &&
        decoded.facultyId) ||
      (typeof decoded.sub === "string" &&
        decoded.sub) ||
      null
    );
  } catch (error) {
    console.error(
      "FACULTY DASHBOARD JWT ERROR:",
      error
    );

    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const facultyId =
      getFacultyId(request);

    if (!facultyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized faculty account.",
        },
        {
          status: 401,
        }
      );
    }

    const faculty =
      await prisma.user.findUnique({
        where: {
          id: facultyId,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (
      !faculty ||
      String(faculty.role)
        .trim()
        .toUpperCase() !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty account not found.",
        },
        {
          status: 404,
        }
      );
    }

    const [
      students,
      pendingApprovals,
      attendance,
      upcomingEvents,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: "STUDENT",
          approvalStatus: "APPROVED",
        },
      }),

      prisma.user.count({
        where: {
          role: "STUDENT",
          approvalStatus: "PENDING",
        },
      }),

      prisma.classAttendance.count(),

      prisma.event.count({
        where: {
          eventDate: {
            gte: new Date(),
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: {
          students,
          pendingApprovals,
          attendance,
          upcomingEvents,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "FACULTY DASHBOARD STATS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load faculty dashboard statistics.",
      },
      {
        status: 500,
      }
    );
  }
}