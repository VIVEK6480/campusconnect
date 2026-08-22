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
            "Email / User ID and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // DETERMINE REQUESTED PORTAL
    // =========================================================
    //
    // The frontend currently does not send `portal`.
    // Therefore we also identify the portal from the page
    // that submitted the login request.
    //
    // Student:
    // /auth/login
    //
    // Faculty:
    // /faculty/login
    //
    // If an explicit portal is provided, it is used first.
    //
    // =========================================================

    const explicitPortal = String(
      portal || ""
    )
      .trim()
      .toLowerCase();

    const referer =
      req.headers.get("referer") || "";

    let requestedPortal =
      explicitPortal;

    if (!requestedPortal) {
      try {
        const refererUrl =
          new URL(referer);

        const refererPath =
          refererUrl.pathname;

        if (
          refererPath ===
          "/auth/login"
        ) {
          requestedPortal =
            "student";
        } else if (
          refererPath ===
          "/faculty/login"
        ) {
          requestedPortal =
            "faculty";
        }
      } catch {
        // Invalid or missing Referer.
        // Keep requestedPortal empty.
      }
    }

    // =========================================================
    // STRICT PORTAL VALIDATION
    // =========================================================
    //
    // IMPORTANT:
    // Never allow a generic login request without knowing
    // which portal requested authentication.
    //
    // This prevents:
    //
    // Student portal -> Faculty account
    // Faculty portal -> Student account
    //
    // =========================================================

    if (
      requestedPortal !== "student" &&
      requestedPortal !== "faculty"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to identify the login portal. Please open the correct Student or Faculty Login Portal.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // JWT SECRET
    // =========================================================

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET is missing"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Server authentication configuration error.",
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

    const user =
      await prisma.user.findFirst({
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
            "Invalid email or password.",
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
            "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    // =========================================================
    // NORMALIZE ROLE
    // =========================================================

    const role = String(
      user.role || ""
    )
      .trim()
      .toUpperCase();

    // =========================================================
    // STUDENT PORTAL
    // =========================================================
    //
    // ONLY STUDENT accounts are allowed.
    //
    // Faculty/Admin/Coordinator/etc. can NEVER receive
    // a JWT from Student Portal.
    //
    // =========================================================

    if (
      requestedPortal ===
        "student" &&
      role !== "STUDENT"
    ) {
      let message =
        "This account is not a student account. Please use the correct portal.";

      if (
        role === "FACULTY"
      ) {
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

      // IMPORTANT:
      // No JWT.
      // No cookie.
      // No authentication.
      return NextResponse.json(
        {
          success: false,
          message,
          approvalStatus:
            user.approvalStatus,

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
    // FACULTY PORTAL
    // =========================================================
    //
    // ONLY FACULTY accounts are allowed.
    //
    // Student/Admin/etc. credentials can NEVER receive
    // a JWT from Faculty Portal.
    //
    // =========================================================

    if (
      requestedPortal ===
        "faculty" &&
      role !== "FACULTY"
    ) {
      let message =
        "This account is not a faculty account. Please use the correct portal.";

      if (
        role === "STUDENT"
      ) {
        message =
          "This is a student account. Please use the Student Portal.";
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

      // IMPORTANT:
      // No JWT.
      // No cookie.
      // No authentication.
      return NextResponse.json(
        {
          success: false,
          message,
          approvalStatus:
            user.approvalStatus,

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
    }

    // =========================================================
    // CREATE JWT
    // =========================================================

    const token =
      jwt.sign(
        {
          id: user.id,
          campusUserId:
            user.campusUserId,
          email: user.email,
          role,
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
          "Internal Server Error.",
      },
      {
        status: 500,
      }
    );
  }
}