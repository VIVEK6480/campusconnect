import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

/* =========================================================
   TYPES
========================================================= */

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type UpdateBody = {
  status?: string;
};

/*
  Next.js 16 dynamic route context.
*/
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(
  value: unknown
): "Present" | "Absent" | "Late" | "Excused" {
  const status = String(value ?? "")
    .trim()
    .toUpperCase();

  if (status === "ABSENT") {
    return "Absent";
  }

  if (status === "LATE") {
    return "Late";
  }

  if (status === "EXCUSED") {
    return "Excused";
  }

  return "Present";
}

function getToken(
  request: NextRequest
): string | null {
  const authorization =
    request.headers.get("authorization");

  if (
    authorization?.startsWith("Bearer ")
  ) {
    const token =
      authorization
        .slice(7)
        .trim();

    if (token) {
      return token;
    }
  }

  return (
    request.cookies.get("token")
      ?.value ?? null
  );
}

function getUserId(
  request: NextRequest
): string | null {
  const token =
    getToken(request);

  const secret =
    process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const decoded =
      jwt.verify(
        token,
        secret
      ) as TokenPayload;

    if (
      typeof decoded.id === "string" &&
      decoded.id
    ) {
      return decoded.id;
    }

    if (
      typeof decoded.userId === "string" &&
      decoded.userId
    ) {
      return decoded.userId;
    }

    if (
      typeof decoded.sub === "string" &&
      decoded.sub
    ) {
      return decoded.sub;
    }

    return null;
  } catch {
    return null;
  }
}

async function requireFaculty(
  request: NextRequest
) {
  const userId =
    getUserId(request);

  if (!userId) {
    return {
      ok: false as const,
      response:
        NextResponse.json(
          {
            success: false,
            message:
              "Faculty authentication is required.",
          },
          { status: 401 }
        ),
    };
  }

  const faculty =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        role: true,
        approvalStatus: true,
      },
    });

  if (!faculty) {
    return {
      ok: false as const,
      response:
        NextResponse.json(
          {
            success: false,
            message:
              "Faculty account not found.",
          },
          { status: 404 }
        ),
    };
  }

  if (
    String(
      faculty.role
    ).toUpperCase() !== "FACULTY"
  ) {
    return {
      ok: false as const,
      response:
        NextResponse.json(
          {
            success: false,
            message:
              "Only faculty can manage class attendance.",
          },
          { status: 403 }
        ),
    };
  }

  return {
    ok: true as const,
    faculty,
  };
}

/* =========================================================
   PUT
========================================================= */

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth =
    await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    /*
      Next.js 16:
      params must be awaited.
    */
    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance record ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as UpdateBody;

    const status =
      normalizeStatus(body.status);

    const existing =
      await prisma.classAttendance.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          sessionId: true,

          session: {
            select: {
              facultyId: true,
            },
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Class attendance record not found.",
        },
        { status: 404 }
      );
    }

    /*
      Faculty can update only
      their own attendance.
    */
    if (
      existing.session.facultyId !==
      auth.faculty.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only update your own class attendance records.",
        },
        { status: 403 }
      );
    }

    const updated =
      await prisma.classAttendance.update({
        where: {
          id,
        },

        data: {
          status,
        },

        select: {
          id: true,
          sessionId: true,
          studentId: true,
          subjectId: true,
          status: true,
          markedAt: true,
          updatedAt: true,

          student: {
            select: {
              id: true,
              campusUserId: true,
              name: true,
              email: true,
            },
          },

          subject: {
            select: {
              id: true,
              name: true,
              semester: true,
            },
          },

          session: {
            select: {
              id: true,
              facultyId: true,
              subjectId: true,
              semester: true,
              section: true,
              sessionDate: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Class attendance updated successfully.",
        attendance: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FACULTY CLASS ATTENDANCE PUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update class attendance.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth =
    await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance record ID is required.",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.classAttendance.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          sessionId: true,

          session: {
            select: {
              facultyId: true,
            },
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Class attendance record not found.",
        },
        { status: 404 }
      );
    }

    /*
      Only session owner can delete.
    */
    if (
      existing.session.facultyId !==
      auth.faculty.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only delete your own class attendance records.",
        },
        { status: 403 }
      );
    }

    await prisma.classAttendance.delete({
      where: {
        id,
      },
    });

    /*
      Delete ClassSession only if
      no attendance records remain.
    */
    const remaining =
      await prisma.classAttendance.count({
        where: {
          sessionId:
            existing.sessionId,
        },
      });

    if (remaining === 0) {
      await prisma.classSession.delete({
        where: {
          id:
            existing.sessionId,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Class attendance deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FACULTY CLASS ATTENDANCE DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete class attendance.",
      },
      { status: 500 }
    );
  }
}