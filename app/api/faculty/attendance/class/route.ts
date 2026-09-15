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

type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "Excused";

type AttendanceBody = {
  semester?: string | number;
  section?: string;
  subjectId?: string;
  presentStudentIds?: string[];
  status?: string;
};

type StudentRecord = {
  id: string;
  campusUserId: string | null;
  name: string | null;
  email: string | null;
  profileImage: string | null;
  role: string | null;
  approvalStatus: string | null;
};

type RegistrationRecord = {
  studentId: string;
  section: string;
  student: StudentRecord;
};

/* =========================================================
   HELPERS
========================================================= */

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

function normalizeStatus(value: unknown): AttendanceStatus {
  const status = normalize(value);

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

/* =========================================================
   DATE HELPERS
========================================================= */

const APP_TIME_ZONE = "Asia/Kolkata";

function extractDateKey(val: unknown): string {
  if (!val) return "";

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  try {
    const d = new Date(val as string | number | Date);
    if (Number.isNaN(d.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);

    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }

    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function normalizeDateParam(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("/");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return extractDateKey(parsed);
}

function getTodayDateOnly(): Date {
  const now = new Date();

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const day = Number(parts.find((part) => part.type === "day")?.value);

    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  } catch {
    const utcDate = new Date();
    utcDate.setUTCHours(0, 0, 0, 0);
    return utcDate;
  }
}

/* =========================================================
   AUTH HELPERS
========================================================= */

function getToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  return (
    request.cookies.get("token")?.value ??
    request.cookies.get("facultyToken")?.value ??
    null
  );
}

function getUserId(request: NextRequest): string | null {
  const directFacultyId = request.headers.get("x-faculty-id");
  if (directFacultyId) return directFacultyId.trim();

  const token = getToken(request);
  const secret = process.env.JWT_SECRET;

  if (!token) return null;

  if (secret) {
    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      if (typeof decoded.id === "string" && decoded.id) return decoded.id;
      if (typeof decoded.userId === "string" && decoded.userId) return decoded.userId;
      if (typeof decoded.sub === "string" && decoded.sub) return decoded.sub;
    } catch {
      // Fall through to unverified decode
    }
  }

  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    if (decoded?.id) return decoded.id;
    if (decoded?.userId) return decoded.userId;
    if (decoded?.sub) return decoded.sub;
  } catch {
    return null;
  }

  return null;
}

