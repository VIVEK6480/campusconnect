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

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const department =
      typeof body.department === "string"
        ? body.department.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const role =
      typeof body.role === "string"
        ? body.role.trim().toUpperCase()
        : "";

    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      !name ||
      !email ||
      !phone ||
      !department ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email, phone, department and password are required.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid full name.",
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
    // FACULTY ROLE ONLY
    // ==========================================

    if (role !== "FACULTY") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid faculty registration request.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CHECK EXISTING EMAIL
    // ==========================================

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
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

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ==========================================
    // CREATE FACULTY
    // ==========================================
    //
    // Faculty User ID is intentionally NOT generated
    // during registration.
    //
    // It will remain NULL until the faculty account
    // is approved by the administrator.
    //
    // ==========================================

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        campusUserId: null,
        role: "FACULTY",
        approvalStatus: "PENDING",
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
    // SUCCESS RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        message:
          "Faculty registration submitted successfully. Your account is waiting for administrator approval.",

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus,
          campusUserId: user.campusUserId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "FACULTY REGISTRATION ERROR:",
      error
    );

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