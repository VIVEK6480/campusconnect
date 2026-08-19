import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendStudentApprovalEmail } from "@/lib/mail";

type ApprovalAction = "approve" | "reject";

type FacultyBody = {
  facultyId?: string;
};

type ApprovalBody = {
  studentId?: string;
  action?: string;
  rejectionReason?: string;
  facultyId?: string;
};

function getFacultyId(
  request: NextRequest,
  body?: FacultyBody
): string | null {
  const fromHeader = request.headers.get("x-faculty-id")?.trim();

  if (fromHeader) {
    return fromHeader;
  }

  if (body?.facultyId?.trim()) {
    return body.facultyId.trim();
  }

  return null;
}

/* =========================================================
   GET
   LOAD ALL STUDENTS
========================================================= */

export async function GET(request: NextRequest) {
  try {
    const facultyId = getFacultyId(request);

    if (!facultyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Faculty ID is required.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       FACULTY CHECK
    ====================================================== */

    const faculty = await prisma.user.findUnique({
      where: {
        id: facultyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
      },
    });

    if (
      !faculty ||
      String(faculty.role).toUpperCase() !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Faculty account not found or unauthorized.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       LOAD ALL STUDENTS
    ====================================================== */

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      select: {
        id: true,
        campusUserId: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        approvedAt: true,
        rejectionReason: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const pending = students.filter(
      (student) =>
        String(student.approvalStatus).toUpperCase() === "PENDING"
    );

    const approved = students.filter(
      (student) =>
        String(student.approvalStatus).toUpperCase() === "APPROVED"
    );

    const rejected = students.filter(
      (student) =>
        String(student.approvalStatus).toUpperCase() === "REJECTED"
    );

    return NextResponse.json({
      success: true,

      students,

      count: students.length,

      stats: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        total: students.length,
      },

      faculty: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
      },
    });
  } catch (error) {
    console.error(
      "FACULTY STUDENT APPROVAL GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load student approval requests.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   APPROVE / REJECT STUDENT
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as ApprovalBody;

    const {
      studentId,
      action,
      rejectionReason,
      facultyId,
    } = body;

    /* =====================================================
       VALIDATION
    ====================================================== */

    if (!studentId?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Student ID is required.",
        },
        { status: 400 }
      );
    }

    const normalizedAction =
      String(action || "").trim().toLowerCase() as ApprovalAction;

    if (
      normalizedAction !== "approve" &&
      normalizedAction !== "reject"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Action must be approve or reject.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       FACULTY ID
    ====================================================== */

    const currentFacultyId = getFacultyId(request, {
      facultyId,
    });

    if (!currentFacultyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Faculty ID is required.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       FACULTY CHECK
    ====================================================== */

    const faculty = await prisma.user.findUnique({
      where: {
        id: currentFacultyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (
      !faculty ||
      String(faculty.role).toUpperCase() !== "FACULTY"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only faculty members can approve students.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       STUDENT CHECK
    ====================================================== */

    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        campusUserId: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        approvedAt: true,
        rejectionReason: true,
      },
    });

    if (
      !student ||
      String(student.role).toUpperCase() !== "STUDENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       PREVENT DUPLICATE ACTION
    ====================================================== */

    const currentStatus =
      String(student.approvalStatus).toUpperCase();

    if (currentStatus !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `This student is already ${currentStatus.toLowerCase()}.`,
        },
        { status: 409 }
      );
    }

    /* =====================================================
       APPROVE STUDENT
    ====================================================== */

    if (normalizedAction === "approve") {
      const updatedStudent = await prisma.$transaction(
        async (tx) => {
          const updated = await tx.user.update({
            where: {
              id: studentId,
            },
            data: {
              approvalStatus: "APPROVED",
              approvedAt: new Date(),
              rejectionReason: null,
            },
            select: {
              id: true,
              campusUserId: true,
              name: true,
              email: true,
              profileImage: true,
              role: true,
              approvalStatus: true,
              createdAt: true,
              approvedAt: true,
              rejectionReason: true,
            },
          });

          await tx.userApproval.create({
            data: {
              userId: studentId,
              actionById: currentFacultyId,
              status: "APPROVED",
            },
          });

          return updated;
        }
      );

      /* =====================================================
         SEND APPROVAL EMAIL
         
         IMPORTANT:
         Existing SMTP mail system is used.
         NO RESEND.
      ====================================================== */

      let emailSent = false;
      let emailError = "";

      try {
        await sendStudentApprovalEmail({
          name: updatedStudent.name,
          email: updatedStudent.email,
          userId: updatedStudent.campusUserId || "",
          approved: true,
          rejectionReason: null,
        });

        emailSent = true;

        console.log(
          "FACULTY STUDENT APPROVAL EMAIL SENT:",
          {
            studentName: updatedStudent.name,
            studentEmail: updatedStudent.email,
            campusUserId: updatedStudent.campusUserId,
          }
        );
      } catch (error) {
        emailSent = false;

        emailError =
          error instanceof Error
            ? error.message
            : "Unable to send approval email.";

        console.error(
          "FACULTY STUDENT APPROVAL EMAIL ERROR:",
          error
        );
      }

      return NextResponse.json({
        success: true,

        message: emailSent
          ? "Student approved successfully and email sent."
          : "Student approved successfully, but email could not be sent.",

        student: updatedStudent,

        emailSent,

        ...(emailError
          ? {
              emailError,
            }
          : {}),
      });
    }

    /* =====================================================
       REJECT STUDENT
    ====================================================== */

    const reason =
      typeof rejectionReason === "string" &&
      rejectionReason.trim()
        ? rejectionReason.trim()
        : "Student registration rejected by faculty.";

    const updatedStudent = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.user.update({
          where: {
            id: studentId,
          },
          data: {
            approvalStatus: "REJECTED",
            approvedAt: null,
            rejectionReason: reason,
          },
          select: {
            id: true,
            campusUserId: true,
            name: true,
            email: true,
            profileImage: true,
            role: true,
            approvalStatus: true,
            createdAt: true,
            approvedAt: true,
            rejectionReason: true,
          },
        });

        await tx.userApproval.create({
          data: {
            userId: studentId,
            actionById: currentFacultyId,
            status: "REJECTED",
            rejectionReason: reason,
          },
        });

        return updated;
      }
    );

    /* =====================================================
       REJECTION EMAIL
       
       Same existing SMTP mail function.
    ====================================================== */

    let emailSent = false;
    let emailError = "";

    try {
      await sendStudentApprovalEmail({
        name: updatedStudent.name,
        email: updatedStudent.email,
        userId: updatedStudent.campusUserId || "",
        approved: false,
        rejectionReason: updatedStudent.rejectionReason,
      });

      emailSent = true;

      console.log(
        "FACULTY STUDENT REJECTION EMAIL SENT:",
        {
          studentName: updatedStudent.name,
          studentEmail: updatedStudent.email,
          campusUserId: updatedStudent.campusUserId,
        }
      );
    } catch (error) {
      emailSent = false;

      emailError =
        error instanceof Error
          ? error.message
          : "Unable to send rejection email.";

      console.error(
        "FACULTY STUDENT REJECTION EMAIL ERROR:",
        error
      );
    }

    return NextResponse.json({
      success: true,

      message: emailSent
        ? "Student rejected successfully and email sent."
        : "Student rejected successfully, but email could not be sent.",

      student: updatedStudent,

      emailSent,

      ...(emailError
        ? {
            emailError,
          }
        : {}),
    });
  } catch (error) {
    console.error(
      "FACULTY STUDENT APPROVAL PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update student approval.",
      },
      { status: 500 }
    );
  }
}