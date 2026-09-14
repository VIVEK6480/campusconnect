import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

type DailySessionRow = {
  key: string;
  subjectId: string;
  subjectName: string;
  semester: number;
  section: string;
  sessionDate: string | null;
  status: "MARKED" | "UNMARKED";
  completion: number;
};

function getToken(request: NextRequest) {
  const authorization =
    request.headers.get("authorization");

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

  if (!token || !secret) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      secret,
    ) as TokenPayload;

    const role = String(
      decoded.role ?? "",
    )
      .trim()
      .toUpperCase();

    if (role && role !== "FACULTY") {
      return null;
    }

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

function normalizeSection(
  value: string | null | undefined,
) {
  return String(value ?? "")
    .trim()
    .replace(/^SECTION\s+/i, "")
    .toUpperCase();
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

/*
 * CampusConnect is being displayed in India.
 * Using Asia/Kolkata here prevents a late-night UTC session
 * from appearing on the wrong calendar day.
 */
function getIndiaDateKey(value: Date) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(value);
}

function getIndiaDateLabel(value: Date) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
    },
  ).format(value);
}

function getPreviousDateKey(
  daysAgo: number,
) {
  const date = new Date();
  date.setDate(
    date.getDate() - daysAgo,
  );

  return getIndiaDateKey(date);
}

