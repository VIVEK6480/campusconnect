import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  studentId?: string;
  role?: string;
};

function json(
  data: unknown,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "private, no-store, max-age=0",
    },
  });
}

/* ============================================================
   GET TOKEN
   Cookie first, Bearer token fallback
============================================================ */

function getToken(
  request: NextRequest
): string | null {
  const cookieToken =
    request.cookies.get("token")?.value;

  if (cookieToken) {
    return cookieToken;
  }

  const authorization =
    request.headers.get(
      "authorization"
    ) || "";

  if (
    authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return (
      authorization
        .slice(7)
        .trim() || null
    );
  }

  return null;
}

/* ============================================================
   STUDENT AUTH
============================================================ */

function authenticateStudent(
  request: NextRequest
) {
  const token = getToken(request);

  if (!token) {
    return {
      ok: false as const,
      response: json(
        {
          success: false,
          message:
            "Student authentication is required.",
        },
        401
      ),
    };
  }

  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "JWT_SECRET is missing."
    );

    return {
      ok: false as const,
      response: json(
        {
          success: false,
          message:
            "Server authentication configuration error.",
        },
        500
      ),
    };
  }

  try {
    const decoded =
      jwt.verify(
        token,
        secret
      ) as TokenPayload;

    const role =
      String(
        decoded.role || ""
      ).toUpperCase();

    const studentId =
      typeof decoded.id === "string"
        ? decoded.id
        : typeof decoded.userId ===
            "string"
        ? decoded.userId
        : typeof decoded.studentId ===
            "string"
        ? decoded.studentId
        : typeof decoded.sub ===
            "string"
        ? decoded.sub
        : "";

    if (!studentId) {
      return {
        ok: false as const,
        response: json(
          {
            success: false,
            message:
              "Invalid student session.",
          },
          401
        ),
      };
    }

    if (
      role &&
      role !== "STUDENT"
    ) {
      return {
        ok: false as const,
        response: json(
          {
            success: false,
            message:
              "Student access is required.",
          },
          403
        ),
      };
    }

    return {
      ok: true as const,
      studentId,
    };
  } catch (error) {
    console.error(
      "STUDENT PROFILE JWT ERROR:",
      error
    );

    return {
      ok: false as const,
      response: json(
        {
          success: false,
          message:
            "Invalid or expired student session.",
        },
        401
      ),
    };
  }
}

/* ============================================================
   PROFILE SELECT
============================================================ */

const studentSelect = {
  id: true,
  campusUserId: true,
  name: true,
  email: true,
  phone: true,
  department: true,
  designation: true,
  qualification: true,
  specialization: true,
  address: true,
  city: true,
  state: true,
  profileImage: true,
  role: true,
  approvalStatus: true,
  createdAt: true,
} as const;

/* ============================================================
   GET PROFILE
============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      authenticateStudent(request);

    if (!auth.ok) {
      return auth.response;
    }

    const student =
      await prisma.user.findUnique({
        where: {
          id: auth.studentId,
        },
        select: studentSelect,
      });

    if (!student) {
      return json(
        {
          success: false,
          message:
            "Student account not found.",
        },
        404
      );
    }

    if (
      String(student.role).toUpperCase() !==
      "STUDENT"
    ) {
      return json(
        {
          success: false,
          message:
            "Only student accounts can access this profile.",
        },
        403
      );
    }

    /* ========================================================
       ACADEMIC INFORMATION
    ======================================================== */

    const registrations =
      await prisma.studentRegistration.findMany(
        {
          where: {
            studentId: student.id,
          },
          select: {
            semester: true,
            section: true,
            subject: {
              select: {
                name: true,
              },
            },
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
        }
      );

    const firstRegistration =
      registrations[0];

    const subjects =
      registrations
        .map(
          (registration) =>
            registration.subject
              ?.name || ""
        )
        .filter(Boolean)
        .filter(
          (
            subject,
            index,
            array
          ) =>
            array.indexOf(
              subject
            ) === index
        );

    const academic =
      firstRegistration
        ? {
            semester:
              firstRegistration.semester,
            section:
              firstRegistration.section,
            subjects,
          }
        : {
            semester: 0,
            section: "",
            subjects,
          };

    return json({
      success: true,
      student,
      academic,
    });
  } catch (error) {
    console.error(
      "GET STUDENT PROFILE ERROR:",
      error
    );

    return json(
      {
        success: false,
        message:
          "Unable to load student profile.",
      },
      500
    );
  }
}

