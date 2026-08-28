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

  if (status === "ABSENT") return "Absent";
  if (status === "LATE") return "Late";
  if (status === "EXCUSED") return "Excused";

  return "Present";
}

/*
  Supports:
  YYYY-MM-DD
  MM/DD/YYYY
*/
function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed
      .split("/")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  const date = new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function getDateRange(date: Date) {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );

  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    0,
    0
  );

  return {
    start,
    end,
  };
}

function getToken(request: NextRequest): string | null {
  const authorization =
    request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization
      .slice(7)
      .trim();

    if (token) {
      return token;
    }
  }

  return request.cookies.get("token")?.value ?? null;
}

function getUserId(
  request: NextRequest
): string | null {
  const token = getToken(request);
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(
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
  const userId = getUserId(request);

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json(
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
        name: true,
        email: true,
        campusUserId: true,
        role: true,
        approvalStatus: true,
      },
    });

  if (!faculty) {
    return {
      ok: false as const,
      response: NextResponse.json(
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
    String(faculty.role).toUpperCase() !==
    "FACULTY"
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
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
   REGISTERED STUDENTS
========================================================= */

async function getRegisteredStudents(
  semester: number,
  section: string,
  subjectId: string
) {
  const registrations =
    await prisma.studentRegistration.findMany({
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

  const wantedSection = sectionKey(section);

  return registrations
    .filter((registration) => {
      return (
        sectionKey(registration.section) ===
          wantedSection &&
        String(
          registration.student.role
        ).toUpperCase() === "STUDENT"
      );
    })
    .map((registration) => registration.student);
}

/* =========================================================
   SUBJECTS
========================================================= */

async function getSubjects(
  semester?: number
) {
  return prisma.subject.findMany({
    where: semester
      ? {
          semester,
        }
      : undefined,

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
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  const auth = await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } =
      new URL(request.url);

    const semesterParam =
      searchParams.get("semester") ?? "";

    const sectionParam =
      searchParams.get("section") ?? "";

    const subjectId =
      searchParams.get("subjectId") ?? "";

    const dateParam =
      searchParams.get("date");

    const statusParam =
      searchParams.get("status") ?? "";

    const search =
      searchParams.get("search")?.trim() ?? "";

    const semester =
      semesterNumber(semesterParam);

    const section =
      sectionKey(sectionParam);

    const selectedDate =
      parseDate(dateParam);

    const subjects =
      await getSubjects(
        semester || undefined
      );

    /*
      Students remain empty until:
      Semester + Section + Subject
      are selected.
    */
    let students: Awaited<
      ReturnType<typeof getRegisteredStudents>
    > = [];

    if (
      semester &&
      section &&
      subjectId
    ) {
      const subject =
        await prisma.subject.findUnique({
          where: {
            id: subjectId,
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
            message:
              "Selected subject was not found.",
          },
          { status: 404 }
        );
      }

      if (
        subject.semester !== semester
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected subject does not belong to the selected semester.",
          },
          { status: 400 }
        );
      }

      students =
        await getRegisteredStudents(
          semester,
          section,
          subjectId
        );
    }

    /*
      Build exact attendance filter.
    */
    const sessionWhere: Record<
      string,
      unknown
    > = {
      facultyId: auth.faculty.id,
    };

    if (semester) {
      sessionWhere.semester = semester;
    }

    if (section) {
      sessionWhere.section = section;
    }

    if (subjectId) {
      sessionWhere.subjectId = subjectId;
    }

    if (selectedDate) {
      const { start, end } =
        getDateRange(selectedDate);

      sessionWhere.sessionDate = {
        gte: start,
        lt: end,
      };
    }

    const attendanceWhere: Record<
      string,
      unknown
    > = {
      session: sessionWhere,
    };

    /*
      Optional status filter.
    */
    if (
      statusParam &&
      statusParam.toUpperCase() !== "ALL"
    ) {
      attendanceWhere.status =
        normalizeStatus(statusParam);
    }

    /*
      Optional student search.
    */
    if (search) {
      attendanceWhere.OR = [
        {
          student: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          student: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          student: {
            campusUserId: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          subject: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const attendance =
      await prisma.classAttendance.findMany({
        where: attendanceWhere,

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

    return NextResponse.json(
      {
        success: true,
        attendance,
        students,
        subjects,
        count: attendance.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FACULTY CLASS ATTENDANCE GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load class attendance.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: NextRequest
) {
  const auth = await requireFaculty(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body =
      (await request.json()) as AttendanceBody;

    const semester =
      semesterNumber(body.semester);

    const section =
      sectionKey(body.section);

    const subjectId =
      String(body.subjectId ?? "").trim();

    const presentStudentIds =
      Array.isArray(
        body.presentStudentIds
      )
        ? body.presentStudentIds.filter(
            (
              id
            ): id is string =>
              typeof id === "string" &&
              id.trim().length > 0
          )
        : [];

    const selectedStatus =
      normalizeStatus(body.status);

    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Semester is required.",
        },
        { status: 400 }
      );
    }

    if (!section) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Section is required.",
        },
        { status: 400 }
      );
    }

    if (!subjectId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Subject is required.",
        },
        { status: 400 }
      );
    }

    const subject =
      await prisma.subject.findUnique({
        where: {
          id: subjectId,
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
          message:
            "Selected subject was not found.",
        },
        { status: 404 }
      );
    }

    if (
      subject.semester !== semester
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected subject does not belong to the selected semester.",
        },
        { status: 400 }
      );
    }

    const registeredStudents =
      await getRegisteredStudents(
        semester,
        section,
        subjectId
      );

    if (
      registeredStudents.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No students are registered for this exact semester, section and subject.",
        },
        { status: 400 }
      );
    }

    const registeredIds =
      new Set(
        registeredStudents.map(
          (student) => student.id
        )
      );

    const uniquePresentIds =
      Array.from(
        new Set(presentStudentIds)
      );

    const invalidStudentIds =
      uniquePresentIds.filter(
        (studentId) =>
          !registeredIds.has(studentId)
      );

    if (
      invalidStudentIds.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more selected students are not registered for this exact class.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const sessionDate =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const classSession =
      await prisma.classSession.upsert({
        where: {
          facultyId_subjectId_semester_section_sessionDate:
            {
              facultyId:
                auth.faculty.id,
              subjectId,
              semester,
              section,
              sessionDate,
            },
        },

        update: {
          updatedAt: now,
        },

        create: {
          facultyId:
            auth.faculty.id,
          subjectId,
          semester,
          section,
          sessionDate,
        },
      });

    await prisma.$transaction(
      registeredStudents.map(
        (student) => {
          const isSelected =
            uniquePresentIds.includes(
              student.id
            );

          const status: AttendanceStatus =
            isSelected
              ? selectedStatus
              : "Absent";

          return prisma.classAttendance.upsert({
            where: {
              sessionId_studentId: {
                sessionId:
                  classSession.id,
                studentId:
                  student.id,
              },
            },

            update: {
              subjectId,
              status,
              markedAt: now,
            },

            create: {
              sessionId:
                classSession.id,
              studentId:
                student.id,
              subjectId,
              status,
              markedAt: now,
            },
          });
        }
      )
    );

    const savedAttendance =
      await prisma.classAttendance.findMany({
        where: {
          sessionId:
            classSession.id,
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
        message:
          "Class attendance marked successfully.",
        session: classSession,
        attendance:
          savedAttendance,
        count:
          savedAttendance.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "FACULTY CLASS ATTENDANCE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save class attendance.",
      },
      { status: 500 }
    );
  }
}