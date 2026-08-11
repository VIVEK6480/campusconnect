import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Student email address is required.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // FIND STUDENT
    // =========================================

    const student = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No student account was found with this email address.",
        },
        { status: 404 }
      );
    }

    // =========================================
    // STUDENT ONLY
    // =========================================

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message: "This account is not registered as a student account.",
        },
        { status: 403 }
      );
    }

    // =========================================
    // CHECK STUDENT SMTP CONFIGURATION
    // =========================================

    const smtpHost = process.env.STUDENT_SMTP_HOST;
    const smtpPort = process.env.STUDENT_SMTP_PORT;
    const smtpUser = process.env.STUDENT_SMTP_USER;
    const smtpPassword = process.env.STUDENT_SMTP_PASSWORD;
    const smtpFrom = process.env.STUDENT_SMTP_FROM;

    if (
      !smtpHost ||
      !smtpPort ||
      !smtpUser ||
      !smtpPassword ||
      !smtpFrom
    ) {
      console.error(
        "STUDENT SMTP CONFIGURATION IS MISSING."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Student email service is not configured.",
        },
        { status: 500 }
      );
    }

    // =========================================
    // JWT SECRET
    // =========================================

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET IS MISSING.");

      return NextResponse.json(
        {
          success: false,
          message: "Authentication system is not configured.",
        },
        { status: 500 }
      );
    }

    // =========================================
    // PASSWORD VERSION
    // =========================================

    const passwordVersion = crypto
      .createHash("sha256")
      .update(student.password)
      .digest("hex");

    // =========================================
    // CREATE RESET TOKEN
    // =========================================

    const token = jwt.sign(
      {
        purpose: "student-password-reset",
        userId: student.id,
        passwordVersion,
      },
      jwtSecret,
      {
        expiresIn: "15m",
      }
    );

    // =========================================
    // RESET URL
    // =========================================

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${appUrl}/auth/student-reset-password?token=${encodeURIComponent(
        token
      )}`;

    console.log(
      "STUDENT RESET URL CREATED FOR:",
      student.email
    );

    // =========================================
    // CREATE SMTP TRANSPORT
    // =========================================

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,

      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // =========================================
    // VERIFY SMTP
    // =========================================

    await transporter.verify();

    // =========================================
    // SEND EMAIL
    // =========================================

    await transporter.sendMail({
      from: smtpFrom,

      to: student.email,

      subject: "CampusConnect Student Password Reset",

      html: `
        <!DOCTYPE html>
        <html>
          <body
            style="
              margin: 0;
              padding: 0;
              background: #f4f7f6;
              font-family: Arial, Helvetica, sans-serif;
            "
          >

            <div
              style="
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 5px 25px rgba(0,0,0,0.08);
              "
            >

              <h1
                style="
                  margin-bottom: 10px;
                  color: #111827;
                "
              >
                CampusConnect
              </h1>

              <h2
                style="
                  color: #111827;
                "
              >
                Student Password Reset
              </h2>

              <p
                style="
                  color: #4b5563;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                We received a request to reset the password
                for your CampusConnect student account.
              </p>

              <p
                style="
                  color: #4b5563;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                Click the button below to create a new password.
              </p>

              <div
                style="
                  text-align: center;
                  margin: 35px 0;
                "
              >
                <a
                  href="${resetUrl}"
                  style="
                    display: inline-block;
                    padding: 14px 28px;
                    background: #10b981;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                  "
                >
                  Reset Student Password
                </a>
              </div>

              <p
                style="
                  color: #6b7280;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                This password reset link will expire in
                <strong>15 minutes</strong>.
              </p>

              <p
                style="
                  color: #6b7280;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                If you did not request this password reset,
                you can safely ignore this email.
              </p>

              <hr
                style="
                  border: none;
                  border-top: 1px solid #e5e7eb;
                  margin: 30px 0;
                "
              />

              <p
                style="
                  color: #9ca3af;
                  font-size: 12px;
                "
              >
                CampusConnect Student Portal
              </p>

            </div>

          </body>
        </html>
      `,
    });

    console.log(
      "STUDENT PASSWORD RESET EMAIL SENT:",
      student.email
    );

    return NextResponse.json({
      success: true,
      message:
        "Password reset link has been sent to your student email.",
    });

  } catch (error) {
    console.error(
      "STUDENT FORGOT PASSWORD SMTP ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to send student password reset email. Please try again.",
      },
      { status: 500 }
    );
  }
}