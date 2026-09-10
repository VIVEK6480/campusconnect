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

type FacultyBody = {
  id?: string;
  facultyId?: string;

  name?: string;
  email?: string;
  campusUserId?: string;

  department?: string;
  designation?: string;

  phone?: string;
  qualification?: string;
  specialization?: string;

  joiningDate?: string;

  address?: string;
  city?: string;
  state?: string;

  officeRoom?: string;
  officeHours?: string;
};

/* ============================================================
   HELPERS
============================================================ */

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
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
   FACULTY SELECT
============================================================ */

const FACULTY_DEPARTMENTS = [
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

const facultySelect = {
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
} as const;

/* ============================================================
   GET FACULTY
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

    const search =
      text(
        searchParams.get(
          "search"
        )
      ).toLowerCase();

    const department =
      text(
        searchParams.get(
          "department"
        )
      );

    const faculty =
      await prisma.user.findMany({
        where: {
          role: "FACULTY",

          ...(department &&
          department !== "ALL"
            ? {
                department: {
                  equals:
                    department,
                  mode:
                    "insensitive",
                },
              }
            : {}),

          ...(search
            ? {
                OR: [
                  {
                    name: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    email: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    campusUserId: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    department: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                  {
                    designation: {
                      contains:
                        search,
                      mode:
                        "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },

        orderBy: {
          name: "asc",
        },

        select: facultySelect,
      });

    /*
     * Dynamic department options.
     */

    const departmentRows =
      await prisma.user.findMany({
        where: {
          role: "FACULTY",

          department: {
            not: null,
          },
        },

        select: {
          department: true,
        },

        orderBy: {
          department: "asc",
        },
      });

    const departments =
      Array.from(
        new Set([
          ...FACULTY_DEPARTMENTS,
          ...departmentRows
            .map(
              (item) =>
                text(
                  item.department
                )
            )
            .filter(Boolean),
        ])
      );

    return NextResponse.json({
      success: true,
      count: faculty.length,
      faculty,
      departments,
    });
  } catch (error) {
    console.error(
      "ADMIN FACULTY GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load faculty.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH FACULTY
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
      (await request.json()) as FacultyBody;

    /*
     * SUPPORT BOTH:
     *
     * id
     * facultyId
     *
     * This fixes the frontend/backend mismatch.
     */

    const facultyId =
      text(body.id) ||
      text(body.facultyId);

    if (!facultyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty ID is required.",
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

    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty not found.",
        },
        { status: 404 }
      );
    }

    if (
      faculty.role !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected account is not faculty.",
        },
        { status: 400 }
      );
    }

    /*
     * Duplicate email check.
     */

    const duplicateEmail =
      await prisma.user.findFirst({
        where: {
          email,

          id: {
            not: facultyId,
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

    /*
     * Duplicate faculty ID.
     */

    const campusUserId =
      text(
        body.campusUserId
      );

    if (campusUserId) {
      const duplicateId =
        await prisma.user.findFirst(
          {
            where: {
              campusUserId,

              id: {
                not: facultyId,
              },
            },

            select: {
              id: true,
            },
          }
        );

      if (duplicateId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another account already uses this Faculty ID.",
          },
          { status: 409 }
        );
      }
    }

    /*
     * Joining date.
     */

    let joiningDate:
      Date | null = null;

    const joiningDateText =
      text(
        body.joiningDate
      );

    if (joiningDateText) {
      const parsed =
        new Date(
          joiningDateText
        );

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid joining date.",
          },
          { status: 400 }
        );
      }

      joiningDate = parsed;
    }

    /*
     * Update.
     */

    const updated =
      await prisma.user.update({
        where: {
          id: facultyId,
        },

        data: {
          name,
          email,

          campusUserId:
            campusUserId || null,

          department:
            text(
              body.department
            ) || null,

          designation:
            text(
              body.designation
            ) || null,

          phone:
            text(body.phone) ||
            null,

          qualification:
            text(
              body.qualification
            ) || null,

          specialization:
            text(
              body.specialization
            ) || null,

          joiningDate,

          address:
            text(body.address) ||
            null,

          city:
            text(body.city) ||
            null,

          state:
            text(body.state) ||
            null,

          officeRoom:
            text(
              body.officeRoom
            ) || null,

          officeHours:
            text(
              body.officeHours
            ) || null,
        },

        select: facultySelect,
      });

    return NextResponse.json({
      success: true,
      message:
        "Faculty updated successfully.",
      faculty: updated,
    });
  } catch (error) {
    console.error(
      "ADMIN FACULTY PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update faculty.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE FACULTY
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

    let facultyId =
      text(
        searchParams.get(
          "id"
        )
      ) ||
      text(
        searchParams.get(
          "facultyId"
        )
      );

    /*
     * Also support JSON body.
     */

    if (!facultyId) {
      try {
        const body =
          (await request.json()) as FacultyBody;

        facultyId =
          text(body.id) ||
          text(body.facultyId);
      } catch {
        // No body.
      }
    }

    if (!facultyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty ID is required.",
        },
        { status: 400 }
      );
    }

    const faculty =
      await prisma.user.findUnique({
        where: {
          id: facultyId,
        },

        select: {
          id: true,
          name: true,
          role: true,
        },
      });

    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty not found.",
        },
        { status: 404 }
      );
    }

    if (
      faculty.role !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected account is not faculty.",
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: {
        id: facultyId,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        `${faculty.name} deleted successfully.`,
    });
  } catch (error) {
    console.error(
      "ADMIN FACULTY DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete faculty. The account may have related records.",
      },
      { status: 500 }
    );
  }
}