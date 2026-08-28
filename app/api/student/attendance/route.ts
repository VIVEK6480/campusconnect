import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  studentId?: string;
  role?: string;
};

function getLoggedInStudentId(request: NextRequest): string | null {
  const token = request.cookies.get("token")?.value;

  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is missing from environment variables.");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const role = String(decoded.role ?? "").toUpperCase();

    if (role && role !== "STUDENT") return null;

    const studentId =
      typeof decoded.id === "string"
        ? decoded.id
        : typeof decoded.userId === "string"
        ? decoded.userId
        : typeof decoded.studentId === "string"
        ? decoded.studentId
        : typeof decoded.sub === "string"
        ? decoded.sub
        : null;

    return studentId || null;
  } catch (error) {
    console.error("STUDENT JWT VERIFY ERROR:", error);
    return null;
  }
}

function normalizeSection(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^SECTION\s+/i, "")
    .toUpperCase();
}

function normalizeStatus(status: unknown): string {
  return String(status ?? "").trim().toUpperCase();
}

function isPresent(status: unknown): boolean {
  return normalizeStatus(status) === "PRESENT";
}

function isAbsent(status: unknown): boolean {
  return normalizeStatus(status) === "ABSENT";
}

function percentage(present: number, total: number): number {
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

export async function GET(request: NextRequest) {
  try {
    const studentId = getLoggedInStudentId(request);

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Student authentication is required.",
        },
        { status: 401 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        campusUserId: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        approvalStatus: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student account not found.",
        },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message: "Only students can access this attendance page.",
        },
        { status: 403 }
      );
    }

    // ========================================================
    // ONLY THIS STUDENT'S REGISTERED SUBJECTS
    // ========================================================
    const registrations = await prisma.studentRegistration.findMany({
      where: { studentId: student.id },
      select: {
        id: true,
        studentId: true,
        subjectId: true,
        semester: true,
        section: true,
        subject: {
          select: {
            id: true,
            name: true,
            semester: true,
          },
        },
      },
      orderBy: [
        { semester: "asc" },
        { subject: { name: "asc" } },
      ],
    });

    const registeredKeys = new Set(
      registrations.map((registration) =>
        [
          registration.subjectId,
          registration.semester,
          normalizeSection(registration.section),
        ].join("|")
      )
    );

    const registeredSubjectIds = Array.from(
      new Set(registrations.map((registration) => registration.subjectId))
    );

    // ========================================================
    // CLASS ATTENDANCE - ONLY THIS STUDENT
    // ========================================================
    const classAttendance =
      registeredSubjectIds.length > 0
        ? await prisma.classAttendance.findMany({
            where: {
              studentId: student.id,
              subjectId: { in: registeredSubjectIds },
            },
            select: {
              id: true,
              sessionId: true,
              studentId: true,
              subjectId: true,
              status: true,
              markedAt: true,
              updatedAt: true,
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
                  createdAt: true,
                },
              },
            },
            orderBy: [
              { session: { sessionDate: "desc" } },
              { markedAt: "desc" },
            ],
          })
        : [];

    const validClassAttendance = classAttendance.filter((record) => {
      if (!record.session) return false;

      const key = [
        record.subjectId,
        record.session.semester,
        normalizeSection(record.session.section),
      ].join("|");

      return registeredKeys.has(key);
    });

    // ========================================================
    // EVENT ATTENDANCE - ONLY THIS STUDENT
    // Event attendance remains separate from subject attendance.
    // ========================================================
    const eventAttendance = await prisma.attendance.findMany({
      where: {
        userId: student.id,
      },
      select: {
        id: true,
        userId: true,
        eventId: true,
        status: true,
        markedAt: true,
        updatedAt: true,
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            venue: true,
            clubId: true,
            eventDate: true,
            image: true,
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        markedAt: "desc",
      },
    });

    // ========================================================
    // SUBJECT-WISE DATA
    // ========================================================
    const subjects = registrations.map((registration) => {
      const records = validClassAttendance.filter(
        (record) =>
          record.subjectId === registration.subjectId &&
          record.session.semester === registration.semester &&
          record.session.section.trim().toUpperCase() ===
            registration.section.trim().toUpperCase()
      );

      const present = records.filter((record) => isPresent(record.status)).length;
      const absent = records.filter((record) => isAbsent(record.status)).length;
      const total = records.length;

      return {
        registrationId: registration.id,
        subjectId: registration.subjectId,
        subjectName: registration.subject.name,
        semester: registration.semester,
        section: registration.section,
        present,
        absent,
        total,
        percentage: percentage(present, total),
        records: records.map((record) => ({
          id: record.id,
          status: record.status,
          markedAt: record.markedAt,
          updatedAt: record.updatedAt,
          date: record.session.sessionDate,
          subject: record.subject,
          session: {
            id: record.session.id,
            sessionDate: record.session.sessionDate,
            semester: record.session.semester,
            section: record.session.section,
          },
        })),
      };
    });

    // ========================================================
    // OVERALL = CLASS + EVENT ATTENDANCE
    // ========================================================
    const classPresent = validClassAttendance.filter((record) =>
      isPresent(record.status)
    ).length;
    const classAbsent = validClassAttendance.filter((record) =>
      isAbsent(record.status)
    ).length;
    const classTotal = validClassAttendance.length;

    const eventPresent = eventAttendance.filter((record) =>
      isPresent(record.status)
    ).length;
    const eventAbsent = eventAttendance.filter((record) =>
      isAbsent(record.status)
    ).length;
    const eventTotal = eventAttendance.length;

    const overallPresent = classPresent + eventPresent;
    const overallAbsent = classAbsent + eventAbsent;
    const overallTotal = classTotal + eventTotal;

    return NextResponse.json(
      {
        success: true,
        student,

        // Overall intentionally includes both types.
        overall: {
          present: overallPresent,
          absent: overallAbsent,
          total: overallTotal,
          percentage: percentage(overallPresent, overallTotal),
          classPresent,
          classAbsent,
          classTotal,
          eventPresent,
          eventAbsent,
          eventTotal,
        },

        // Subject section uses ONLY class attendance.
        subjects,
        registeredSubjects: registrations.map((registration) => ({
          id: registration.subject.id,
          name: registration.subject.name,
          semester: registration.subject.semester,
        })),
        registrations,
        classAttendance: validClassAttendance,

        // Event section uses ONLY this student's event attendance.
        eventAttendance,

        subjectCount: registrations.length,
        subjectsWithRecords: subjects.filter((subject) => subject.total > 0).length,
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("STUDENT ATTENDANCE GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load student attendance.",
        student: null,
        overall: {
          present: 0,
          absent: 0,
          total: 0,
          percentage: 0,
          classPresent: 0,
          classAbsent: 0,
          classTotal: 0,
          eventPresent: 0,
          eventAbsent: 0,
          eventTotal: 0,
        },
        subjects: [],
        registeredSubjects: [],
        registrations: [],
        classAttendance: [],
        eventAttendance: [],
        subjectCount: 0,
        subjectsWithRecords: 0,
      },
      { status: 500 }
    );
  }
}