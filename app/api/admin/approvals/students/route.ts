import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendStudentApprovalEmail } from "@/lib/mail";

// ======================================================
// APPROVAL REQUEST BODY
// ======================================================

interface ApprovalRequestBody {
  userId?: string;
  action?: "APPROVE" | "REJECT";
  rejectionReason?: string;
}

// ======================================================
// GENERATE UNIQUE CAMPUS USER ID
//
// IMPORTANT:
// Campus User ID is generated ONLY when Admin approves
// the student.
//
// Format:
// VKT-1234
// ======================================================

async function generateCampusUserId(): Promise<string> {
  while (true) {
    const randomDigits =
      Math.floor(
        1000 +
          Math.random() * 9000
      );

    const campusUserId =
      `VKT-${randomDigits}`;

    const existingCampusUserId =
      await prisma.user.findUnique({
        where: {
          campusUserId,
        },
        select: {
          id: true,
        },
      });

    if (!existingCampusUserId) {
      return campusUserId;
    }
  }
}

// ======================================================
// GET STUDENT APPROVAL REQUESTS
// ======================================================

export async function GET() {
  try {
    const students =
      await prisma.user.findMany({
        where: {
          role: "STUDENT",
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

    // ==================================================
    // FILTER STATISTICS
    // ==================================================

    const pending =
      students.filter(
        (student) =>
          student.approvalStatus ===
          "PENDING"
      );

    const approved =
      students.filter(
        (student) =>
          student.approvalStatus ===
          "APPROVED"
      );

    const rejected =
      students.filter(
        (student) =>
          student.approvalStatus ===
          "REJECTED"
      );

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      students,

      stats: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        total: students.length,
      },
    });
  } catch (error) {
    console.error(
      "STUDENT APPROVAL GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load student approval requests.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// APPROVE / REJECT STUDENT
// ======================================================

export async function POST(
  request: Request
) {
  try {
    // ==================================================
    // READ REQUEST BODY
    // ==================================================

    const body =
      (await request.json()) as ApprovalRequestBody;

    const userId =
      body.userId;

    const action =
      body.action;

    const rejectionReason =
      body.rejectionReason?.trim();

    // ==================================================
    // VALIDATE USER ID
    // ==================================================

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

    // ==================================================
    // VALIDATE ACTION
    // ==================================================

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

    // ==================================================
    // VALIDATE REJECTION REASON
    // ==================================================

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

    // ==================================================
    // FIND STUDENT
    // ==================================================

    const existingStudent =
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

    // ==================================================
    // STUDENT NOT FOUND
    // ==================================================

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // ROLE CHECK
    // ==================================================

    if (
      existingStudent.role !==
      "STUDENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected user is not a student.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // PREVENT DUPLICATE APPROVAL
    // ==================================================

    if (
      existingStudent.approvalStatus ===
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This student has already been approved.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // PREVENT DUPLICATE REJECTION
    // ==================================================

    if (
      existingStudent.approvalStatus ===
      "REJECTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This student registration has already been rejected.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // GENERATE CAMPUS USER ID
    //
    // ONLY APPROVED STUDENTS GET CAMPUS USER ID.
    // ==================================================

    let campusUserId:
      string | null = null;

    if (action === "APPROVE") {
      campusUserId =
        await generateCampusUserId();
    }

    // ==================================================
    // UPDATE STUDENT
    // ==================================================

    const updatedStudent =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          // --------------------------------------------
          // APPROVAL STATUS
          // --------------------------------------------

          approvalStatus:
            action === "APPROVE"
              ? "APPROVED"
              : "REJECTED",

          // --------------------------------------------
          // APPROVED DATE
          // --------------------------------------------

          approvedAt:
            action === "APPROVE"
              ? new Date()
              : null,

          // --------------------------------------------
          // CAMPUS USER ID
          //
          // APPROVE -> generated ID
          // REJECT  -> null
          // --------------------------------------------

          campusUserId:
            action === "APPROVE"
              ? campusUserId
              : null,

          // --------------------------------------------
          // REJECTION REASON
          // --------------------------------------------

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
    // FETCH STUDENT REGISTRATIONS
    //
    // IMPORTANT:
    //
    // StudentRegistration does NOT contain a Prisma
    // relation called "subject".
    //
    // Therefore we only select subjectId here and
    // fetch Subject records separately below.
    // ==================================================

    const registrations =
      await prisma.studentRegistration.findMany({
        where: {
          studentId:
            updatedStudent.id,
        },

        select: {
          id: true,
          studentId: true,
          subjectId: true,
          semester: true,
          section: true,
          createdAt: true,
          updatedAt: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    // ==================================================
    // GET SEMESTER
    // ==================================================

    const semester =
      registrations.length > 0
        ? registrations[0].semester
        : null;

    // ==================================================
    // GET SECTION
    // ==================================================

    const section =
      registrations.length > 0
        ? registrations[0].section
        : null;

    // ==================================================
    // GET SUBJECT IDS
    // ==================================================

    const subjectIds: string[] =
      registrations.map(
        (registration) =>
          registration.subjectId
      );

    // ==================================================
    // FETCH SUBJECT INFORMATION
    //
    // We fetch subjects separately because the current
    // Prisma StudentRegistration model does not expose
    // a "subject" relation.
    // ==================================================

    const selectedSubjects =
      subjectIds.length > 0
        ? await prisma.subject.findMany({
            where: {
              id: {
                in: subjectIds,
              },
            },

            select: {
              id: true,
              name: true,
              semester: true,
            },

            orderBy: {
              name: "asc",
            },
          })
        : [];

    // ==================================================
    // CREATE SUBJECT NAME ARRAY
    // ==================================================

    const subjects: string[] =
      selectedSubjects.map(
        (subject) =>
          subject.name
      );

    // ==================================================
    // SEND APPROVAL / REJECTION EMAIL
    // ==================================================

    let emailSent = false;

    try {
      await sendStudentApprovalEmail({
        name:
          updatedStudent.name,

        email:
          updatedStudent.email,

        userId:
          updatedStudent.campusUserId,

        approved:
          action === "APPROVE",

        rejectionReason:
          updatedStudent.rejectionReason,

        semester,

        section,

        subjects,
      });

      emailSent = true;

      console.log(
        `STUDENT ${action} EMAIL SENT: ${updatedStudent.email}`
      );
    } catch (emailError) {
      // ==================================================
      // IMPORTANT:
      //
      // Approval/rejection remains successful even if
      // SMTP email fails.
      // ==================================================

      console.error(
        "STUDENT APPROVAL EMAIL ERROR:",
        emailError
      );
    }

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      message:
        action === "APPROVE"
          ? "Student approved successfully."
          : "Student rejected successfully.",

      emailSent,

      student: {
        ...updatedStudent,

        semester,

        section,

        subjects,

        subjectIds,
      },
    });
  } catch (error) {
    console.error(
      "STUDENT APPROVAL POST ERROR:",
      error
    );

    // ==================================================
    // PRISMA UNIQUE CONSTRAINT ERROR
    // ==================================================

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
            "Unable to generate a unique Campus User ID. Please try again.",
        },
        {
          status: 409,
        }
      );
    }

    // ==================================================
    // GENERAL ERROR
    // ==================================================

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update student approval.",
      },
      {
        status: 500,
      }
    );
  }
}