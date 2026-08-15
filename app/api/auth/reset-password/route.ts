import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

type ResetTokenPayload = {
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
    // VALIDATION
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

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("RESET PASSWORD: JWT_SECRET IS MISSING");

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

    let payload: ResetTokenPayload;

    try {
      payload = jwt.verify(
        token,
        jwtSecret
      ) as ResetTokenPayload;
    } catch (error) {
      console.error(
        "RESET PASSWORD: INVALID TOKEN",
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

    const isAdminReset =
      payload.purpose === "admin-password-reset";

    const isStudentReset =
      payload.purpose === "student-password-reset";

    if (!isAdminReset && !isStudentReset) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid password reset token.",
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
    // FIND USER
    // =========================================

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Account could not be found.",
        },
        { status: 404 }
      );
    }

    // =========================================
    // ROLE PROTECTION
    // =========================================

    if (isAdminReset) {
      if (
        user.role !== "ADMIN" &&
        user.role !== "SUPER_ADMIN"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This reset link is not valid for this account.",
          },
          { status: 403 }
        );
      }
    }

    if (isStudentReset) {
      if (user.role !== "STUDENT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This reset link is not valid for this account.",
          },
          { status: 403 }
        );
      }
    }

    // =========================================
    // PASSWORD VERSION
    // =========================================

    const currentPasswordVersion =
      crypto
        .createHash("sha256")
        .update(user.password)
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
    // HASH PASSWORD
    // =========================================

    const hashedPassword =
      await bcrypt.hash(newPassword, 12);

    // =========================================
    // UPDATE PASSWORD
    // =========================================

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    // =========================================
    // SUCCESS
    // =========================================

    const loginPortal = isAdminReset
      ? "admin"
      : "student";

    console.log(
      `PASSWORD RESET SUCCESS: ${user.email} (${loginPortal})`
    );

    return NextResponse.json(
      {
        success: true,
        portal: loginPortal,
        message:
          "Password updated successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}