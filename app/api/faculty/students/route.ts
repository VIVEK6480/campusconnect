import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

function getFacultyId(
  request: NextRequest
): string | null {
  const authorization =
    request.headers.get("authorization");

  const bearer =
    authorization?.startsWith("Bearer ")
      ? authorization
          .slice(7)
          .trim()
      : "";

  const token =
    request.cookies.get("token")?.value ||
    bearer;

  if (
    !token ||
    !process.env.JWT_SECRET
  ) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as TokenPayload;

    const role = String(
      decoded.role ?? ""
    ).toUpperCase();

    if (role !== "FACULTY") {
      return null;
    }

    return (
      decoded.id ||
      decoded.userId ||
      decoded.facultyId ||
      (typeof decoded.sub === "string"
        ? decoded.sub
        : null) ||
      null
    );
  } catch {
    return null;
  }
}

/* =========================================================
   REQUIRE FACULTY
========================================================= */

async function requireFaculty(
  request: NextRequest
) {
  const facultyId =
    getFacultyId(request);

  if (!facultyId) {
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
        id: facultyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

  if (
    !faculty ||
    String(faculty.role).toUpperCase() !==
      "FACULTY"
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Only faculty can manage students.",
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
   SEARCH
========================================================= */

function buildSearch(
  search: string
): Prisma.UserWhereInput | undefined {
  const value = search.trim();

  if (!value) {
    return undefined;
  }

  return {
    OR: [
      {
        name: {
          contains: value,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: value,
          mode: "insensitive",
        },
      },
      {
        campusUserId: {
          contains: value,
          mode: "insensitive",
        },
      },
      {
        department: {
          contains: value,
          mode: "insensitive",
        },
      },
      {
        phone: {
          contains: value,
          mode: "insensitive",
        },
      },
      {
        qualification: {
          contains: value,
          mode: "insensitive",
        },
      },
      {
        specialization: {
          contains: value,
          mode: "insensitive",
        },
      },
    ],
  };
}

/* =========================================================
   PRESENT CHECK
========================================================= */

function isPresent(
  status: string | null | undefined
) {
  return (
    String(status ?? "")
      .trim()
      .toUpperCase() === "PRESENT"
  );
}

/* =========================================================
   GET STUDENTS
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireFaculty(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } =
      new URL(request.url);

    const semesterParam =
      searchParams.get("semester") ?? "";

    const sectionParam =
      searchParams.get("section") ?? "";

    const search =
      searchParams.get("search") ?? "";

    const semester =
      Number(semesterParam);

    /*
     * IMPORTANT:
     * Student list will only be returned
     * after semester + section are selected.
     */

    if (
      !semesterParam ||
      !sectionParam ||
      !Number.isInteger(semester) ||
      semester < 1
    ) {
      return NextResponse.json({
        success: true,
        count: 0,
        students: [],
      });
    }

    const section =
      sectionParam.trim().toUpperCase();

    if (!section) {
      return NextResponse.json({
        success: true,
        count: 0,
        students: [],
      });
    }

    /* =====================================================
       BASE WHERE
    ===================================================== */

    const searchWhere =
      buildSearch(search);

    const where: Prisma.UserWhereInput = {
      role: "STUDENT",
      approvalStatus: "APPROVED",

      /*
       * CORE FILTER:
       *
       * Student must have a registration
       * matching EXACT semester + section.
       */

      studentRegistrations: {
        some: {
          semester,
          section,
        },
      },

      ...(searchWhere ?? {}),
    };

    /* =====================================================
       QUERY
    ===================================================== */

    const students =
      await prisma.user.findMany({
        where,

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

          /* =================================================
             REGISTRATIONS
          ================================================= */

          studentRegistrations: {
            where: {
              semester,
              section,
            },

            orderBy: [
              {
                semester: "asc",
              },
              {
                subject: {
                  name: "asc",
                },
              },
            ],

            select: {
              id: true,
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
          },

          /* =================================================
             CLASS ATTENDANCE
          ================================================= */

          classAttendances: {
            orderBy: [
              {
                session: {
                  sessionDate: "desc",
                },
              },
              {
                markedAt: "desc",
              },
            ],

            select: {
              id: true,
              status: true,
              markedAt: true,
              updatedAt: true,
              subjectId: true,

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
                  semester: true,
                  section: true,
                  sessionDate: true,

                  faculty: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },

          /* =================================================
             EVENT ATTENDANCE
          ================================================= */

          attendances: {
            orderBy: {
              markedAt: "desc",
            },

            select: {
              id: true,
              status: true,
              markedAt: true,
              updatedAt: true,

              event: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  venue: true,
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
          },

          /* =================================================
             CERTIFICATES
          ================================================= */

          certificates: {
            orderBy: {
              createdAt: "desc",
            },

            select: {
              id: true,
              title: true,
              fileUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          /* =================================================
             CLUB MEMBERSHIPS
          ================================================= */

          memberships: {
            orderBy: {
              joinedAt: "desc",
            },

            select: {
              id: true,
              joinedAt: true,

              club: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  logo: true,
                },
              },
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      });

    /* =====================================================
       BUILD PAYLOAD
    ===================================================== */

    const payload = students.map(
      (student) => {
        /*
         * Attendance is restricted to the
         * selected semester + section.
         *
         * This prevents attendance from another
         * class/group affecting the displayed
         * percentage.
         */

        const filteredClassAttendance =
          student.classAttendances.filter(
            (attendance) =>
              attendance.session
                .semester === semester &&
              String(
                attendance.session.section
              ).toUpperCase() === section
          );

        const classAttendanceTotal =
          filteredClassAttendance.length;

        const classAttendancePresent =
          filteredClassAttendance.filter(
            (item) =>
              isPresent(item.status)
          ).length;

        const classAttendanceAbsent =
          classAttendanceTotal -
          classAttendancePresent;

        const eventAttendanceTotal =
          student.attendances.length;

        const eventAttendancePresent =
          student.attendances.filter(
            (item) =>
              isPresent(item.status)
          ).length;

        const subjectCount =
          new Set(
            student.studentRegistrations.map(
              (item) => item.subject.id
            )
          ).size;

        return {
          ...student,

          statistics: {
            subjectCount,

            classAttendanceTotal,

            classAttendancePresent,

            classAttendanceAbsent,

            classAttendancePercentage:
              classAttendanceTotal > 0
                ? Number(
                    (
                      (classAttendancePresent /
                        classAttendanceTotal) *
                      100
                    ).toFixed(1)
                  )
                : 0,

            eventAttendanceTotal,

            eventAttendancePresent,

            certificateCount:
              student.certificates.length,

            clubCount:
              student.memberships.length,
          },
        };
      }
    );

    return NextResponse.json({
      success: true,
      count: payload.length,
      students: payload,
    });
  } catch (error) {
    console.error(
      "FACULTY STUDENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load students.",
        students: [],
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE STUDENT
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const auth =
      await requireFaculty(request);

    if (!auth.ok) {
      return auth.response;
    }

    let body: {
      studentId?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      department?: unknown;
      qualification?: unknown;
      specialization?: unknown;
      address?: unknown;
      city?: unknown;
      state?: unknown;
    };

    try {
      body =
        (await request.json()) as typeof body;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    if (!studentId) {
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
          id: studentId,
        },

        select: {
          id: true,
          role: true,
        },
      });

    if (
      !student ||
      String(student.role).toUpperCase() !==
        "STUDENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student account not found.",
        },
        { status: 404 }
      );
    }

    const cleanString = (
      value: unknown
    ) => {
      if (
        typeof value !== "string"
      ) {
        return undefined;
      }

      const trimmed = value.trim();

      return trimmed || null;
    };

    const name =
      cleanString(body.name);

    const email =
      cleanString(body.email);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student email is required.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       EMAIL DUPLICATE CHECK
    ===================================================== */

    const existingEmail =
      await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: studentId,
          },
        },

        select: {
          id: true,
        },
      });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This email is already being used by another account.",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    await prisma.user.update({
      where: {
        id: studentId,
      },

      data: {
        name,
        email,

        phone: cleanString(
          body.phone
        ),

        department: cleanString(
          body.department
        ),

        qualification:
          cleanString(
            body.qualification
          ),

        specialization:
          cleanString(
            body.specialization
          ),

        address: cleanString(
          body.address
        ),

        city: cleanString(
          body.city
        ),

        state: cleanString(
          body.state
        ),
      },
    });

    /* =====================================================
       RETURN UPDATED STUDENT
    ===================================================== */

    const updated =
      await prisma.user.findUnique({
        where: {
          id: studentId,
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

          studentRegistrations: {
            orderBy: [
              {
                semester: "asc",
              },
              {
                subject: {
                  name: "asc",
                },
              },
            ],

            select: {
              id: true,
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
          },

          classAttendances: {
            orderBy: [
              {
                session: {
                  sessionDate: "desc",
                },
              },
              {
                markedAt: "desc",
              },
            ],

            select: {
              id: true,
              status: true,
              markedAt: true,
              updatedAt: true,
              subjectId: true,

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
                  semester: true,
                  section: true,
                  sessionDate: true,

                  faculty: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },

          attendances: {
            orderBy: {
              markedAt: "desc",
            },

            select: {
              id: true,
              status: true,
              markedAt: true,
              updatedAt: true,

              event: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  venue: true,
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
          },

          certificates: {
            orderBy: {
              createdAt: "desc",
            },

            select: {
              id: true,
              title: true,
              fileUrl: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          memberships: {
            orderBy: {
              joinedAt: "desc",
            },

            select: {
              id: true,
              joinedAt: true,

              club: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  logo: true,
                },
              },
            },
          },
        },
      });

    if (!updated) {
      throw new Error(
        "Updated student could not be loaded."
      );
    }

    const filteredAttendance =
      updated.classAttendances;

    const total =
      filteredAttendance.length;

    const present =
      filteredAttendance.filter(
        (item) =>
          isPresent(item.status)
      ).length;

    const updatedStudent = {
      ...updated,

      statistics: {
        subjectCount:
          new Set(
            updated.studentRegistrations.map(
              (item) =>
                item.subject.id
            )
          ).size,

        classAttendanceTotal: total,

        classAttendancePresent:
          present,

        classAttendanceAbsent:
          total - present,

        classAttendancePercentage:
          total > 0
            ? Number(
                (
                  (present / total) *
                  100
                ).toFixed(1)
              )
            : 0,

        eventAttendanceTotal:
          updated.attendances.length,

        eventAttendancePresent:
          updated.attendances.filter(
            (item) =>
              isPresent(item.status)
          ).length,

        certificateCount:
          updated.certificates.length,

        clubCount:
          updated.memberships.length,
      },
    };

    return NextResponse.json({
      success: true,
      message:
        "Student updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error(
      "FACULTY STUDENT PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update student.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE STUDENT
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth =
      await requireFaculty(request);

    if (!auth.ok) {
      return auth.response;
    }

    let body: {
      studentId?: unknown;
    };

    try {
      body =
        (await request.json()) as {
          studentId?: unknown;
        };
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const studentId =
      typeof body.studentId === "string"
        ? body.studentId.trim()
        : "";

    if (!studentId) {
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
          id: studentId,
        },

        select: {
          id: true,
          role: true,
          name: true,
        },
      });

    if (
      !student ||
      String(student.role).toUpperCase() !==
        "STUDENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student account not found.",
        },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: {
        id: studentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${student.name} deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "FACULTY STUDENTS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete student.",
      },
      { status: 500 }
    );
  }
}