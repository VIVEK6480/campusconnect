import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendFacultyApprovalEmail } from "@/lib/sendFacultyApprovalEmail";

/* ======================================================
   TYPES
====================================================== */

type AdminTokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type ApprovalRequestBody = {
  userId?: string;
  action?: "APPROVE" | "REJECT";
  rejectionReason?: string;
};

/* ======================================================
   AUTHENTICATE ADMIN
====================================================== */

function getToken(
  request: NextRequest
): string | null {
  const authorization =
    request.headers.get("authorization");

  if (
    authorization?.startsWith("Bearer ")
  ) {
    const token =
      authorization
        .slice(7)
        .trim();

    if (token) {
      return token;
    }
  }

  return (
    request.cookies.get("token")?.value ??
    null
  );
}

async function authenticateAdmin(
  request: NextRequest
) {
  try {
    const token =
      getToken(request);

    if (!token) {
      return {
        success: false as const,
        response: NextResponse.json(
          {
            success: false,
            message:
              "Authentication token is required.",
          },
          {
            status: 401,
          }
        ),
      };
    }

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "FACULTY APPROVAL: JWT_SECRET is missing."
      );

      return {
        success: false as const,
        response: NextResponse.json(
          {
            success: false,
            message:
              "Authentication system is not configured.",
          },
          {
            status: 500,
          }
        ),
      };
    }

    const decoded =
      jwt.verify(
        token,
        secret
      ) as AdminTokenPayload;

    const role =
      String(
        decoded.role ?? ""
      ).toUpperCase();

    if (
      role !== "ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return {
        success: false as const,
        response: NextResponse.json(
          {
            success: false,
            message:
              "Administrator access required.",
          },
          {
            status: 403,
          }
        ),
      };
    }

    return {
      success: true as const,
      admin: decoded,
    };
  } catch (error) {
    console.error(
      "FACULTY APPROVAL AUTH ERROR:",
      error
    );

    return {
      success: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };
  }
}

/* ======================================================
   GENERATE FACULTY ID
====================================================== */

async function generateFacultyId() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const randomNumber =
      Math.floor(
        1000 + Math.random() * 9000
      );

    const facultyId =
      `RNT-${randomNumber}`;

    const existing =
      await prisma.user.findUnique({
        where: {
          campusUserId: facultyId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return facultyId;
    }
  }

  throw new Error(
    "Unable to generate a unique Faculty ID."
  );
}

/* ======================================================
   GET - LOAD ALL FACULTY APPROVAL REQUESTS
====================================================== */

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
          phone: true,
          department: true,
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
          user.approvalStatus ===
          "PENDING"
      );

    const approved =
      faculty.filter(
        (user) =>
          user.approvalStatus ===
          "APPROVED"
      );

    const rejected =
      faculty.filter(
        (user) =>
          user.approvalStatus ===
          "REJECTED"
      );

    return NextResponse.json(
      {
        success: true,
        faculty,

        stats: {
          pending:
            pending.length,
          approved:
            approved.length,
          rejected:
            rejected.length,
          total:
            faculty.length,
        },
      },
      {
        status: 200,
      }
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
      {
        status: 500,
      }
    );
  }
}

/* ======================================================
   POST - APPROVE / REJECT FACULTY
====================================================== */

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

    const userId =
      typeof body.userId === "string"
        ? body.userId.trim()
        : "";

    const action =
      body.action;

    const rejectionReason =
      typeof body.rejectionReason ===
      "string"
        ? body.rejectionReason.trim()
        : "";

    /* ==================================================
       VALIDATE USER ID
    ================================================== */

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* ==================================================
       VALIDATE ACTION
    ================================================== */

    if (
      action !== "APPROVE" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid approval action.",
        },
        {
          status: 400,
        }
      );
    }

    /* ==================================================
       REJECTION REASON REQUIRED
    ================================================== */

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
        {
          status: 400,
        }
      );
    }

    /* ==================================================
       FIND FACULTY
    ================================================== */

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
          phone: true,
          department: true,
          profileImage: true,
          role: true,
          approvalStatus: true,
          approvedAt: true,
          rejectionReason: true,
          createdAt: true,
        },
      });

    if (!existingFaculty) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty member not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* ==================================================
       MAKE SURE USER IS FACULTY
    ================================================== */

    if (
      String(
        existingFaculty.role
      ).toUpperCase() !==
      "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected user is not a faculty member.",
        },
        {
          status: 400,
        }
      );
    }

    /* ==================================================
       GENERATE FACULTY ID ON APPROVAL
    ================================================== */

    let facultyId =
      existingFaculty.campusUserId;

    if (
      action === "APPROVE" &&
      !facultyId
    ) {
      facultyId =
        await generateFacultyId();
    }

    /* ==================================================
       UPDATE APPROVAL STATUS
    ================================================== */

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
              ? facultyId
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
          phone: true,
          department: true,
          profileImage: true,
          role: true,
          approvalStatus: true,
          approvedAt: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    /* ==================================================
       SEND APPROVAL / REJECTION EMAIL
    ================================================== */

    try {
      await sendFacultyApprovalEmail({
        name:
          updatedFaculty.name ??
          "Faculty Member",

        email:
          updatedFaculty.email,

        phone:
          updatedFaculty.phone,

        department:
          updatedFaculty.department,

        userId:
          updatedFaculty.campusUserId ??
          updatedFaculty.id,

        approved:
          action === "APPROVE",

        rejectionReason:
          action === "REJECT"
            ? rejectionReason
            : null,
      });
    } catch (emailError) {
      console.error(
        "FACULTY APPROVAL EMAIL ERROR:",
        emailError
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          action === "APPROVE"
            ? "Faculty approved successfully."
            : "Faculty rejected successfully.",

        faculty:
          updatedFaculty,
      },
      {
        status: 200,
      }
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
          "Unable to update faculty approval status.",
      },
      {
        status: 500,
      }
    );
  }
}