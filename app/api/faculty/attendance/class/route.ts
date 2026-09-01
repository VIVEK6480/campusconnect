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

function normalizeStatus(
  value: unknown
): AttendanceStatus {
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

   Attendance system is used as a DATE-BASED system.

   IST is used so that old records created locally and
   records created after deployment do not disappear because
   of timezone conversion.
========================================================= */

const APP_TIME_ZONE = "Asia/Kolkata";

function formatDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year =
    parts.find((part) => part.type === "year")
      ?.value ?? "";

  const month =
    parts.find((part) => part.type === "month")
      ?.value ?? "";

  const day =
    parts.find((part) => part.type === "day")
      ?.value ?? "";

  return `${year}-${month}-${day}`;
}

/*
  Supports:
  YYYY-MM-DD
  MM/DD/YYYY
*/
function normalizeDateParam(
  value: string | null
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  /*
    HTML date input:
    YYYY-MM-DD
  */
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  /*
    MM/DD/YYYY
  */
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] =
      trimmed.split("/");

    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatDateKey(parsed);
}

/*
  Create a stable date-only value.

  This is only used when creating a new ClassSession.
*/
function getTodayDateOnly(): Date {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(
    parts.find((part) => part.type === "year")
      ?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")
      ?.value
  );

  const day = Number(
    parts.find((part) => part.type === "day")
      ?.value
  );

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    )
  );
}

/* =========================================================
   AUTH HELPERS
========================================================= */

