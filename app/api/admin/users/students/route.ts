import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

/* ============================================================
   TYPES
============================================================ */

type TokenPayload = {
  id?: string;
  userId?: string;
  role?: string;
};

type StudentUpdateBody = {
  id?: string;
  studentId?: string;
  name?: string;
  email?: string;
  campusUserId?: string;
  phone?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  address?: string;
  city?: string;
  state?: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const SEMESTERS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
];

const SECTIONS = [
  "Section A",
  "Section B",
  "Section C",
  "Section D",
];

/* ============================================================
   HELPERS
============================================================ */

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeSection(
  value: string
): string {
  const clean = value
    .trim()
    .replace(/^SECTION\s+/i, "")
    .trim()
    .toUpperCase();

  if (
    !["A", "B", "C", "D"].includes(
      clean
    )
  ) {
    return "";
  }

  return `Section ${clean}`;
}

function sectionVariants(
  section: string
): string[] {
  const normalized =
    normalizeSection(section);

  if (!normalized) {
    return [];
  }

  const letter =
    normalized.replace(
      /^Section\s+/i,
      ""
    );

  return [
    normalized,
    letter,
    normalized.toUpperCase(),
    letter.toLowerCase(),
  ];
}

function getToken(
  request: NextRequest
): string | null {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    authorization?.startsWith(
      "Bearer "
    )
  ) {
    return authorization
      .substring(7)
      .trim();
  }

  return (
    request.cookies.get("token")
      ?.value ??
    request.cookies.get(
      "adminToken"
    )?.value ??
    null
  );
}

function requireAdmin(
  request: NextRequest
):
  | {
      ok: true;
      payload: TokenPayload;
    }
  | {
      ok: false;
      response: NextResponse;
    } {
  const token = getToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized. Admin login required.",
        },
        { status: 401 }
      ),
    };
  }

  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "JWT_SECRET is not configured.",
        },
        { status: 500 }
      ),
    };
  }

  try {
    const payload =
      jwt.verify(
        token,
        secret
      ) as TokenPayload;

    const role = String(
      payload.role ?? ""
    ).toUpperCase();

    if (
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            message:
              "Administrator access required.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      ok: true,
      payload,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Invalid or expired authentication token.",
        },
        { status: 401 }
      ),
    };
  }
}

/* ============================================================
   GET
============================================================ */

