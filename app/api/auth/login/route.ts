import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, password } = body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // JWT SECRET
    // ==========================================

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing");

      return NextResponse.json(
        {
          success: false,
          message: "Server authentication configuration error",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const loginValue = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: loginValue,
          },
          {
            campusUserId: loginValue.toUpperCase(),
          },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // STUDENT ROLE CHECK
    // ==========================================

    if (user.role === "STUDENT") {

      // ========================================
      // PENDING
      // ========================================

      if (user.approvalStatus === "PENDING") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your account is still waiting for Admin/Faculty approval.",
          },
          {
            status: 403,
          }
        );
      }

      // ========================================
      // REJECTED
      // ========================================

      if (user.approvalStatus === "REJECTED") {
        return NextResponse.json(
          {
            success: false,
            message: "Your registration was rejected.",
            rejectionReason:
              user.rejectionReason ||
              "No rejection reason was provided.",
          },
          {
            status: 403,
          }
        );
      }

      // ========================================
      // APPROVED
      // ========================================

      if (user.approvalStatus !== "APPROVED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Your account is not approved for login.",
          },
          {
            status: 403,
          }
        );
      }
    }

    // ==========================================
    // CREATE JWT
    // ==========================================

    const token = jwt.sign(
      {
        id: user.id,
        campusUserId: user.campusUserId,
        email: user.email,
        role: user.role,
      },
      secret,
      {
        expiresIn: "7d",
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    const response = NextResponse.json(
      {
        success: true,
        message: "Login Successful",

        // Keep this for API compatibility.
        // Frontend does not store it in localStorage.
        token,

        user: {
          id: user.id,
          campusUserId: user.campusUserId,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          approvalStatus: user.approvalStatus,
        },
      },
      {
        status: 200,
      }
    );

    // ==========================================
    // HTTP-ONLY AUTH COOKIE
    // ==========================================

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}