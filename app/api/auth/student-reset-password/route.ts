import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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

    // -----------------------------------------
    // VALIDATE TOKEN
    // -----------------------------------------

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Password reset token is missing.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // VALIDATE PASSWORD
    // -----------------------------------------

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
            "Password must be at least 8 characters long.",
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

    // -----------------------------------------
    // JWT SECRET
    // -----------------------------------------

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET IS MISSING.");

      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication system is not configured.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // VERIFY RESET TOKEN
    // -----------------------------------------

    let decoded: ResetTokenPayload;

    try {
      decoded = jwt.verify(
        token,
        jwtSecret
      ) as ResetTokenPayload;
    } catch (error) {
      console.error(
        "STUDENT RESET JWT VERIFY ERROR:",
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

    // -----------------------------------------
    // CHECK TOKEN PURPOSE
    // -----------------------------------------

    if (
      decoded.purpose !==
      "student-password-reset"
    ) {
      console.error(
        "INVALID STUDENT RESET TOKEN PURPOSE:",
        decoded.purpose
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid student password reset link.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // CHECK USER ID
    // -----------------------------------------

    if (!decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid password reset token.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // FIND STUDENT
    // -----------------------------------------

    const student = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student account could not be found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // STUDENT ONLY
    // -----------------------------------------

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This reset link is only valid for student accounts.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // PASSWORD VERSION CHECK
    // -----------------------------------------

    const currentPasswordVersion =
      crypto
        .createHash("sha256")
        .update(student.password)
        .digest("hex");

    if (
      decoded.passwordVersion !==
      currentPasswordVersion
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

    // -----------------------------------------
    // HASH NEW PASSWORD
    // -----------------------------------------

    const hashedPassword =
      await bcrypt.hash(newPassword, 12);

    // -----------------------------------------
    // UPDATE PASSWORD
    // -----------------------------------------

    await prisma.user.update({
      where: {
        id: student.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    console.log(
      "STUDENT PASSWORD UPDATED:",
      student.email
    );

    return NextResponse.json({
      success: true,
      message:
        "Your student password has been changed successfully.",
    });
  } catch (error) {
    console.error(
      "STUDENT RESET PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to reset student password.",
      },
      { status: 500 }
    );
  }
}