import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

/* ======================================================
   GET SUBJECTS FOR STUDENT REGISTRATION
====================================================== */

export async function GET() {
  try {
    const subjects =
      await prisma.subject.findMany({
        select: {
          id: true,
          name: true,
          semester: true,
        },

        orderBy: [
          {
            semester: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

    return NextResponse.json(
      {
        success: true,
        subjects,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "REGISTER SUBJECTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load subjects.",
        subjects: [],
      },
      {
        status: 500,
      }
    );
  }
}

/* ======================================================
   STUDENT ACCOUNT REGISTRATION
====================================================== */

export async function POST(
  request: Request
) {
  try {
    const body: unknown =
      await request.json();

    const data =
      typeof body === "object" &&
      body !== null
        ? (
            body as Record<
              string,
              unknown
            >
          )
        : {};

    /* ==================================================
       BASIC DATA
    ================================================== */

    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : "";

    const email =
      typeof data.email === "string"
        ? data.email
            .trim()
            .toLowerCase()
        : "";

    const password =
      typeof data.password === "string"
        ? data.password
        : "";

    const semester =
      Number(data.semester);

    const section =
      typeof data.section === "string"
        ? data.section
            .trim()
            .toUpperCase()
        : "";

    const rawSubjectIds =
      data.subjectIds;

    const subjectIds: string[] =
      Array.isArray(
        rawSubjectIds
      )
        ? rawSubjectIds
            .filter(
              (
                id: unknown
              ): id is string =>
                typeof id ===
                  "string" &&
                id.trim().length >
                  0
            )
            .map((id) =>
              id.trim()
            )
        : [];

    /* ==================================================
       VALIDATION
    ================================================== */

    if (
      !name ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      name.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid full name.",
        },
        {
          status: 400,
        }
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        semester
      ) ||
      semester < 1 ||
      semester > 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid semester.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedSections = [
      "A",
      "B",
      "C",
      "D",
    ];

    if (
      !allowedSections.includes(
        section
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid section.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      subjectIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select at least one subject.",
        },
        {
          status: 400,
        }
      );
    }

    const uniqueSubjectIds =
      Array.from(
        new Set(subjectIds)
      );

    /* ==================================================
       CHECK EXISTING USER
    ================================================== */

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /* ==================================================
       VERIFY SELECTED SUBJECTS
    ================================================== */

    const selectedSubjects =
      await prisma.subject.findMany({
        where: {
          id: {
            in:
              uniqueSubjectIds,
          },
        },

        select: {
          id: true,
          semester: true,
        },
      });

    if (
      selectedSubjects.length !==
      uniqueSubjectIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more selected subjects are invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const invalidSubject =
      selectedSubjects.some(
        (subject) =>
          subject.semester !==
          semester
      );

    if (invalidSubject) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected subjects must belong to the selected semester.",
        },
        {
          status: 400,
        }
      );
    }

    /* ==================================================
       HASH PASSWORD
    ================================================== */

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    /* ==================================================
       GENERATE CAMPUS USER ID
    ================================================== */

    async function generateCampusUserId() {
      while (true) {
        const randomDigits =
          Math.floor(
            1000 +
              Math.random() *
                9000
          );

        const campusUserId =
          `VKT-${randomDigits}`;

        const existing =
          await prisma.user.findUnique({
            where: {
              campusUserId,
            },

            select: {
              id: true,
            },
          });

        if (!existing) {
          return campusUserId;
        }
      }
    }

    const campusUserId =
      await generateCampusUserId();

    /* ==================================================
       CREATE USER + SUBJECT REGISTRATIONS
    ================================================== */

    const result =
      await prisma.$transaction(
        async (tx) => {
          const user =
            await tx.user.create({
              data: {
                name,
                email,
                password:
                  hashedPassword,
                campusUserId,
                role:
                  "STUDENT",
                approvalStatus:
                  "PENDING",
              },
            });

          await tx.studentRegistration.createMany(
            {
              data:
                uniqueSubjectIds.map(
                  (
                    subjectId
                  ) => ({
                    studentId:
                      user.id,

                    subjectId,

                    semester,

                    section,
                  })
                ),
            }
          );

          await tx.userApproval.create({
            data: {
              userId:
                user.id,

              actionById:
                "PENDING",

              status:
                "PENDING",
            },
          });

          return user;
        },
        {
          maxWait: 15000,
          timeout: 30000,
        }
      );

    /* ==================================================
       SUCCESS
    ================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          "Student registration submitted successfully. Waiting for approval.",

        data: {
          id:
            result.id,

          campusUserId:
            result.campusUserId,

          name:
            result.name,

          email:
            result.email,

          role:
            result.role,

          approvalStatus:
            result.approvalStatus,

          semester,

          section,

          subjectIds:
            uniqueSubjectIds,

          registrationCount:
            uniqueSubjectIds.length,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "REGISTRATION ERROR:",
      error
    );

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
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while creating your account.",
      },
      {
        status: 500,
      }
    );
  }
}