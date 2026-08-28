import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

/* ============================================================
   TYPES
============================================================ */

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type AttendanceBody = {
  userId?: string;
  eventId?: string;
  status?: string;
  bulk?: boolean;
  type?: string;
  presentUserIds?: string[];
  semester?: string | number;
  section?: string;
  subject?: string;
};

/* ============================================================
   HELPERS
============================================================ */

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function semesterNumber(value: unknown): number {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function sectionKey(value: unknown): string {
  return normalize(value).replace(/^SECTION\s+/, "");
}

function validStatus(value: unknown): "Present" | "Absent" | "Late" | "Excused" {
  const valueUpper = normalize(value);

  if (valueUpper === "ABSENT") return "Absent";
  if (valueUpper === "LATE") return "Late";
  if (valueUpper === "EXCUSED") return "Excused";
  return "Present";
}

function getToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim() || null;
  }

  return request.cookies.get("token")?.value ?? null;
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const token = getToken(request);
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (typeof decoded.id === "string" && decoded.id) {
      return decoded.id;
    }

    if (typeof decoded.userId === "string" && decoded.userId) {
      return decoded.userId;
    }

    if (typeof decoded.sub === "string" && decoded.sub) {
      return decoded.sub;
    }

    return null;
  } catch {
    return null;
  }
}

async function requireFaculty(request: NextRequest) {
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Faculty authentication is required.",
        },
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
        {
          success: false,
          message: "Faculty account not found.",
        },
        { status: 404 }
      ),
    };
  }

  if (user.role !== "FACULTY") {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Only faculty can manage attendance.",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, user };
}

async function getRegisteredStudents(
  semesterValue: unknown,
  sectionValue: unknown,
  subjectValue?: unknown
) {
  const semester = semesterNumber(semesterValue);

  if (!semester) {
    return [];
  }

  const registrations = await prisma.studentRegistration.findMany({
    where: {
      semester,
    },
    select: {
      studentId: true,
      section: true,
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
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
      student: {
        name: "asc",
      },
    },
  });

  const wantedSection = sectionKey(sectionValue);

  let filtered = wantedSection
    ? registrations.filter(
        (registration) =>
          sectionKey(registration.section) === wantedSection
      )
    : registrations;

  const wantedSubject = normalize(subjectValue);

  if (wantedSubject) {
    filtered = filtered.filter((registration) =>
      normalize(registration.subject.id) === wantedSubject ||
      normalize(registration.subject.name) === wantedSubject
    );
  }

  const unique = new Map<string, (typeof filtered)[number]["student"]>();

  for (const registration of filtered) {
    if (registration.student.role === "STUDENT") {
      unique.set(registration.studentId, registration.student);
    }
  }

  return Array.from(unique.values());
}

