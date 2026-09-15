import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
   TOKEN
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
   AUTHENTICATE STUDENT
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
      "STUDENT PASSWORD JWT ERROR:",
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
   CHANGE PASSWORD
============================================================ */

export async function POST(
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

    const currentPassword =
      typeof body.currentPassword ===
      "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword ===
      "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword ===
      "string"
        ? body.confirmPassword
        : "";

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return json(
        {
          success: false,
          message:
            "Current password, new password and confirmation are required.",
        },
        400
      );
    }

    if (
      newPassword.length < 6
    ) {
      return json(
        {
          success: false,
          message:
            "New password must contain at least 6 characters.",
        },
        400
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return json(
        {
          success: false,
          message:
            "New password and confirm password do not match.",
        },
        400
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return json(
        {
          success: false,
          message:
            "New password must be different from the current password.",
        },
        400
      );
    }

    /* ========================================================
       GET STUDENT PASSWORD
    ======================================================== */

    const student =
      await prisma.user.findUnique({
        where: {
          id: auth.studentId,
        },
        select: {
          id: true,
          password: true,
          role: true,
        },
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
            "Only students can change this password.",
        },
        403
      );
    }

    /* ========================================================
       VERIFY CURRENT PASSWORD
    ======================================================== */

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        student.password
      );

    if (!passwordMatches) {
      return json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        401
      );
    }

    /* ========================================================
       HASH NEW PASSWORD
    ======================================================== */

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id: auth.studentId,
      },
      data: {
        password:
          hashedPassword,
      },
    });

    return json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "CHANGE STUDENT PASSWORD ERROR:",
      error
    );

    return json(
      {
        success: false,
        message:
          "Unable to change student password.",
      },
      500
    );
  }
}