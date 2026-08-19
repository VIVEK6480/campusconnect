import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendFacultyApprovalEmail } from "@/lib/sendFacultyApprovalEmail";

interface ApprovalRequestBody {
  userId?: string;
  action?: "APPROVE" | "REJECT";
  rejectionReason?: string;
}

interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
}

// ======================================================
// ADMIN AUTHENTICATION
// ======================================================

async function authenticateAdmin(
  request: NextRequest
):
  Promise<
    | {
        success: true;
        admin: AdminTokenPayload;
      }
    | {
        success: false;
        response: NextResponse;
      }
  > {
  try {
    const authorization =
      request.headers.get("authorization");

    let token: string | undefined;

    if (
      authorization &&
      authorization.startsWith("Bearer ")
    ) {
      token = authorization
        .substring(7)
        .trim();
    }

    if (!token) {
      token =
        request.cookies.get("token")?.value;
    }

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          { status: 401 }
        ),
      };
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "FACULTY APPROVAL: JWT_SECRET is missing."
      );

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            message:
              "Authentication system is not configured.",
          },
          { status: 500 }
        ),
      };
    }

    const decoded =
      jwt.verify(
        token,
        secret
      ) as AdminTokenPayload;

    if (
      decoded.role !== "ADMIN" &&
      decoded.role !== "SUPER_ADMIN"
    ) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            message:
              "Administrator access required.",
          },
          { status: 403 }
        ),
      };
    }

    return {
      success: true,
      admin: decoded,
    };
  } catch (error) {
    console.error(
      "FACULTY APPROVAL AUTH ERROR:",
      error
    );

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      ),
    };
  }
}

// ======================================================
// GET - LOAD ALL FACULTY APPROVAL REQUESTS
// ======================================================

export async function GET(
  request: NextRequest
) {
  const auth =
    await authenticateAdmin(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const faculty =
      await prisma.user.findMany({
        where: {
          role: "FACULTY",
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          campusUserId: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          createdAt: true,
          approvalStatus: true,
          approvedAt: true,
          rejectionReason: true,
        },
      });

    const pending =
      faculty.filter(
        (user) =>
          user.approvalStatus === "PENDING"
      );

    const approved =
      faculty.filter(
        (user) =>
          user.approvalStatus === "APPROVED"
      );

    const rejected =
      faculty.filter(
        (user) =>
          user.approvalStatus === "REJECTED"
      );

    return NextResponse.json(
      {
        success: true,
        faculty,

        stats: {
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          total: faculty.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FACULTY APPROVAL GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load faculty approval requests.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST - APPROVE / REJECT FACULTY
// ======================================================

export async function POST(
  request: NextRequest
) {
  const auth =
    await authenticateAdmin(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const body =
      (await request.json()) as ApprovalRequestBody;

    const userId = body.userId;
    const action = body.action;

    const rejectionReason =
      body.rejectionReason?.trim();

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid approval action.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REJECT" &&
      !rejectionReason
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rejection reason is required.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // FIND FACULTY
    // ==================================================

    const existingFaculty =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          campusUserId: true,
          name: true,
          email: true,
          role: true,
          approvalStatus: true,
        },
      });

    if (!existingFaculty) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty member not found.",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // FACULTY CHECK
    // ==================================================

    if (
      existingFaculty.role !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected user is not a faculty member.",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // GENERATE FACULTY USER ID ON APPROVAL
    // ==================================================

    let facultyUserId =
      existingFaculty.campusUserId;

    if (
      action === "APPROVE" &&
      !facultyUserId
    ) {
      let uniqueId = "";

      for (let attempt = 0; attempt < 20; attempt++) {
        const randomNumber =
          Math.floor(
            1000 +
              Math.random() * 9000
          );

        const candidate =
          `RNT-${randomNumber}`;

        const existing =
          await prisma.user.findUnique({
            where: {
              campusUserId: candidate,
            },
            select: {
              id: true,
            },
          });

        if (!existing) {
          uniqueId = candidate;
          break;
        }
      }

      if (!uniqueId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to generate a unique faculty User ID. Please try again.",
          },
          { status: 500 }
        );
      }

      facultyUserId = uniqueId;
    }

    // ==================================================
    // UPDATE FACULTY APPROVAL
    // ==================================================

    const updatedFaculty =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          approvalStatus:
            action === "APPROVE"
              ? "APPROVED"
              : "REJECTED",

          campusUserId:
            action === "APPROVE"
              ? facultyUserId
              : existingFaculty.campusUserId,

          approvedAt:
            action === "APPROVE"
              ? new Date()
              : null,

          rejectionReason:
            action === "REJECT"
              ? rejectionReason
              : null,
        },

        select: {
          id: true,
          campusUserId: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          createdAt: true,
          approvalStatus: true,
          approvedAt: true,
          rejectionReason: true,
        },
      });

    // ==================================================
    // SEND FACULTY APPROVAL EMAIL
    // ==================================================

    try {
      await sendFacultyApprovalEmail({
        name: updatedFaculty.name,
        email: updatedFaculty.email,
        userId:
          updatedFaculty.campusUserId ||
          updatedFaculty.id,
        approved:
          action === "APPROVE",
        rejectionReason:
          updatedFaculty.rejectionReason,
      });

      console.log(
        `FACULTY ${action} EMAIL SENT:`,
        updatedFaculty.email
      );
    } catch (emailError) {
      console.error(
        "FACULTY APPROVAL EMAIL ERROR:",
        emailError
      );

      // Approval/rejection is already saved.
      // Email failure should not undo the database update.
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        message:
          action === "APPROVE"
            ? "Faculty approved successfully."
            : "Faculty rejected successfully.",

        faculty: updatedFaculty,

        emailSent: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FACULTY APPROVAL POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update faculty approval.",
      },
      { status: 500 }
    );
  }
}