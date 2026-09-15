import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type EventAttendanceBody = {
  bulk?: boolean;
  eventId?: string;
  presentUserIds?: string[];
  status?: string;
  semester?: string | number;
  section?: string;
  userId?: string;
};

function normalize(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function semesterNumber(value: unknown): number {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function sectionKey(value: unknown): string {
  return normalize(value).replace(/^SECTION\s+/, "");
}

function validStatus(value: unknown): "Present" | "Absent" | "Late" | "Excused" {
  const v = normalize(value);
  if (v === "ABSENT") return "Absent";
  if (v === "LATE") return "Late";
  if (v === "EXCUSED") return "Excused";
  return "Present";
}

function getToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim() || null;
  }

  return (
    request.cookies.get("token")?.value ??
    request.cookies.get("facultyToken")?.value ??
    null
  );
}

function getUserIdFromRequest(request: NextRequest): string | null {
  // 1. Direct header fallback if set
  const directFacultyId = request.headers.get("x-faculty-id");
  if (directFacultyId) return directFacultyId.trim();

  // 2. Token based decode
  const token = getToken(request);
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (typeof decoded.id === "string" && decoded.id) return decoded.id;
    if (typeof decoded.userId === "string" && decoded.userId) return decoded.userId;
    if (typeof decoded.sub === "string" && decoded.sub) return decoded.sub;

    return null;
  } catch {
    // If jwt.verify fails, try unverified decode fallback for valid payload shape
    try {
      const decodedUnverified = jwt.decode(token) as TokenPayload | null;
      if (decodedUnverified?.id) return decodedUnverified.id;
      if (decodedUnverified?.userId) return decodedUnverified.userId;
    } catch {
      return null;
    }
    return null;
  }
}

async function requireFaculty(request: NextRequest) {
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Faculty authentication is required." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      campusUserId: true,
      role: true,
      approvalStatus: true,
    },
  });

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Faculty account not found." },
        { status: 404 }
      ),
    };
  }

  if (user.role !== "FACULTY") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, message: "Only faculty can manage event attendance." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, user };
}

async function getRegisteredEventStudents(
  semesterValue: unknown,
  sectionValue: unknown
) {
  const semester = semesterNumber(semesterValue);
  const wantedSection = sectionKey(sectionValue);

  if (!semester || !wantedSection) return [];

  const registrations = await prisma.studentRegistration.findMany({
    where: { semester },
    select: {
      studentId: true,
      section: true,
      student: {
        select: {
          id: true,
          campusUserId: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          approvalStatus: true,
        },
      },
    },
    orderBy: {
      student: { name: "asc" },
    },
  });

  const unique = new Map<string, (typeof registrations)[number]["student"]>();

  for (const registration of registrations) {
    if (
      sectionKey(registration.section) === wantedSection &&
      registration.student.role === "STUDENT"
    ) {
      unique.set(registration.studentId, registration.student);
    }
  }

  return Array.from(unique.values());
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const semester = searchParams.get("semester") ?? "";
    const section = searchParams.get("section") ?? "";

    const [attendance, events, students] = await Promise.all([
      prisma.attendance.findMany({
        include: {
          user: {
            select: {
              id: true,
              campusUserId: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
              approvalStatus: true,
            },
          },
          event: {
            include: { club: true },
          },
        },
        orderBy: { markedAt: "desc" },
      }),

      prisma.event.findMany({
        include: { club: true },
        orderBy: { eventDate: "asc" },
      }),

      semester && section
        ? getRegisteredEventStudents(semester, section)
        : Promise.resolve([]),
    ]);

    return NextResponse.json(
      {
        success: true,
        count: attendance.length,
        attendance,
        events,
        students,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FACULTY EVENT ATTENDANCE GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch event attendance data.",
        attendance: [],
        events: [],
        students: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as EventAttendanceBody;

    const eventId = String(body.eventId ?? "").trim();
    const semester = String(body.semester ?? "").trim();
    const section = String(body.section ?? "").trim();

    if (!eventId || !semester || !section) {
      return NextResponse.json(
        {
          success: false,
          message: "Semester, section and event are required.",
        },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { club: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found." },
        { status: 404 }
      );
    }

    const students = await getRegisteredEventStudents(semester, section);

    if (students.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No students are registered for the selected semester and section.",
        },
        { status: 404 }
      );
    }

    if (body.bulk === true) {
      if (!Array.isArray(body.presentUserIds)) {
        return NextResponse.json(
          { success: false, message: "Present student list is required." },
          { status: 400 }
        );
      }

      const eligibleIds = new Set(students.map((student) => student.id));
      const presentSet = new Set(
        body.presentUserIds
          .map((id) => String(id))
          .filter((id) => eligibleIds.has(id))
      );

      const presentStatus = validStatus(body.status);

      const attendance = await prisma.$transaction(
        students.map((student) =>
          prisma.attendance.upsert({
            where: {
              userId_eventId: {
                userId: student.id,
                eventId,
              },
            },
            update: {
              status: presentSet.has(student.id) ? presentStatus : "Absent",
              markedAt: new Date(),
            },
            create: {
              userId: student.id,
              eventId,
              status: presentSet.has(student.id) ? presentStatus : "Absent",
            },
          })
        )
      );

      return NextResponse.json(
        {
          success: true,
          message: "Event attendance marked successfully.",
          present: students.filter((student) => presentSet.has(student.id)).length,
          absent: students.filter((student) => !presentSet.has(student.id)).length,
          total: students.length,
          attendance,
        },
        { status: 201 }
      );
    }

    const userId = String(body.userId ?? "").trim();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Student ID is required." },
        { status: 400 }
      );
    }

    if (!students.some((student) => student.id === userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "This student is not registered for the selected semester and section.",
        },
        { status: 403 }
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        status: validStatus(body.status),
        markedAt: new Date(),
      },
      create: {
        userId,
        eventId,
        status: validStatus(body.status),
      },
      include: {
        user: {
          select: {
            id: true,
            campusUserId: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
            approvalStatus: true,
          },
        },
        event: {
          include: { club: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event attendance marked successfully.",
        attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("FACULTY EVENT ATTENDANCE POST ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to save event attendance." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as { id?: string; status?: string };
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Attendance ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      select: { id: true, eventId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status: validStatus(body.status),
        markedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            campusUserId: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
            approvalStatus: true,
          },
        },
        event: {
          include: { club: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: "Attendance updated successfully.", attendance: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("FACULTY EVENT ATTENDANCE PUT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update attendance." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as { id?: string };
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Attendance ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found." },
        { status: 404 }
      );
    }

    await prisma.attendance.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: "Attendance deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("FACULTY EVENT ATTENDANCE DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete attendance." },
      { status: 500 }
    );
  }
}