function getPreviousDateLabel(
  daysAgo: number,
) {
  const date = new Date();
  date.setDate(
    date.getDate() - daysAgo,
  );

  return getIndiaDateLabel(date);
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest,
) {
  const facultyId =
    getFacultyId(request);

  const emptyResponse = {
    totalSessions: 0,
    markedSessions: 0,
    unmarkedSessions: 0,
    averageCompletion: 0,
    subjects: [],
    today: {
      date: getPreviousDateKey(0),
      label: "Today",
      sessions: [],
    },
    previousSevenDays: [],
  };

  if (!facultyId) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Faculty authentication is required.",
        attendanceOverview:
          emptyResponse,
      },
      { status: 401 },
    );
  }

  try {
    const faculty =
      await prisma.user.findUnique({
        where: {
          id: facultyId,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (
      !faculty ||
      faculty.role !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty account not found.",
          attendanceOverview:
            emptyResponse,
        },
        { status: 403 },
      );
    }

    /*
     * Keep enough history for:
     * - current dashboard
     * - today
     * - previous 7 days
     */
    const sessions =
      await prisma.classSession.findMany(
        {
          where: {
            facultyId: faculty.id,
          },
          orderBy: {
            sessionDate: "desc",
          },
          take: 500,
          select: {
            id: true,
            facultyId: true,
            subjectId: true,
            semester: true,
            section: true,
            sessionDate: true,
          },
        },
      );

    if (sessions.length === 0) {
      return NextResponse.json({
        success: true,
        attendanceOverview:
          emptyResponse,
      });
    }

    const sessionIds =
      sessions.map(
        (session) => session.id,
      );

    const subjectIds = [
      ...new Set(
        sessions.map(
          (session) =>
            session.subjectId,
        ),
      ),
    ];

    const semesters = [
      ...new Set(
        sessions.map(
          (session) =>
            session.semester,
        ),
      ),
    ];

    const [
      subjects,
      registrations,
      attendance,
    ] = await Promise.all([
      prisma.subject.findMany({
        where: {
          id: {
            in: subjectIds,
          },
        },
        select: {
          id: true,
          name: true,
          semester: true,
        },
      }),

      prisma.studentRegistration.findMany(
        {
          where: {
            subjectId: {
              in: subjectIds,
            },
            semester: {
              in: semesters,
            },
          },
          select: {
            studentId: true,
            subjectId: true,
            semester: true,
            section: true,
          },
        },
      ),

      prisma.classAttendance.findMany({
        where: {
          sessionId: {
            in: sessionIds,
          },
        },
        select: {
          sessionId: true,
          studentId: true,
          status: true,
        },
      }),
    ]);

    const subjectMap = new Map(
      subjects.map((subject) => [
        subject.id,
        subject,
      ]),
    );

    const registrationMap =
      new Map<
        string,
        Set<string>
      >();

    for (const registration of registrations) {
      const key = `${registration.subjectId}|${registration.semester}|${normalizeSection(
        registration.section,
      )}`;

      if (!registrationMap.has(key)) {
        registrationMap.set(
          key,
          new Set<string>(),
        );
      }

      registrationMap
        .get(key)!
        .add(
          registration.studentId,
        );
    }

    const attendanceBySession =
      new Map<
        string,
        typeof attendance
      >();

    for (const record of attendance) {
      const list =
        attendanceBySession.get(
          record.sessionId,
        ) ?? [];

      list.push(record);

      attendanceBySession.set(
        record.sessionId,
        list,
      );
    }

    /* =======================================================
       LATEST SESSION PER SUBJECT + CLASS
    ======================================================= */

    const latestBySubjectClass =
      new Map<
        string,
        (typeof sessions)[number]
      >();

    for (const session of sessions) {
      const key = `${session.subjectId}|${session.semester}|${normalizeSection(
        session.section,
      )}`;

      if (
        !latestBySubjectClass.has(
          key,
        )
      ) {
        latestBySubjectClass.set(
          key,
          session,
        );
      }
    }

    const subjectRows =
      Array.from(
        latestBySubjectClass.entries(),
      ).map(
        ([key, session]) => {
          const subject =
            subjectMap.get(
              session.subjectId,
            );

          const registrationKey = `${session.subjectId}|${session.semester}|${normalizeSection(
            session.section,
          )}`;

          const registeredStudents =
            registrationMap.get(
              registrationKey,
            ) ?? new Set<string>();

          const records =
            attendanceBySession.get(
              session.id,
            ) ?? [];

          const recordedStudentIds =
            new Set(
              records.map(
                (record) =>
                  record.studentId,
              ),
            );

          const expectedStudents =
            registeredStudents.size;

          const markedStudents =
            expectedStudents
              ? [
                  ...recordedStudentIds,
                ].filter(
                  (studentId) =>
                    registeredStudents.has(
                      studentId,
                    ),
                ).length
              : recordedStudentIds.size;

          const completion =
            expectedStudents
              ? Math.min(
                  100,
                  Math.round(
                    (markedStudents /
                      expectedStudents) *
                      100,
                  ),
                )
              : records.length > 0
                ? 100
                : 0;

          let present = 0;
          let absent = 0;
          let late = 0;
          let excused = 0;

          for (const record of records) {
            const status =
              String(
                record.status ??
                  "",
              )
                .trim()
                .toUpperCase();

            if (
              status === "PRESENT"
            ) {
              present++;
            } else if (
              status === "ABSENT"
            ) {
              absent++;
            } else if (
              status === "LATE"
            ) {
              late++;
            } else if (
              status === "EXCUSED"
            ) {
              excused++;
            }
          }

          return {
            key,
            subjectId:
              session.subjectId,
            subjectName:
              subject?.name ??
              "Unknown Subject",
            semester:
              session.semester,
            section:
              normalizeSection(
                session.section,
              ) ||
              String(
                session.section ??
                  "—",
              ),
            sessionDate:
              session.sessionDate
                ?.toISOString?.() ??
              null,
            expectedStudents,
            markedStudents,
            present,
            absent,
            late,
            excused,
            completion,
            status:
              records.length > 0
                ? ("MARKED" as const)
                : ("UNMARKED" as const),
          };
        },
      );

    subjectRows.sort(
      (a, b) =>
        new Date(
          b.sessionDate ??
            0,
        ).getTime() -
        new Date(
          a.sessionDate ??
            0,
        ).getTime(),
    );

    /* =======================================================
       TODAY
    ======================================================= */

    const todayKey =
      getPreviousDateKey(0);

    const todaySessions =
      sessions.filter(
        (session) =>
          getIndiaDateKey(
            session.sessionDate,
          ) === todayKey,
      );

    /*
     * For the same subject/class on the same day,
     * use the latest session.
     */
    const todayMap =
      new Map<
        string,
        (typeof sessions)[number]
      >();

    for (const session of todaySessions) {
      const key = `${session.subjectId}|${session.semester}|${normalizeSection(
        session.section,
      )}`;

      if (!todayMap.has(key)) {
        todayMap.set(
          key,
          session,
        );
      }
    }

    const todayRows: DailySessionRow[] =
      Array.from(
        todayMap.entries(),
      )
        .map(([key, session]) => {
          const records =
            attendanceBySession.get(
              session.id,
            ) ?? [];

          const registrationKey = `${session.subjectId}|${session.semester}|${normalizeSection(
            session.section,
          )}`;

          const registered =
            registrationMap.get(
              registrationKey,
            ) ?? new Set<string>();

          const recorded =
            new Set(
              records.map(
                (record) =>
                  record.studentId,
              ),
            );

          const expected =
            registered.size;

          const marked =
            expected
              ? [
                  ...recorded,
                ].filter(
                  (id) =>
                    registered.has(id),
                ).length
              : recorded.size;

          const completion =
            expected
              ? Math.min(
                  100,
                  Math.round(
                    (marked /
                      expected) *
                      100,
                  ),
                )
              : records.length > 0
                ? 100
                : 0;

          return {
            key,
            subjectId:
              session.subjectId,
            subjectName:
              subjectMap.get(
                session.subjectId,
              )?.name ??
              "Unknown Subject",
            semester:
              session.semester,
            section:
              normalizeSection(
                session.section,
              ),
            sessionDate:
              session.sessionDate
                ?.toISOString?.() ??
              null,
            status:
              records.length > 0
                ? ("MARKED" as const)
                : ("UNMARKED" as const),
            completion,
          };
        })
        .sort(
          (a, b) =>
            a.subjectName.localeCompare(
              b.subjectName,
            ),
        );

    /* =======================================================
       PREVIOUS 7 DAYS
    ======================================================= */

    const previousSevenDays =
      [];

    for (
      let daysAgo = 1;
      daysAgo <= 7;
      daysAgo++
    ) {
      const dateKey =
        getPreviousDateKey(
          daysAgo,
        );

      const dateLabel =
        getPreviousDateLabel(
          daysAgo,
        );

      const daySessions =
        sessions.filter(
          (session) =>
            getIndiaDateKey(
              session.sessionDate,
            ) === dateKey,
        );

      const dayMap =
        new Map<
          string,
          (typeof sessions)[number]
        >();

      for (const session of daySessions) {
        const key = `${session.subjectId}|${session.semester}|${normalizeSection(
          session.section,
        )}`;

        if (!dayMap.has(key)) {
          dayMap.set(
            key,
            session,
          );
        }
      }

      const dayRows: DailySessionRow[] =
        Array.from(
          dayMap.entries(),
        )
          .map(
            ([key, session]) => {
              const records =
                attendanceBySession.get(
                  session.id,
                ) ?? [];

              const registrationKey = `${session.subjectId}|${session.semester}|${normalizeSection(
                session.section,
              )}`;

              const registered =
                registrationMap.get(
                  registrationKey,
                ) ??
                new Set<string>();

              const recorded =
                new Set(
                  records.map(
                    (record) =>
                      record.studentId,
                  ),
                );

              const expected =
                registered.size;

              const marked =
                expected
                  ? [
                      ...recorded,
                    ].filter(
                      (id) =>
                        registered.has(
                          id,
                        ),
                    ).length
                  : recorded.size;

              const completion =
                expected
                  ? Math.min(
                      100,
                      Math.round(
                        (marked /
                          expected) *
                          100,
                      ),
                    )
                  : records.length > 0
                    ? 100
                    : 0;

              return {
                key,
                subjectId:
                  session.subjectId,
                subjectName:
                  subjectMap.get(
                    session.subjectId,
                  )?.name ??
                  "Unknown Subject",
                semester:
                  session.semester,
                section:
                  normalizeSection(
                    session.section,
                  ),
                sessionDate:
                  session.sessionDate
                    ?.toISOString?.() ??
                  null,
                status:
                  records.length > 0
                    ? ("MARKED" as const)
                    : ("UNMARKED" as const),
                completion,
              };
            },
          )
          .sort(
            (a, b) =>
              a.subjectName.localeCompare(
                b.subjectName,
              ),
          );

      const marked =
        dayRows.filter(
          (row) =>
            row.status ===
            "MARKED",
        ).length;

      const total =
        dayRows.length;

      const coverage =
        total > 0
          ? Math.round(
              (marked / total) *
                100,
            )
          : 0;

      previousSevenDays.push({
        date: dateKey,
        label: dateLabel,
        totalSessions: total,
        markedSessions: marked,
        coverage,
        sessions: dayRows,
      });
    }

    /* =======================================================
       OVERALL STATS
    ======================================================= */

    const markedSessions =
      sessions.filter(
        (session) =>
          (
            attendanceBySession.get(
              session.id,
            ) ?? []
          ).length > 0,
      ).length;

    const unmarkedSessions =
      sessions.length -
      markedSessions;

    const averageCompletion =
      subjectRows.length
        ? round(
            subjectRows.reduce(
              (sum, row) =>
                sum +
                row.completion,
              0,
            ) /
              subjectRows.length,
          )
        : 0;

    return NextResponse.json({
      success: true,

      attendanceOverview: {
        totalSessions:
          sessions.length,

        markedSessions,

        unmarkedSessions,

        averageCompletion,

        subjects:
          subjectRows,

        today: {
          date: todayKey,
          label: "Today",
          sessions:
            todayRows,
        },

        previousSevenDays,
      },
    });
  } catch (error) {
    console.error(
      "FACULTY DASHBOARD OVERVIEW ERROR:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load faculty dashboard overview.",
        attendanceOverview:
          emptyResponse,
      },
      { status: 500 },
    );
  }
}