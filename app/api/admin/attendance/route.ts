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

/* =========================================================
   MASTER OPTIONS
========================================================= */

const BRANCH_OPTIONS = [
  "Computer Science & Engineering",
  "Artificial Intelligence & Machine Learning",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Management",
  "Commerce",
  "Science",
  "Humanities",
  "Other",
] as const;

const SEMESTER_OPTIONS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
] as const;

const SECTION_OPTIONS = [
  "A",
  "B",
  "C",
  "D",
] as const;

/* =========================================================
   AUTH
========================================================= */

function getAdminAuth(
  request: NextRequest
): TokenPayload | null {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "ADMIN ATTENDANCE: JWT_SECRET is missing."
    );

    return null;
  }

  const tokens: string[] = [];

  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    authorization &&
    authorization.startsWith("Bearer ")
  ) {
    const bearerToken =
      authorization
        .slice(7)
        .trim();

    if (bearerToken) {
      tokens.push(
        bearerToken
      );
    }
  }

  const cookieToken =
    request.cookies.get(
      "token"
    )?.value;

  if (cookieToken) {
    tokens.push(
      cookieToken
    );
  }

  for (const token of tokens) {
    try {
      const decoded =
        jwt.verify(
          token,
          secret
        ) as TokenPayload;

      const role =
        String(
          decoded.role ?? ""
        ).toUpperCase();

      if (
        role !== "ADMIN" &&
        role !== "SUPER_ADMIN"
      ) {
        continue;
      }

      return decoded;
    } catch {
      continue;
    }
  }

  return null;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(
  value: unknown
): AttendanceStatus {
  const status =
    String(
      value ?? "Present"
    )
      .trim()
      .toLowerCase();

  if (
    status ===
    "absent"
  ) {
    return "Absent";
  }

  if (
    status ===
    "late"
  ) {
    return "Late";
  }

  if (
    status ===
    "excused"
  ) {
    return "Excused";
  }

  return "Present";
}

function getSemesterNumber(
  value: string
): number {
  return Number(
    value.match(
      /\d+/
    )?.[0] || 0
  );
}