/* ============================================================
   GET

   Faculty-only attendance data.
   Also returns students from StudentRegistration when semester
   and section are supplied. This is what the faculty UI needs
   before any attendance exists.
============================================================ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const semester = searchParams.get("semester") ?? "";
    const section = searchParams.get("section") ?? "";
    const subject = searchParams.get("subject") ?? "";

    const [attendance, events, students, subjects] = await Promise.all([
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
            include: {
              club: true,
            },
          },
        },
        orderBy: {
          markedAt: "desc",
        },
      }),

      prisma.event.findMany({
        include: {
          club: true,
        },
        orderBy: {
          eventDate: "asc",
        },
      }),

      getRegisteredStudents(semester, section, subject),
      prisma.subject.findMany({
        where: semesterNumber(semester)
          ? { semester: semesterNumber(semester) }
          : undefined,
        select: {
          id: true,
          name: true,
          semester: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        count: attendance.length,
        attendance,
        events,
        students,
        subjects,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FACULTY ATTENDANCE GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance data.",
        count: 0,
        attendance: [],
        events: [],
        students: [],
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST

   Supports:
   1. Single EVENT attendance
   2. Bulk EVENT attendance
   3. Bulk CLASS attendance

   Event attendance is stored ONLY in Attendance.
   Class attendance is stored ONLY in ClassAttendance.
============================================================ */

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFaculty(request);

    if (!auth.ok) {
      return auth.response;
    }

    const body = (await request.json()) as AttendanceBody;

    /* ========================================================
       BULK CLASS ATTENDANCE
    ======================================================== */

    if (body.bulk === true && normalize(body.type) === "CLASS") {
      const semester = semesterNumber(body.semester);
      const section = String(body.section ?? "").trim();
      const subjectName = String(body.subject ?? "").trim();
      const presentUserIds = Array.isArray(body.presentUserIds)
        ? body.presentUserIds.filter(
            (id): id is string => typeof id === "string" && Boolean(id.trim())
          )
        : [];

      if (!semester || !section || !subjectName) {
        return NextResponse.json(
          {
            success: false,
            message: "Semester, section and subject are required.",
          },
          { status: 400 }
        );
      }

      const subject = await prisma.subject.findFirst({
        where: {
          name: subjectName,
          semester,
        },
        select: {
          id: true,
          name: true,
          semester: true,
        },
      });

      if (!subject) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected subject was not found for this semester.",
          },
          { status: 404 }
        );
      }

      const students = await getRegisteredStudents(semester, section);

      if (students.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No students are registered for this semester and section.",
          },
          { status: 404 }
        );
      }

      const sessionDate = new Date();

      const session = await prisma.classSession.create({
        data: {
          facultyId: auth.user.id,
          subjectId: subject.id,
          semester,
          section,
          sessionDate,
        },
      });

      const presentSet = new Set(presentUserIds);

      await prisma.classAttendance.createMany({
        data: students.map((student) => ({
          sessionId: session.id,
          studentId: student.id,
          subjectId: subject.id,
          status: presentSet.has(student.id) ? "Present" : "Absent",
        })),
        skipDuplicates: true,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Class attendance marked successfully.",
          sessionId: session.id,
          present: students.filter((student) => presentSet.has(student.id)).length,
          absent: students.filter((student) => !presentSet.has(student.id)).length,
          total: students.length,
        },
        { status: 201 }
      );
    }

    /* ========================================================
       BULK EVENT ATTENDANCE
    ======================================================== */

    if (body.bulk === true) {
      const eventId = String(body.eventId ?? "").trim();
      const semester = body.semester;
      const section = String(body.section ?? "").trim();
      const semesterValue = semesterNumber(semester);
      const presentUserIds = Array.isArray(body.presentUserIds)
        ? body.presentUserIds.filter(
            (id): id is string => typeof id === "string" && Boolean(id.trim())
          )
        : [];

      if (!eventId) {
        return NextResponse.json(
          { success: false, message: "Event ID is required." },
          { status: 400 }
        );
      }

      if (!semesterValue || !section) {
        return NextResponse.json(
          {
            success: false,
            message: "Semester and section are required for event attendance.",
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

      const students = await getRegisteredStudents(semester, section);

      if (students.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No students are registered for the selected semester and section.",
          },
          { status: 404 }
        );
      }

      const presentSet = new Set(presentUserIds);

      await prisma.$transaction(
        students.map((student) =>
          prisma.attendance.upsert({
            where: {
              userId_eventId: {
                userId: student.id,
                eventId,
              },
            },
            update: {
              status: presentSet.has(student.id) ? "Present" : "Absent",
              markedAt: new Date(),
            },
            create: {
              userId: student.id,
              eventId,
              status: presentSet.has(student.id) ? "Present" : "Absent",
            },
          })
        )
      );

      return NextResponse.json(
        {
          success: true,
          message: "Event attendance marked successfully.",
          event,
          present: students.filter((student) => presentSet.has(student.id)).length,
          absent: students.filter((student) => !presentSet.has(student.id)).length,
          total: students.length,
        },
        { status: 201 }
      );
    }

    /* ========================================================
       SINGLE EVENT ATTENDANCE
    ======================================================== */

    const userId = String(body.userId ?? "").trim();
    const eventId = String(body.eventId ?? "").trim();

    if (!userId || !eventId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and Event ID are required.",
        },
        { status: 400 }
      );
    }

    const [user, event] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          campusUserId: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          approvalStatus: true,
        },
      }),
      prisma.event.findUnique({
        where: { id: eventId },
        include: { club: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found." },
        { status: 404 }
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
          include: {
            club: true,
          },
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
    console.error("FACULTY ATTENDANCE POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save attendance.",
      },
      { status: 500 }
    );
  }
}