export async function GET(
  request: NextRequest
) {
  const auth =
    requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } =
      new URL(request.url);

    const semesterText =
      text(
        searchParams.get(
          "semester"
        )
      );

    const sectionText =
      text(
        searchParams.get(
          "section"
        )
      );

    /*
     * Always expose exact academic options.
     */

    const filters = {
      semesters: SEMESTERS,
      sections: SECTIONS,
    };

    /*
     * No academic selection:
     * return no students.
     */

    if (
      !semesterText ||
      !sectionText
    ) {
      return NextResponse.json({
        success: true,
        students: [],
        count: 0,
        filters,
        hasLoaded: false,
      });
    }

    const semester =
      Number(semesterText);

    if (
      !Number.isInteger(
        semester
      ) ||
      semester < 1 ||
      semester > 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Semester must be between 1 and 8.",
        },
        { status: 400 }
      );
    }

    const section =
      normalizeSection(
        sectionText
      );

    if (!section) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Section must be A, B, C or D.",
        },
        { status: 400 }
      );
    }

    const variants =
      sectionVariants(
        section
      );

    /*
     * IMPORTANT:
     *
     * Some old registrations may contain:
     *
     * Section A
     *
     * while others may contain:
     *
     * A
     *
     * Therefore query both.
     */

    const registrations =
      await prisma.studentRegistration.findMany(
        {
          where: {
            semester,

            section: {
              in: variants,
            },
          },

          select: {
            id: true,
            studentId: true,
            subjectId: true,
            semester: true,
            section: true,
            createdAt: true,

            subject: {
              select: {
                id: true,
                name: true,
                semester: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        }
      );

    /*
     * Unique student IDs.
     */

    const studentIds =
      Array.from(
        new Set(
          registrations.map(
            (registration) =>
              registration.studentId
          )
        )
      );

    if (
      studentIds.length === 0
    ) {
      return NextResponse.json({
        success: true,
        students: [],
        count: 0,
        filters,
        selected: {
          semester,
          section,
        },
        hasLoaded: true,
      });
    }

    /*
     * Load actual STUDENT users.
     */

    const users =
      await prisma.user.findMany({
        where: {
          id: {
            in: studentIds,
          },

          role: "STUDENT",
        },

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

          /*
           * All registrations are included
           * for the detail modal.
           */

          studentRegistrations: {
            select: {
              id: true,
              studentId: true,
              subjectId: true,
              semester: true,
              section: true,
              createdAt: true,

              subject: {
                select: {
                  id: true,
                  name: true,
                  semester: true,
                },
              },
            },

            orderBy: [
              {
                semester: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
          },

          /*
           * Class attendance.
           */

          classAttendances: {
            select: {
              id: true,
              subjectId: true,
              status: true,

              session: {
                select: {
                  semester: true,
                  section: true,
                },
              },
            },
          },

          /*
           * Event attendance remains separate.
           */

          attendances: {
            select: {
              id: true,
              status: true,
            },
          },

          /*
           * Certificates.
           */

          certificates: {
            select: {
              id: true,
              title: true,
              fileUrl: true,
              createdAt: true,
            },

            orderBy: {
              createdAt: "desc",
            },
          },

          /*
           * Club memberships.
           */

          memberships: {
            select: {
              id: true,
              joinedAt: true,

              club: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  logo: true,
                  category: true,
                },
              },
            },

            orderBy: {
              joinedAt: "desc",
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      });

    /*
     * Prepare final response.
     */

    const students =
      users.map(
        (student) => {
          const selectedRegistrations =
            student.studentRegistrations.filter(
              (registration) =>
                registration.semester ===
                  semester &&
                variants.includes(
                  registration.section
                )
            );

          const subjectIds =
            new Set(
              selectedRegistrations.map(
                (registration) =>
                  registration.subjectId
              )
            );

          /*
           * Exact academic group attendance.
           */

          const classAttendance =
            student.classAttendances.filter(
              (attendance) => {
                const attendanceSection =
                  normalizeSection(
                    attendance.session
                      .section
                  );

                return (
                  attendance.session
                    .semester ===
                    semester &&
                  attendanceSection ===
                    section &&
                  subjectIds.has(
                    attendance.subjectId
                  )
                );
              }
            );

          const present =
            classAttendance.filter(
              (item) =>
                item.status
                  .trim()
                  .toUpperCase() ===
                "PRESENT"
            ).length;

          const absent =
            classAttendance.filter(
              (item) =>
                item.status
                  .trim()
                  .toUpperCase() ===
                "ABSENT"
            ).length;

          const total =
            classAttendance.length;

          const attendancePercentage =
            total > 0
              ? Number(
                  (
                    (present /
                      total) *
                    100
                  ).toFixed(1)
                )
              : 0;

          return {
            ...student,

            selectedAcademic: {
              semester,
              section,
            },

            selectedSubjects:
              selectedRegistrations,

            statistics: {
              subjectCount:
                selectedRegistrations.length,

              classAttendanceTotal:
                total,

              classAttendancePresent:
                present,

              classAttendanceAbsent:
                absent,

              classAttendancePercentage:
                attendancePercentage,

              eventAttendanceTotal:
                student.attendances
                  .length,

              eventAttendancePresent:
                student.attendances.filter(
                  (item) =>
                    item.status
                      .trim()
                      .toUpperCase() ===
                    "PRESENT"
                ).length,

              certificateCount:
                student.certificates
                  .length,

              clubCount:
                student.memberships
                  .length,
            },
          };
        }
      );

    return NextResponse.json({
      success: true,
      students,
      count: students.length,
      filters,
      selected: {
        semester,
        section,
      },
      hasLoaded: true,
    });
  } catch (error) {
    console.error(
      "ADMIN STUDENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load students.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH
============================================================ */

export async function PATCH(
  request: NextRequest
) {
  const auth =
    requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body =
      (await request.json()) as StudentUpdateBody;

    const id =
      text(body.id) ||
      text(body.studentId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student ID is required.",
        },
        { status: 400 }
      );
    }

    const name =
      text(body.name);

    const email =
      text(body.email).toLowerCase();

    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name and email are required.",
        },
        { status: 400 }
      );
    }

    const student =
      await prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          role: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student not found.",
        },
        { status: 404 }
      );
    }

    if (
      student.role !== "STUDENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected account is not a student.",
        },
        { status: 400 }
      );
    }

    const duplicateEmail =
      await prisma.user.findFirst({
        where: {
          email,
          id: {
            not: id,
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicateEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another account already uses this email.",
        },
        { status: 409 }
      );
    }

    const campusUserId =
      text(
        body.campusUserId
      );

    if (campusUserId) {
      const duplicateCampusId =
        await prisma.user.findFirst(
          {
            where: {
              campusUserId,
              id: {
                not: id,
              },
            },

            select: {
              id: true,
            },
          }
        );

      if (duplicateCampusId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another account already uses this Student ID.",
          },
          { status: 409 }
        );
      }
    }

    const updated =
      await prisma.user.update({
        where: {
          id,
        },

        data: {
          name,
          email,

          campusUserId:
            campusUserId || null,

          phone:
            text(body.phone) ||
            null,

          department:
            text(
              body.department
            ) || null,

          qualification:
            text(
              body.qualification
            ) || null,

          specialization:
            text(
              body.specialization
            ) || null,

          address:
            text(body.address) ||
            null,

          city:
            text(body.city) ||
            null,

          state:
            text(body.state) ||
            null,
        },

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
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Student updated successfully.",
      student: updated,
    });
  } catch (error) {
    console.error(
      "ADMIN STUDENTS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update student.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE
============================================================ */

export async function DELETE(
  request: NextRequest
) {
  const auth =
    requireAdmin(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } =
      new URL(request.url);

    let id =
      text(
        searchParams.get("id")
      );

    if (!id) {
      try {
        const body =
          (await request.json()) as {
            id?: string;
            studentId?: string;
          };

        id =
          text(body.id) ||
          text(body.studentId);
      } catch {
        // No body.
      }
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student ID is required.",
        },
        { status: 400 }
      );
    }

    const student =
      await prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,
          role: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student not found.",
        },
        { status: 404 }
      );
    }

    if (
      student.role !== "STUDENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected account is not a student.",
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        `${student.name} deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "ADMIN STUDENTS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete student. This account may have related records.",
      },
      { status: 500 }
    );
  }
}