function getToken(
  request: NextRequest
): string | null {
  const authorization =
    request.headers.get("authorization");

  if (
    authorization?.startsWith("Bearer ")
  ) {
    const token = authorization
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
  const token = getToken(request);

  const secret =
    process.env.JWT_SECRET;

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

  const wantedSection =
    sectionKey(section);

  return registrations
    .filter((registration) => {
      return (
        sectionKey(
          registration.section
        ) === wantedSection &&
        String(
          registration.student.role
        ).toUpperCase() === "STUDENT"
      );
    })
    .map(
      (registration) =>
        registration.student
    );
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

   Used for:

   1. Loading registered students
   2. Loading Attendance History

   IMPORTANT:
   History uses:
   Semester + Section + Subject + Date

   Date filtering is done safely after loading the session
   records so timezone differences do not hide attendance.
========================================================= */

export async function GET(
  request: NextRequest
) {
  const auth =
    await requireFaculty(request);

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
      searchParams.get("search")
        ?.trim() ?? "";

    const semester =
      semesterNumber(semesterParam);

    const section =
      sectionKey(sectionParam);

    const selectedDate =
      normalizeDateParam(dateParam);

    /* ================================================
       SUBJECTS
    ================================================= */

    const subjects =
      await getSubjects(
        semester || undefined
      );

    /* ================================================
       REGISTERED STUDENTS
    ================================================= */

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

    /* ================================================
       HISTORY SESSION FILTER

       Semester + Section + Subject come from
       the upper attendance selection.

       We DO NOT use a direct DateTime database range here,
       because old records can have timezone differences.
    ================================================= */

    const sessionWhere: Record<
      string,
      unknown
    > = {
      facultyId: auth.faculty.id,
    };

    if (semester) {
      sessionWhere.semester =
        semester;
    }

    if (section) {
      sessionWhere.section =
        section;
    }

    if (subjectId) {
      sessionWhere.subjectId =
        subjectId;
    }

    const rawAttendance =
      await prisma.classAttendance.findMany({
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

    /* ================================================
       DATE FILTER

       Match selected date against:

       1. sessionDate
       2. markedAt

       This makes old and new attendance records work.
    ================================================= */

    let attendance =
      rawAttendance;

    if (selectedDate) {
      attendance =
        attendance.filter((record) => {
          const sessionDateKey =
            formatDateKey(
              record.session.sessionDate
            );

          const markedDateKey =
            formatDateKey(
              record.markedAt
            );

          return (
            sessionDateKey ===
              selectedDate ||
            markedDateKey ===
              selectedDate
          );
        });
    }

    /* ================================================
       STATUS FILTER
    ================================================= */

    if (
      statusParam &&
      statusParam.toUpperCase() !==
        "ALL"
    ) {
      const wantedStatus =
        normalizeStatus(statusParam);

      attendance =
        attendance.filter(
          (record) =>
            record.status ===
            wantedStatus
        );
    }

    /* ================================================
       SEARCH FILTER
    ================================================= */

    if (search) {
      const searchValue =
        search.toLowerCase();

      attendance =
        attendance.filter((record) => {
          return (
            record.student.name
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            record.student.email
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            (record.student.campusUserId ??
              "")
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            record.subject.name
              .toLowerCase()
              .includes(
                searchValue
              )
          );
        });
    }

    return NextResponse.json(
      {
        success: true,

        attendance,

        students,

        subjects,

        count:
          attendance.length,

        filters: {
          semester:
            semester || null,

          section:
            section || null,

          subjectId:
            subjectId || null,

          date:
            selectedDate,

          status:
            statusParam || "ALL",

          search,
        },
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

   Mark attendance.

   Unchecked students = Absent
   Checked students = selected status
========================================================= */

export async function POST(
  request: NextRequest
) {
  const auth =
    await requireFaculty(request);

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
      String(
        body.subjectId ?? ""
      ).trim();

    const presentStudentIds =
      Array.isArray(
        body.presentStudentIds
      )
        ? body.presentStudentIds.filter(
            (
              id
            ): id is string =>
              typeof id ===
                "string" &&
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

    /* ================================================
       VALIDATE SUBJECT
    ================================================= */

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

    /* ================================================
       REGISTERED STUDENTS
    ================================================= */

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
          (student) =>
            student.id
        )
      );

    const uniquePresentIds =
      Array.from(
        new Set(
          presentStudentIds
        )
      );

    const invalidStudentIds =
      uniquePresentIds.filter(
        (studentId) =>
          !registeredIds.has(
            studentId
          )
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

    const now =
      new Date();

    const todayKey =
      formatDateKey(now);

    /* ================================================
       FIND TODAY'S EXISTING SESSION

       We search by date key instead of depending only on
       exact DateTime equality.

       This prevents duplicate sessions caused by timezone
       differences.
    ================================================= */

    const possibleSessions =
      await prisma.classSession.findMany({
        where: {
          facultyId:
            auth.faculty.id,

          subjectId,

          semester,

          section,
        },

        select: {
          id: true,
          facultyId: true,
          subjectId: true,
          semester: true,
          section: true,
          sessionDate: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    let classSession =
      possibleSessions.find(
        (session) =>
          formatDateKey(
            session.sessionDate
          ) === todayKey
      );

    /* ================================================
       CREATE SESSION IF NOT FOUND
    ================================================= */

    if (!classSession) {
      classSession =
        await prisma.classSession.create({
          data: {
            facultyId:
              auth.faculty.id,

            subjectId,

            semester,

            section,

            sessionDate:
              getTodayDateOnly(),
          },
        });
    } else {
      classSession =
        await prisma.classSession.update({
          where: {
            id:
              classSession.id,
          },

          data: {
            updatedAt:
              now,
          },
        });
    }

    /* ================================================
       SAVE ATTENDANCE

       Selected students:
       Present / selected status

       Unselected students:
       Absent
    ================================================= */

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
              sessionId_studentId:
                {
                  sessionId:
                    classSession.id,

                  studentId:
                    student.id,
                },
            },

            update: {
              subjectId,
              status,
              markedAt:
                now,
            },

            create: {
              sessionId:
                classSession.id,

              studentId:
                student.id,

              subjectId,

              status,

              markedAt:
                now,
            },
          });
        }
      )
    );

    /* ================================================
       FETCH SAVED RECORDS
    ================================================= */

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

        session:
          classSession,

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