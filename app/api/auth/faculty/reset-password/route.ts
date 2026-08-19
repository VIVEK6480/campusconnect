import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

type FacultyResetTokenPayload = {
  purpose: string;
  userId: string;
  passwordVersion: string;
  iat?: number;
  exp?: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    const confirmPassword =
      typeof body.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    // =========================================
    // TOKEN
    // =========================================

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Password reset token is missing.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // PASSWORD
    // =========================================

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password is required.",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (!confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Please confirm your password.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // JWT SECRET
    // =========================================

    const jwtSecret = process.env.JWT_SECRET?.trim();

    if (!jwtSecret) {
      console.error(
        "FACULTY RESET: JWT_SECRET is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication system is not configured.",
        },
        { status: 500 }
      );
    }

    // =========================================
    // VERIFY TOKEN
    // =========================================

    let payload: FacultyResetTokenPayload;

    try {
      payload = jwt.verify(
        token,
        jwtSecret
      ) as FacultyResetTokenPayload;
    } catch (error) {
      console.error(
        "FACULTY RESET: INVALID OR EXPIRED TOKEN",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "This password reset link is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    // =========================================
    // TOKEN PURPOSE
    // =========================================

    if (
      payload.purpose !==
      "faculty-password-reset"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This reset link is not valid for a faculty account.",
        },
        { status: 401 }
      );
    }

    // =========================================
    // USER ID
    // =========================================

    if (!payload.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid password reset token.",
        },
        { status: 401 }
      );
    }

    // =========================================
    // FIND FACULTY
    // =========================================

    const faculty = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });

    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          message: "Faculty account could not be found.",
        },
        { status: 404 }
      );
    }

    // =========================================
    // FACULTY ROLE PROTECTION
    // =========================================

    if (faculty.role !== "FACULTY") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This reset link is not valid for this account.",
        },
        { status: 403 }
      );
    }

    // =========================================
    // PASSWORD VERSION
    // =========================================

    const currentPasswordVersion =
      crypto
        .createHash("sha256")
        .update(faculty.password)
        .digest("hex");

    if (
      !payload.passwordVersion ||
      currentPasswordVersion !==
        payload.passwordVersion
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password reset link has already been used or is no longer valid.",
        },
        { status: 401 }
      );
    }

    // =========================================
    // HASH NEW PASSWORD
    // =========================================

    const hashedPassword =
      await bcrypt.hash(newPassword, 12);

    // =========================================
    // UPDATE PASSWORD
    // =========================================

    await prisma.user.update({
      where: {
        id: faculty.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    // =========================================
    // SUCCESS
    // =========================================

    console.log(
      `FACULTY PASSWORD RESET SUCCESS: ${faculty.email}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Faculty password updated successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FACULTY RESET PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset faculty password. Please try again.",
      },
      { status: 500 }
    );
  }
}