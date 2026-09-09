import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

function getFacultyId(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  const token = request.cookies.get("token")?.value || bearer;

  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    const role = String(decoded.role ?? "").toUpperCase();

    if (role !== "FACULTY") return null;

    return (
      decoded.id ||
      decoded.userId ||
      decoded.facultyId ||
      (typeof decoded.sub === "string" ? decoded.sub : null) ||
      null
    );
  } catch {
    return null;
  }
}

async function requireFaculty(request: NextRequest) {
  const facultyId = getFacultyId(request);

  if (!facultyId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Faculty authentication is required." },
        { status: 401 }
      ),
    };
  }

  const faculty = await prisma.user.findUnique({
    where: { id: facultyId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!faculty || String(faculty.role).toUpperCase() !== "FACULTY") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Only faculty can manage students." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, faculty };
}

function buildSearch(search: string): Prisma.UserWhereInput | undefined {
  const value = search.trim();
  if (!value) return undefined;

  return {
    OR: [
      { name: { contains: value, mode: "insensitive" } },
      { email: { contains: value, mode: "insensitive" } },
      { campusUserId: { contains: value, mode: "insensitive" } },
      { department: { contains: value, mode: "insensitive" } },
      { designation: { contains: value, mode: "insensitive" } },
      { phone: { contains: value, mode: "insensitive" } },
      { qualification: { contains: value, mode: "insensitive" } },
      { specialization: { contains: value, mode: "insensitive" } },
      { city: { contains: value, mode: "insensitive" } },
      { state: { contains: value, mode: "insensitive" } },
      {
        studentRegistrations: {
          some: {
            section: { contains: value, mode: "insensitive" },
          },
        },
      },
      {
        studentRegistrations: {
          some: {
            subject: {
              name: { contains: value, mode: "insensitive" },
            },
          },
        },
      },
    ],
  };
}

function isPresent(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toUpperCase() === "PRESENT";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const where = {
      role: "STUDENT" as const,
      approvalStatus: "APPROVED" as const,
      ...(buildSearch(search) ?? {}),
    };

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        campusUserId: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        approvalStatus: true,
        approvedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        department: true,
        designation: true,
        phone: true,
        qualification: true,
        specialization: true,
        joiningDate: true,
        address: true,
        city: true,
        state: true,
        officeRoom: true,
        officeHours: true,
        studentRegistrations: {
          orderBy: [
            { semester: "asc" },
            { subject: { name: "asc" } },
          ],
          select: {
            id: true,
            semester: true,
            section: true,
            createdAt: true,
            subject: {
              select: { id: true, name: true, semester: true },
            },
          },
        },
        classAttendances: {
          orderBy: [{ session: { sessionDate: "desc" } }, { markedAt: "desc" }],
          select: {
            id: true,
            status: true,
            markedAt: true,
            updatedAt: true,
            subjectId: true,
            subject: {
              select: { id: true, name: true, semester: true },
            },
            session: {
              select: {
                id: true,
                semester: true,
                section: true,
                sessionDate: true,
                faculty: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        attendances: {
          orderBy: { markedAt: "desc" },
          select: {
            id: true,
            status: true,
            markedAt: true,
            updatedAt: true,
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                venue: true,
                eventDate: true,
                image: true,
                club: { select: { id: true, name: true } },
              },
            },
          },
        },
        certificates: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            fileUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        memberships: {
          orderBy: { joinedAt: "desc" },
          select: {
            id: true,
            joinedAt: true,
            club: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const payload = students.map((student) => {
      const classAttendanceTotal = student.classAttendances.length;
      const classAttendancePresent = student.classAttendances.filter((item) =>
        isPresent(item.status)
      ).length;
      const classAttendanceAbsent =
        classAttendanceTotal - classAttendancePresent;
      const eventAttendanceTotal = student.attendances.length;
      const eventAttendancePresent = student.attendances.filter((item) =>
        isPresent(item.status)
      ).length;

      return {
        ...student,
        statistics: {
          subjectCount: new Set(
            student.studentRegistrations.map((item) => item.subject.id)
          ).size,
          classAttendanceTotal,
          classAttendancePresent,
          classAttendanceAbsent,
          classAttendancePercentage:
            classAttendanceTotal > 0
              ? Number(((classAttendancePresent / classAttendanceTotal) * 100).toFixed(1))
              : 0,
          eventAttendanceTotal,
          eventAttendancePresent,
          certificateCount: student.certificates.length,
          clubCount: student.memberships.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: payload.length,
      students: payload,
    });
  } catch (error) {
    console.error("FACULTY STUDENTS GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load students.", students: [] },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);
    if (!auth.ok) return auth.response;

    let body: { studentId?: unknown };
    try {
      body = (await request.json()) as { studentId?: unknown };
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "Student ID is required." },
        { status: 400 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, name: true },
    });

    if (!student || String(student.role).toUpperCase() !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Student account not found." },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id: studentId } });

    return NextResponse.json({
      success: true,
      message: `${student.name} deleted successfully.`,
    });
  } catch (error) {
    console.error("FACULTY STUDENTS DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Unable to delete student." },
      { status: 500 }
    );
  }
}