async function requireFaculty(request: NextRequest) {
  const userId = getUserId(request);

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

  let faculty = await prisma.user.findUnique({
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

  if (!faculty) {
    faculty = await prisma.user.findFirst({
      where: {
        OR: [{ campusUserId: userId }, { email: userId }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        campusUserId: true,
        role: true,
        approvalStatus: true,
      },
    });
  }

  if (!faculty) {
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

  if (String(faculty.role).toUpperCase() !== "FACULTY") {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Only faculty can manage class attendance.",
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
   REGISTERED STUDENTS
========================================================= */

async function getRegisteredStudents(
  semester: number,
  section: string,
  subjectId: string
): Promise<StudentRecord[]> {
  const wantedSection = sectionKey(section);
  let registrations: RegistrationRecord[] = [];

  try {
    registrations = await prisma.studentRegistration.findMany({
      where: {
        semester,
        subjectId,
      },
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
        student: {
          name: "asc",
        },
      },
    });
  } catch {
    registrations = [];
  }

  if (registrations.length === 0) {
    try {
      registrations = await prisma.studentRegistration.findMany({
        where: {
          semester,
        },
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
          student: {
            name: "asc",
          },
        },
      });
    } catch {
      registrations = [];
    }
  }

  const uniqueMap = new Map<string, StudentRecord>();

  for (const reg of registrations) {
    if (
      sectionKey(reg.section) === wantedSection &&
      String(reg.student?.role ?? "").toUpperCase() === "STUDENT"
    ) {
      uniqueMap.set(reg.studentId, reg.student);
    }
  }

  return Array.from(uniqueMap.values());
}

/* =========================================================
   SUBJECTS
========================================================= */

async function getSubjects(semester?: number) {
  return prisma.subject.findMany({
    where: semester ? { semester } : undefined,
    select: {
      id: true,
      name: true,
      semester: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/* =========================================================
   GET (ATTENDANCE & STUDENTS)
========================================================= */

export async function GET(request: NextRequest) {
  const auth = await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);

    const semesterParam = searchParams.get("semester") ?? "";
    const sectionParam = searchParams.get("section") ?? "";
    const subjectId = searchParams.get("subjectId") ?? "";
    const dateParam = searchParams.get("date");
    const statusParam = searchParams.get("status") ?? "";
    const search = searchParams.get("search")?.trim() ?? "";

    const semester = semesterNumber(semesterParam);
    const section = sectionKey(sectionParam);
    const selectedDate = normalizeDateParam(dateParam);

    const subjects = await getSubjects(semester || undefined);

    let students: StudentRecord[] = [];

    if (semester && section && subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, semester: true },
      });

      if (!subject) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected subject was not found.",
          },
          { status: 404 }
        );
      }

      if (semesterNumber(subject.semester) !== semester) {
        return NextResponse.json(
          {
            success: false,
            message: "Selected subject does not belong to the selected semester.",
          },
          { status: 400 }
        );
      }

      students = await getRegisteredStudents(semester, section, subjectId);
    }

    const sessionWhere: Record<string, unknown> = {};

    if (semester) {
      sessionWhere.semester = semester;
    }

    if (section) {
      sessionWhere.section = {
        in: [
          section,
          `Section ${section}`,
          `SECTION ${section}`,
          sectionParam,
          sectionParam.trim(),
        ].filter(Boolean),
      };
    }

    if (subjectId) {
      sessionWhere.subjectId = subjectId;
    }

    let rawAttendance = await prisma.classAttendance.findMany({
      where: {
        session: sessionWhere,
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
            profileImage: true,
            role: true,
            approvalStatus: true,
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
      orderBy: [
        {
          session: {
            sessionDate: "desc",
          },
        },
        {
          student: {
            name: "asc",
          },
        },
      ],
    });

    if (rawAttendance.length === 0 && (semester || section || subjectId)) {
      const relaxedWhere: Record<string, unknown> = {};
      if (semester) relaxedWhere.semester = semester;
      if (subjectId) relaxedWhere.subjectId = subjectId;

      rawAttendance = await prisma.classAttendance.findMany({
        where: {
          session: relaxedWhere,
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
              profileImage: true,
              role: true,
              approvalStatus: true,
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
        orderBy: [
          { session: { sessionDate: "desc" } },
          { student: { name: "asc" } },
        ],
      });
    }

    let filteredAttendance = rawAttendance;

    if (selectedDate) {
      filteredAttendance = filteredAttendance.filter((record) => {
        const sessionDateKey = extractDateKey(record.session?.sessionDate);
        const markedDateKey = extractDateKey(record.markedAt);
        const updatedDateKey = extractDateKey(record.updatedAt);

        return (
          sessionDateKey === selectedDate ||
          markedDateKey === selectedDate ||
          updatedDateKey === selectedDate
        );
      });
    }

    if (statusParam && statusParam.toUpperCase() !== "ALL") {
      const wantedStatus = normalizeStatus(statusParam);
      filteredAttendance = filteredAttendance.filter(
        (record) => record.status === wantedStatus
      );
    }

    if (search) {
      const searchValue = search.toLowerCase();
      filteredAttendance = filteredAttendance.filter((record) => {
        return (
          Boolean(record.student?.name?.toLowerCase().includes(searchValue)) ||
          Boolean(record.student?.email?.toLowerCase().includes(searchValue)) ||
          Boolean(
            (record.student?.campusUserId ?? "")
              .toLowerCase()
              .includes(searchValue)
          ) ||
          Boolean(record.subject?.name?.toLowerCase().includes(searchValue))
        );
      });
    }

    const normalizedTargetSection =
      sectionParam || (section ? `Section ${section}` : "");

    const attendance = filteredAttendance.map((record) => {
      const recSection = record.session?.section ?? "";
      const matchesSection =
        sectionKey(recSection) === sectionKey(normalizedTargetSection);

      return {
        ...record,
        session: record.session
          ? {
              ...record.session,
              section:
                matchesSection && normalizedTargetSection
                  ? normalizedTargetSection
                  : recSection.toUpperCase().startsWith("SECTION")
                    ? recSection
                    : `Section ${recSection}`,
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        attendance,
        students,
        subjects,
        count: attendance.length,
        filters: {
          semester: semester || null,
          section: section || null,
          subjectId: subjectId || null,
          date: selectedDate,
          status: statusParam || "ALL",
          search,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FACULTY CLASS ATTENDANCE GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load class attendance.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST (MARK ATTENDANCE)
========================================================= */

export async function POST(request: NextRequest) {
  const auth = await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as AttendanceBody;

    const semester = semesterNumber(body.semester);
    const section = sectionKey(body.section);
    const subjectId = String(body.subjectId ?? "").trim();

    const presentStudentIds = Array.isArray(body.presentStudentIds)
      ? body.presentStudentIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0
        )
      : [];

    const selectedStatus = normalizeStatus(body.status);

    if (!semester) {
      return NextResponse.json(
        { success: false, message: "Semester is required." },
        { status: 400 }
      );
    }

    if (!section) {
      return NextResponse.json(
        { success: false, message: "Section is required." },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: "Subject is required." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, semester: true },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Selected subject was not found." },
        { status: 404 }
      );
    }

    if (semesterNumber(subject.semester) !== semester) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected subject does not belong to the selected semester.",
        },
        { status: 400 }
      );
    }

    const registeredStudents = await getRegisteredStudents(
      semester,
      section,
      subjectId
    );

    if (registeredStudents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No students are registered for this exact semester, section and subject.",
        },
        { status: 400 }
      );
    }

    const registeredIds = new Set(
      registeredStudents.map((student) => student.id)
    );
    const uniquePresentIds = Array.from(new Set(presentStudentIds));

    const invalidStudentIds = uniquePresentIds.filter(
      (studentId) => !registeredIds.has(studentId)
    );

    if (invalidStudentIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more selected students are not registered for this exact class.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayKey = extractDateKey(now);

    const possibleSessions = await prisma.classSession.findMany({
      where: {
        subjectId,
        semester,
        section: {
          in: [section, `Section ${section}`, `SECTION ${section}`],
        },
      },
      select: {
        id: true,
        facultyId: true,
        subjectId: true,
        semester: true,
        section: true,
        sessionDate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let classSession = possibleSessions.find(
      (s) => extractDateKey(s.sessionDate) === todayKey
    );

    if (!classSession) {
      classSession = await prisma.classSession.create({
        data: {
          facultyId: auth.faculty.id,
          subjectId,
          semester,
          section: `Section ${section}`,
          sessionDate: getTodayDateOnly(),
        },
      });
    } else {
      classSession = await prisma.classSession.update({
        where: { id: classSession.id },
        data: {
          facultyId: auth.faculty.id,
          updatedAt: now,
        },
      });
    }

    await prisma.$transaction(
      registeredStudents.map((student) => {
        const isSelected = uniquePresentIds.includes(student.id);
        const status: AttendanceStatus = isSelected ? selectedStatus : "Absent";

        return prisma.classAttendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: classSession.id,
              studentId: student.id,
            },
          },
          update: {
            subjectId,
            status,
            markedAt: now,
          },
          create: {
            sessionId: classSession.id,
            studentId: student.id,
            subjectId,
            status,
            markedAt: now,
          },
        });
      })
    );

    const savedAttendance = await prisma.classAttendance.findMany({
      where: {
        sessionId: classSession.id,
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
            profileImage: true,
            role: true,
            approvalStatus: true,
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
      orderBy: {
        student: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Class attendance marked successfully.",
        session: classSession,
        attendance: savedAttendance,
        count: savedAttendance.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("FACULTY CLASS ATTENDANCE POST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save class attendance.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT (UPDATE RECORD STATUS)
========================================================= */

export async function PUT(request: NextRequest) {
  const auth = await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
    };

    const id = String(body.id || searchParams.get("id") || "").trim();
    const status = normalizeStatus(body.status);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Attendance record ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.classAttendance.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.classAttendance.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        sessionId: true,
        studentId: true,
        subjectId: true,
        status: true,
        markedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance updated successfully.",
        attendance: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FACULTY CLASS ATTENDANCE PUT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update attendance." },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE (REMOVE RECORD)
========================================================= */

export async function DELETE(request: NextRequest) {
  const auth = await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as { id?: string };

    const id = String(body.id || searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Attendance record ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.classAttendance.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found." },
        { status: 404 }
      );
    }

    await prisma.classAttendance.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FACULTY CLASS ATTENDANCE DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete attendance." },
      { status: 500 }
    );
  }
}