function dateToKey(
  value: Date
): string {
  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      value.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function addDays(
  value: Date,
  amount: number
): Date {
  const result =
    new Date(value);

  result.setDate(
    result.getDate() +
      amount
  );

  return result;
}

function getDateWindow(
  dateValue: string
) {
  const base =
    dateValue
      ? new Date(
          `${dateValue}T00:00:00`
        )
      : new Date();

  base.setHours(
    0,
    0,
    0,
    0
  );

  const end =
    new Date(base);

  end.setHours(
    23,
    59,
    59,
    999
  );

  const start =
    addDays(
      base,
      -6
    );

  start.setHours(
    0,
    0,
    0,
    0
  );

  return {
    start,
    end,
    normalizedDate:
      dateToKey(base),
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  const admin =
    getAdminAuth(
      request
    );

  if (!admin) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Admin authentication is required.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const { searchParams } =
      new URL(
        request.url
      );

    /* =====================================================
       REQUEST FILTERS
    ===================================================== */

    const branch =
      searchParams
        .get("department")
        ?.trim() || "";

    const facultyId =
      searchParams
        .get("facultyId")
        ?.trim() || "";

    const semester =
      searchParams
        .get("semester")
        ?.trim() || "";

    const subjectId =
      searchParams
        .get("subjectId")
        ?.trim() || "";

    const section =
      searchParams
        .get("section")
        ?.trim() || "";

    /*
     * IMPORTANT:
     * Do NOT call this selectedDate because later
     * we receive normalizedDate from getDateWindow().
     */
    const requestedDate =
      searchParams
        .get("date")
        ?.trim() || "";

    const semesterNumber =
      getSemesterNumber(
        semester
      );

    /* =====================================================
       FACULTY
    ===================================================== */

    const facultyList =
      await prisma.user.findMany(
        {
          where: {
            role: "FACULTY",

            ...(branch
              ? {
                  department:
                    branch,
                }
              : {}),
          },

          select: {
            id: true,
            name: true,
            email: true,
            campusUserId: true,
            department: true,
          },

          orderBy: {
            name: "asc",
          },
        }
      );

    /* =====================================================
       ALL SUBJECTS FOR SELECTED SEMESTER
       
       IMPORTANT:
       This is NOT based on ClassSession.
       Every Subject stored for the semester appears.
    ===================================================== */

    let subjectOptions: {
      id: string;
      name: string;
      semester: number;
    }[] = [];

    if (
      semesterNumber >= 1 &&
      semesterNumber <= 8
    ) {
      subjectOptions =
        await prisma.subject.findMany(
          {
            where: {
              semester:
                semesterNumber,
            },

            select: {
              id: true,
              name: true,
              semester: true,
            },

            orderBy: {
              name: "asc",
            },
          }
        );
    }

    /* =====================================================
       COMPLETE FILTER CHECK
    ===================================================== */

    const filtersComplete =
      Boolean(
        branch &&
          facultyId &&
          semesterNumber >=
            1 &&
          semesterNumber <=
            8 &&
          subjectId &&
          section &&
          requestedDate
      );

    /* =====================================================
       OPTIONS ONLY
    ===================================================== */

    if (!filtersComplete) {
      return NextResponse.json(
        {
          success: true,

          ready: false,

          selected: {
            status:
              "NO_FACULTY_SELECTED",

            summary:
              null,
          },

          overview:
            null,

          facultyActivity:
            [],

          filters: {
            departments:
              [
                ...BRANCH_OPTIONS,
              ],

            faculty:
              facultyList,

            semesters:
              [
                ...SEMESTER_OPTIONS,
              ],

            subjects:
              subjectOptions,

            sections:
              SECTION_OPTIONS.map(
                (value) => ({
                  value,
                  label:
                    `Section ${value}`,
                })
              ),
          },
        },
        {
          status: 200,
        }
      );
    }

    /* =====================================================
       DATE WINDOW
       
       FIX:
       requestedDate -> normalizedDate
       
       No duplicate selectedDate variable.
    ===================================================== */

    const {
      start,
      end,
      normalizedDate,
    } =
      getDateWindow(
        requestedDate
      );

    /* =====================================================
       EXACT 7-DAY CLASS SESSION QUERY
    ===================================================== */

    const sessions =
      await prisma.classSession.findMany(
        {
          where: {
            facultyId,

            subjectId,

            semester:
              semesterNumber,

            section,

            sessionDate: {
              gte: start,
              lte: end,
            },
          },

          select: {
            id: true,
            facultyId: true,
            subjectId: true,
            semester: true,
            section: true,
            sessionDate: true,

            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
                campusUserId: true,
                department: true,
              },
            },

            subject: {
              select: {
                id: true,
                name: true,
                semester: true,
              },
            },

            attendances: {
              select: {
                id: true,
                studentId: true,
                status: true,
                markedAt: true,
              },
            },
          },

          orderBy: {
            sessionDate:
              "asc",
          },
        }
      );

    /* =====================================================
       SEVEN DAY DATES
    ===================================================== */

    const chartDates =
      Array.from(
        {
          length: 7,
        },
        (_, index) =>
          dateToKey(
            addDays(
              start,
              index
            )
          )
      );

    /* =====================================================
       DAY TYPE
    ===================================================== */

    type DayActivity = {
      date: string;

      status:
        | "MARKED"
        | "NOT_MARKED"
        | "NO_CLASS";

      sessionCount:
        number;

      markedSessionCount:
        number;

      attendanceRecords:
        number;

      present:
        number;

      absent:
        number;

      late:
        number;

      excused:
        number;

      lastMarkedAt:
        string | null;

      subject: {
        id: string;
        name: string;
        semester: number;
      } | null;
    };

    /* =====================================================
       INITIALIZE DAYS
    ===================================================== */

    const days:
      DayActivity[] =
      chartDates.map(
        (date) => ({
          date,

          status:
            "NO_CLASS",

          sessionCount:
            0,

          markedSessionCount:
            0,

          attendanceRecords:
            0,

          present:
            0,

          absent:
            0,

          late:
            0,

          excused:
            0,

          lastMarkedAt:
            null,

          subject:
            null,
        })
      );

    /* =====================================================
       PROCESS CLASS SESSIONS
    ===================================================== */

    for (
      const session of sessions
    ) {
      const sessionDateKey =
        dateToKey(
          new Date(
            session.sessionDate
          )
        );

      const day =
        days.find(
          (item) =>
            item.date ===
            sessionDateKey
        );

      if (!day) {
        continue;
      }

      day.sessionCount +=
        1;

      day.subject = {
        id:
          session.subject.id,

        name:
          session.subject
            .name,

        semester:
          session.subject
            .semester,
      };

      /* ================================================
         SESSION EXISTS BUT NO ATTENDANCE
      ================================================= */

      if (
        session.attendances
          .length === 0
      ) {
        if (
          day.status !==
          "MARKED"
        ) {
          day.status =
            "NOT_MARKED";
        }

        continue;
      }

      /* ================================================
         ATTENDANCE MARKED
      ================================================= */

      day.status =
        "MARKED";

      day.markedSessionCount +=
        1;

      for (
        const record of
          session.attendances
      ) {
        day.attendanceRecords +=
          1;

        const status =
          normalizeStatus(
            record.status
          );

        if (
          status ===
          "Present"
        ) {
          day.present +=
            1;
        }

        if (
          status ===
          "Absent"
        ) {
          day.absent +=
            1;
        }

        if (
          status ===
          "Late"
        ) {
          day.late +=
            1;
        }

        if (
          status ===
          "Excused"
        ) {
          day.excused +=
            1;
        }

        const markedAt =
          new Date(
            record.markedAt
          );

        if (
          !day.lastMarkedAt ||
          markedAt >
            new Date(
              day.lastMarkedAt
            )
        ) {
          day.lastMarkedAt =
            markedAt.toISOString();
        }
      }
    }

    /* =====================================================
       SELECTED FACULTY
    ===================================================== */

    const selectedFaculty =
      facultyList.find(
        (faculty) =>
          faculty.id ===
          facultyId
      ) || null;

    /* =====================================================
       SELECTED DAY
    ===================================================== */

    const selectedDay =
      days.find(
        (day) =>
          day.date ===
          normalizedDate
      ) || null;

    /* =====================================================
       SELECTED STATUS
    ===================================================== */

    let selectedStatus:
      | "MARKED"
      | "NOT_MARKED"
      | "NO_CLASS"
      | "NO_FACULTY_SELECTED" =
      "NO_FACULTY_SELECTED";

    if (
      selectedDay
    ) {
      selectedStatus =
        selectedDay.status;
    }

    /* =====================================================
       7 DAY COUNTS
    ===================================================== */

    const sevenDayMarked =
      days.filter(
        (day) =>
          day.status ===
          "MARKED"
      ).length;

    const sevenDayNotMarked =
      days.filter(
        (day) =>
          day.status ===
          "NOT_MARKED"
      ).length;

    const sevenDayNoClass =
      days.filter(
        (day) =>
          day.status ===
          "NO_CLASS"
      ).length;

    const sevenDaySessions =
      days.reduce(
        (
          total,
          day
        ) =>
          total +
          day.markedSessionCount,
        0
      );

    /* =====================================================
       SELECTED DAY ATTENDANCE
    ===================================================== */

    const present =
      selectedDay?.present ||
      0;

    const absent =
      selectedDay?.absent ||
      0;

    const late =
      selectedDay?.late ||
      0;

    const excused =
      selectedDay?.excused ||
      0;

    const attendanceRecords =
      selectedDay
        ?.attendanceRecords ||
      0;

    const attended =
      present +
      late;

    const attendancePercentage =
      attendanceRecords >
      0
        ? Number(
            (
              (attended /
                attendanceRecords) *
              100
            ).toFixed(1)
          )
        : 0;

    /* =====================================================
       SELECTED SUBJECT
    ===================================================== */

    const selectedSubject =
      subjectOptions.find(
        (subject) =>
          subject.id ===
          subjectId
      ) || null;

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        ready: true,

        selected: {
          status:
            selectedStatus,

          summary: {
            faculty:
              selectedFaculty
                ? {
                    id:
                      selectedFaculty.id,

                    name:
                      selectedFaculty.name,

                    email:
                      selectedFaculty.email,

                    department:
                      selectedFaculty.department,
                  }
                : null,

            date:
              normalizedDate,

            sessionCount:
              selectedDay
                ?.sessionCount ||
              0,

            markedSessionCount:
              selectedDay
                ?.markedSessionCount ||
              0,

            attendanceRecords,

            present,

            absent,

            late,

            excused,

            attendancePercentage,

            lastMarkedAt:
              selectedDay
                ?.lastMarkedAt ||
              null,

            subject:
              selectedDay
                ?.subject ||
              selectedSubject,

            semester:
              semesterNumber,

            section,

            sevenDayMarked,

            sevenDayNotMarked,

            sevenDayNoClass,

            sevenDaySessions,

            days,
          },
        },

        overview: {
          selectedDate:
            normalizedDate,

          totalDays:
            7,

          markedDays:
            sevenDayMarked,

          notMarkedDays:
            sevenDayNotMarked,

          noClassDays:
            sevenDayNoClass,

          compliance:
            Number(
              (
                (sevenDayMarked /
                  7) *
                100
              ).toFixed(1)
            ),
        },

        facultyActivity: [
          {
            id:
              selectedFaculty
                ?.id ||
              facultyId,

            name:
              selectedFaculty
                ?.name ||
              "Faculty",

            email:
              selectedFaculty
                ?.email ||
              "",

            campusUserId:
              selectedFaculty
                ?.campusUserId ||
              null,

            department:
              selectedFaculty
                ?.department ||
              branch,

            markedDays:
              sevenDayMarked,

            totalDays:
              7,

            compliance:
              Number(
                (
                  (sevenDayMarked /
                    7) *
                  100
                ).toFixed(1)
              ),

            days,
          },
        ],

        filters: {
          departments:
            [
              ...BRANCH_OPTIONS,
            ],

          faculty:
            facultyList,

          semesters:
            [
              ...SEMESTER_OPTIONS,
            ],

          subjects:
            subjectOptions,

          sections:
            SECTION_OPTIONS.map(
              (value) => ({
                value,
                label:
                  `Section ${value}`,
              })
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN ATTENDANCE MONITOR ERROR:",
      error
    );

    const errorCode =
      (
        error as {
          code?: string;
        }
      )?.code;

    /* =====================================================
       DATABASE CONNECTION ERROR
    ===================================================== */

    if (
      errorCode ===
      "P1001"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database server is currently unreachable. Please check the Neon/PostgreSQL connection and try again.",
        },
        {
          status: 503,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load attendance monitoring data.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
   ADMIN ATTENDANCE CORRECTION
========================================================= */

export async function PUT(
  request: NextRequest
) {
  try {
    const admin =
      getAdminAuth(
        request
      );

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    let body: {
      attendanceId?: string;
      status?: string;
      reason?: string;
    } = {};

    try {
      body =
        (await request.json()) as {
          attendanceId?: string;
          status?: string;
          reason?: string;
        };
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const attendanceId =
      String(
        body.attendanceId ??
          ""
      ).trim();

    const reason =
      String(
        body.reason ??
          ""
      ).trim();

    if (!attendanceId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Correction reason is required.",
        },
        {
          status: 400,
        }
      );
    }

    const status =
      normalizeStatus(
        body.status
      );

    const existing =
      await prisma.classAttendance.findUnique(
        {
          where: {
            id:
              attendanceId,
          },
        }
      );

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance record not found.",
        },
        {
          status: 404,
        }
      );
    }

    const oldStatus =
      normalizeStatus(
        existing.status
      );

    const updated =
      await prisma.classAttendance.update(
        {
          where: {
            id:
              attendanceId,
          },

          data: {
            status,
          },
        }
      );

    console.log(
      "ADMIN ATTENDANCE CORRECTION",
      {
        attendanceId,

        adminId:
          admin.id ??
          admin.userId ??
          null,

        oldStatus,

        newStatus:
          status,

        reason,

        correctedAt:
          new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Attendance corrected successfully.",

        attendance: {
          id:
            updated.id,

          status:
            normalizeStatus(
              updated.status
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN ATTENDANCE CORRECTION ERROR:",
      error
    );

    const errorCode =
      (
        error as {
          code?: string;
        }
      )?.code;

    if (
      errorCode ===
      "P1001"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Database server is currently unreachable.",
        },
        {
          status: 503,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to correct attendance.",
      },
      {
        status: 500,
      }
    );
  }
}