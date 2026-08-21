import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      portal,
    } = body;

    // =========================================================
    // VALIDATION
    // =========================================================

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email / User ID and password are required",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // JWT SECRET
    // =========================================================

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing");

      return NextResponse.json(
        {
          success: false,
          message:
            "Server authentication configuration error",
        },
        {
          status: 500,
        }
      );
    }

    // =========================================================
    // FIND USER
    // =========================================================

    const loginValue = String(email)
      .trim()
      .toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: loginValue,
          },
          {
            campusUserId:
              loginValue.toUpperCase(),
          },
        ],
      },
    });

    // =========================================================
    // USER NOT FOUND
    // =========================================================

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // PASSWORD CHECK
    // =========================================================

    const passwordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // ROLE
    // =========================================================

    const role = String(
      user.role || ""
    ).toUpperCase();

    // =========================================================
    // STUDENT PORTAL ROLE CHECK
    // =========================================================
    //
    // IMPORTANT:
    // If login request comes from Student Login,
    // ONLY STUDENT accounts are allowed.
    //
    // Faculty/Admin/etc. credentials must NEVER
    // receive a JWT or authentication cookie from
    // the Student Login request.
    //
    // =========================================================

    if (
      String(portal || "").toLowerCase() ===
      "student" &&
      role !== "STUDENT"
    ) {
      let message =
        "This account is not a student account. Please use the correct portal.";

      if (role === "FACULTY") {
        message =
          "This is a faculty account. Please use the Faculty Portal.";
      } else if (
        role === "ADMIN" ||
        role === "SUPER_ADMIN"
      ) {
        message =
          "This is an administrator account. Please use the Admin Portal.";
      } else if (
        role === "COORDINATOR"
      ) {
        message =
          "This is a coordinator account. Please use the Coordinator Portal.";
      }

      return NextResponse.json(
        {
          success: false,
          message,

          user: {
            id: user.id,
            campusUserId:
              user.campusUserId,
            name: user.name,
            email: user.email,
            role,
            profileImage:
              user.profileImage,
            approvalStatus:
              user.approvalStatus,
            rejectionReason:
              user.rejectionReason,
          },
        },
        {
          status: 403,
        }
      );
    }

    // =========================================================
    // APPROVAL STATUS
    // STUDENT + FACULTY
    // =========================================================

    if (
      role === "STUDENT" ||
      role === "FACULTY"
    ) {
      // -------------------------------------------------------
      // PENDING
      // -------------------------------------------------------

      if (
        user.approvalStatus ===
        "PENDING"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              role === "FACULTY"
                ? "Your faculty account is still waiting for approval."
                : "Your account is still waiting for Admin/Faculty approval.",

            approvalStatus:
              "PENDING",

            user: {
              id: user.id,
              campusUserId:
                user.campusUserId,
              name: user.name,
              email: user.email,
              role: role,
              profileImage:
                user.profileImage,
              approvalStatus:
                user.approvalStatus,
              rejectionReason:
                user.rejectionReason,
            },
          },
          {
            status: 403,
          }
        );
      }

      // -------------------------------------------------------
      // REJECTED
      // -------------------------------------------------------

      if (
        user.approvalStatus ===
        "REJECTED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              role === "FACULTY"
                ? "Your faculty registration was rejected."
                : "Your registration was rejected.",

            approvalStatus:
              "REJECTED",

            rejectionReason:
              user.rejectionReason ||
              "No rejection reason was provided.",

            user: {
              id: user.id,
              campusUserId:
                user.campusUserId,
              name: user.name,
              email: user.email,
              role: role,
              profileImage:
                user.profileImage,
              approvalStatus:
                user.approvalStatus,
              rejectionReason:
                user.rejectionReason,
            },
          },
          {
            status: 403,
          }
        );
      }

      // -------------------------------------------------------
      // NOT APPROVED
      // -------------------------------------------------------

      if (
        user.approvalStatus !==
        "APPROVED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              role === "FACULTY"
                ? "Your faculty account is not approved for login."
                : "Your account is not approved for login.",

            approvalStatus:
              user.approvalStatus,

            user: {
              id: user.id,
              campusUserId:
                user.campusUserId,
              name: user.name,
              email: user.email,
              role: role,
              profileImage:
                user.profileImage,
              approvalStatus:
                user.approvalStatus,
              rejectionReason:
                user.rejectionReason,
            },
          },
          {
            status: 403,
          }
        );
      }
    }

    // =========================================================
    // CREATE JWT
    // =========================================================

    const token = jwt.sign(
      {
        id: user.id,
        campusUserId:
          user.campusUserId,
        email: user.email,
        role: role,
      },
      secret,
      {
        expiresIn: "7d",
      }
    );

    // =========================================================
    // RESPONSE
    // =========================================================

    const response =
      NextResponse.json(
        {
          success: true,
          message:
            "Login Successful",

          token,

          approvalStatus:
            user.approvalStatus,

          user: {
            id: user.id,
            campusUserId:
              user.campusUserId,
            name: user.name,
            email: user.email,
            role: role,
            profileImage:
              user.profileImage,
            approvalStatus:
              user.approvalStatus,
            rejectionReason:
              user.rejectionReason,
          },
        },
        {
          status: 200,
        }
      );

    // =========================================================
    // HTTP ONLY COOKIE
    // =========================================================

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}