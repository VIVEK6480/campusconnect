import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

function getToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim() || null;
  }

  return (
    request.cookies.get("facultyToken")?.value ??
    request.cookies.get("token")?.value ??
    null
  );
}

function getFacultyId(request: NextRequest) {
  const token = getToken(request);
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const role = String(decoded.role ?? "").trim().toUpperCase();

    if (role && role !== "FACULTY") return null;

    return (
      decoded.id ??
      decoded.userId ??
      decoded.facultyId ??
      decoded.sub ??
      null
    );
  } catch {
    return null;
  }
}

function normalizeSection(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/^SECTION\s+/i, "")
    .toUpperCase();
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET(request: NextRequest) {
  const facultyId = getFacultyId(request);

  if (!facultyId) {
    return NextResponse.json(
      {
        success: false,
        message: "Faculty authentication is required.",
        attendanceOverview: {
          totalSessions: 0,
          markedSessions: 0,
          unmarkedSessions: 0,
          averageCompletion: 0,
          subjects: [],
        },
      },
      { status: 401 },
    );
  }

  try {
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId },
      select: { id: true, role: true },
    });

    if (!faculty || faculty.role !== "FACULTY") {
      return NextResponse.json(
        {
          success: false,
          message: "Faculty account not found.",
          attendanceOverview: {
            totalSessions: 0,
            markedSessions: 0,
            unmarkedSessions: 0,
            averageCompletion: 0,
            subjects: [],
          },
        },
        { status: 403 },
      );
    }

    const sessions = await prisma.classSession.findMany({
      where: { facultyId: faculty.id },
      orderBy: { sessionDate: "desc" },
      take: 200,
      select: {
        id: true,
        facultyId: true,
        subjectId: true,
        semester: true,
        section: true,
        sessionDate: true,
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        attendanceOverview: {
          totalSessions: 0,
          markedSessions: 0,
          unmarkedSessions: 0,
          averageCompletion: 0,
          subjects: [],
        },
      });
    }

    const sessionIds = sessions.map((session) => session.id);
    const subjectIds = [...new Set(sessions.map((session) => session.subjectId))];
    const semesters = [...new Set(sessions.map((session) => session.semester))];

    const [subjects, registrations, attendance] = await Promise.all([
      prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, name: true, semester: true },
      }),
      prisma.studentRegistration.findMany({
        where: {
          subjectId: { in: subjectIds },
          semester: { in: semesters },
        },
        select: {
          studentId: true,
          subjectId: true,
          semester: true,
          section: true,
        },
      }),
      prisma.classAttendance.findMany({
        where: { sessionId: { in: sessionIds } },
        select: {
          sessionId: true,
          studentId: true,
          status: true,
        },
      }),
    ]);

    const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));

    const registrationMap = new Map<string, Set<string>>();

    for (const registration of registrations) {
      const key = `${registration.subjectId}|${registration.semester}|${normalizeSection(registration.section)}`;
      if (!registrationMap.has(key)) {
        registrationMap.set(key, new Set());
      }
      registrationMap.get(key)!.add(registration.studentId);
    }

    const attendanceBySession = new Map<string, typeof attendance>();

    for (const record of attendance) {
      const list = attendanceBySession.get(record.sessionId) ?? [];
      list.push(record);
      attendanceBySession.set(record.sessionId, list);
    }

    const latestBySubjectClass = new Map<string, (typeof sessions)[number]>();

    for (const session of sessions) {
      const key = `${session.subjectId}|${session.semester}|${normalizeSection(session.section)}`;
      if (!latestBySubjectClass.has(key)) {
        latestBySubjectClass.set(key, session);
      }
    }

    const subjectRows = Array.from(latestBySubjectClass.entries()).map(
      ([key, session]) => {
        const subject = subjectMap.get(session.subjectId);
        const registrationKey = `${session.subjectId}|${session.semester}|${normalizeSection(session.section)}`;
        const registeredStudents = registrationMap.get(registrationKey) ?? new Set<string>();
        const records = attendanceBySession.get(session.id) ?? [];
        const recordedStudentIds = new Set(records.map((record) => record.studentId));

        let present = 0;
        let absent = 0;
        let late = 0;
        let excused = 0;

        for (const record of records) {
          const status = String(record.status ?? "").trim().toUpperCase();
          if (status === "PRESENT") present += 1;
          else if (status === "ABSENT") absent += 1;
          else if (status === "LATE") late += 1;
          else if (status === "EXCUSED") excused += 1;
        }

        const expectedStudents = registeredStudents.size;
        const markedStudents = expectedStudents
          ? [...recordedStudentIds].filter((id) => registeredStudents.has(id)).length
          : recordedStudentIds.size;

        const completion = expectedStudents
          ? Math.min(100, Math.round((markedStudents / expectedStudents) * 100))
          : records.length > 0
            ? 100
            : 0;

        return {
          key,
          subjectId: session.subjectId,
          subjectName: subject?.name ?? "Unknown Subject",
          semester: session.semester,
          section: normalizeSection(session.section) || String(session.section ?? "—"),
          sessionDate: session.sessionDate?.toISOString?.() ?? null,
          expectedStudents,
          markedStudents,
          present,
          absent,
          late,
          excused,
          completion,
          status: records.length > 0 ? "MARKED" : "UNMARKED",
        };
      },
    );

    subjectRows.sort((a, b) => {
      const aDate = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
      const bDate = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
      return bDate - aDate;
    });

    const markedSessions = sessions.filter((session) => {
      return (attendanceBySession.get(session.id) ?? []).length > 0;
    }).length;

    const unmarkedSessions = sessions.length - markedSessions;
    const averageCompletion = subjectRows.length
      ? round(
          subjectRows.reduce((sum, row) => sum + row.completion, 0) /
            subjectRows.length,
        )
      : 0;

    return NextResponse.json({
      success: true,
      attendanceOverview: {
        totalSessions: sessions.length,
        markedSessions,
        unmarkedSessions,
        averageCompletion,
        subjects: subjectRows,
      },
    });
  } catch (error) {
    console.error("FACULTY DASHBOARD OVERVIEW ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load faculty dashboard overview.",
        attendanceOverview: {
          totalSessions: 0,
          markedSessions: 0,
          unmarkedSessions: 0,
          averageCompletion: 0,
          subjects: [],
        },
      },
      { status: 500 },
    );
  }
}