/* ============================================================
   UPDATE PROFILE
============================================================ */

export async function PATCH(
  request: NextRequest
) {
  try {
    const auth =
      authenticateStudent(request);

    if (!auth.ok) {
      return auth.response;
    }

    let body: Record<
      string,
      unknown
    >;

    try {
      body =
        (await request.json()) as Record<
          string,
          unknown
        >;
    } catch {
      return json(
        {
          success: false,
          message:
            "Invalid request body.",
        },
        400
      );
    }

    const clean = (
      value: unknown
    ): string => {
      return typeof value ===
        "string"
        ? value.trim()
        : "";
    };

    const name =
      clean(body.name);

    const email =
      clean(body.email).toLowerCase();

    const phone =
      clean(body.phone);

    const department =
      clean(body.department);

    const qualification =
      clean(body.qualification);

    const specialization =
      clean(body.specialization);

    const address =
      clean(body.address);

    const city =
      clean(body.city);

    const state =
      clean(body.state);

    const hasProfileImage =
      Object.prototype.hasOwnProperty.call(
        body,
        "profileImage"
      );

    const profileImage =
      body.profileImage === null
        ? null
        : clean(
            body.profileImage
          );

    /* ========================================================
       VALIDATION
    ======================================================== */

    if (!name) {
      return json(
        {
          success: false,
          message:
            "Please enter your full name.",
        },
        400
      );
    }

    if (!email) {
      return json(
        {
          success: false,
          message:
            "Please enter your email address.",
        },
        400
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        400
      );
    }

    /* ========================================================
       PHOTO VALIDATION
    ======================================================== */

    if (
      hasProfileImage &&
      profileImage
    ) {
      if (
        !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(
          profileImage
        )
      ) {
        return json(
          {
            success: false,
            message:
              "Only PNG, JPG/JPEG and WebP profile photos are supported.",
          },
          400
        );
      }

      if (
        profileImage.length >
        4_000_000
      ) {
        return json(
          {
            success: false,
            message:
              "Profile photo is too large. Please choose an image below 2 MB.",
          },
          413
        );
      }
    }

    /* ========================================================
       CHECK CURRENT STUDENT
    ======================================================== */

    const currentStudent =
      await prisma.user.findUnique({
        where: {
          id: auth.studentId,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (!currentStudent) {
      return json(
        {
          success: false,
          message:
            "Student account not found.",
        },
        404
      );
    }

    if (
      String(
        currentStudent.role
      ).toUpperCase() !==
      "STUDENT"
    ) {
      return json(
        {
          success: false,
          message:
            "Only students can update this profile.",
        },
        403
      );
    }

    /* ========================================================
       DUPLICATE EMAIL
    ======================================================== */

    const duplicateEmail =
      await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: auth.studentId,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicateEmail) {
      return json(
        {
          success: false,
          message:
            "This email address is already being used by another account.",
        },
        409
      );
    }

    /* ========================================================
       UPDATE DATA
    ======================================================== */

    const data: Record<
      string,
      string | null
    > = {
      name,
      email,
      phone: phone || null,
      department:
        department || null,
      qualification:
        qualification || null,
      specialization:
        specialization || null,
      address:
        address || null,
      city: city || null,
      state: state || null,
    };

    if (hasProfileImage) {
      data.profileImage =
        profileImage || null;
    }

    const updatedStudent =
      await prisma.user.update({
        where: {
          id: auth.studentId,
        },
        data,
        select: studentSelect,
      });

    return json({
      success: true,
      message:
        "Student profile updated successfully.",
      student:
        updatedStudent,
    });
  } catch (error) {
    console.error(
      "UPDATE STUDENT PROFILE ERROR:",
      error
    );

    return json(
      {
        success: false,
        message:
          "Unable to update student profile.",
      },
      500
    );
  }
}