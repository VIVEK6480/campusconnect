import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

function getFacultyId(request: NextRequest): string | null {
  const authorization =
    request.headers.get("authorization");

  const bearer =
    authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

  const token =
    bearer ||
    request.cookies.get("facultyToken")?.value ||
    request.cookies.get("token")?.value ||
    "";

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded =
      jwt.verify(
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
  } catch (error) {
    console.error(
      "FACULTY PASSWORD JWT ERROR:",
      error
    );
    return null;
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const facultyId =
      getFacultyId(request);

    if (!facultyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized faculty account.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

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
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password and new password fields are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must contain at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New passwords do not match.",
        },
        {
          status: 400,
        }
      );
    }

    const faculty =
      await prisma.user.findUnique({
        where: {
          id: facultyId,
        },
        select: {
          id: true,
          password: true,
          role: true,
        },
      });

    if (
      !faculty ||
      String(faculty.role).toUpperCase() !==
        "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty account not found.",
        },
        {
          status: 404,
        }
      );
    }

    const currentPasswordCorrect =
      await bcrypt.compare(
        currentPassword,
        faculty.password
      );

    if (!currentPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        {
          status: 401,
        }
      );
    }

    const samePassword =
      await bcrypt.compare(
        newPassword,
        faculty.password
      );

    if (samePassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id: faculty.id,
      },
      data: {
        password:
          hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Faculty password updated successfully.",
    });
  } catch (error) {
    console.error(
      "FACULTY PASSWORD UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update faculty password.",
      },
      {
        status: 500,
      }
    );
  }
}