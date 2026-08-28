import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid full name.",
        },
        { status: 400 }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // FACULTY ONLY
    // ==========================================

    if (
      typeof body.role !== "string" ||
      body.role.toUpperCase() !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid faculty registration request.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CHECK EXISTING EMAIL
    // ==========================================

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          role: true,
          approvalStatus: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // ==========================================
    // CREATE FACULTY ACCOUNT
    //
    // Faculty ID is generated only after approval.
    // ==========================================

    const user =
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,

          // Faculty ID is generated after approval
          campusUserId: null,

          role: "FACULTY",
          approvalStatus: "PENDING",
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          approvalStatus: true,
          campusUserId: true,
          createdAt: true,
        },
      });

    // ==========================================
    // CREATE APPROVAL RECORD
    // ==========================================

    await prisma.userApproval.create({
      data: {
        userId: user.id,
        actionById: "PENDING",
        status: "PENDING",
      },
    });

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Faculty registration submitted successfully. Your account will be reviewed by the administrator. Your Faculty ID will be generated after approval.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "FACULTY REGISTRATION ERROR:",
      error
    );

    // ==========================================
    // PRISMA UNIQUE ERROR
    // ==========================================

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with the provided information already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating the faculty account.",
        },
      { status: 500 }
    );
  }
}