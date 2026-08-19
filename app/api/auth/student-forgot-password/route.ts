import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // =========================================
    // READ REQUEST BODY
    // =========================================

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
          message:
            "This account is not registered as a student account.",
        },
        { status: 403 }
      );
    }

    // =========================================
    // STUDENT SMTP
    // =========================================

    const smtpHost =
      process.env.STUDENT_SMTP_HOST?.trim();

    const smtpPort = Number(
      process.env.STUDENT_SMTP_PORT || "465"
    );

    const smtpUser =
      process.env.STUDENT_SMTP_USER?.trim();

    const smtpPassword =
      process.env.STUDENT_SMTP_PASSWORD?.trim();

    const smtpFrom =
      process.env.STUDENT_SMTP_FROM?.trim();

    if (
      !smtpHost ||
      !smtpUser ||
      !smtpPassword ||
      !smtpFrom ||
      !Number.isInteger(smtpPort) ||
      smtpPort < 1 ||
      smtpPort > 65535
    ) {
      console.error(
        "STUDENT SMTP CONFIGURATION IS MISSING OR INVALID."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Student email service is not configured.",
        },
        { status: 500 }
      );
    }

    // =========================================
    // JWT SECRET
    // =========================================

    const jwtSecret =
      process.env.JWT_SECRET?.trim();

    if (!jwtSecret) {
      console.error("JWT_SECRET IS MISSING.");

      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication system is not configured.",
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
    // CREATE STUDENT RESET TOKEN
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
    // APPLICATION URL
    // =========================================

    const configuredAppUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim();

    const forwardedHost =
      req.headers.get("x-forwarded-host");

    const requestHost =
      forwardedHost ||
      req.headers.get("host");

    const forwardedProto =
      req.headers.get("x-forwarded-proto");

    let protocol =
      forwardedProto ||
      (process.env.NODE_ENV === "production"
        ? "https"
        : "http");

    protocol = protocol
      .split(",")[0]
      .trim();

    if (
      protocol !== "http" &&
      protocol !== "https"
    ) {
      protocol =
        process.env.NODE_ENV === "production"
          ? "https"
          : "http";
    }

    const appUrl = configuredAppUrl
      ? configuredAppUrl.replace(/\/+$/, "")
      : requestHost &&
          requestHost !== "localhost:3000" &&
          requestHost !== "127.0.0.1:3000"
        ? `${protocol}://${requestHost}`.replace(
            /\/+$/,
            ""
          )
        : "http://localhost:3000";

    // =========================================
    // STUDENT RESET URL
    // =========================================

    const resetUrl =
      `${appUrl}/auth/student-reset-password` +
      `?token=${encodeURIComponent(token)}`;

    console.log(
      "STUDENT PASSWORD RESET URL:",
      resetUrl
    );

    // =========================================
    // CREATE SMTP TRANSPORT
    // =========================================

    const transporter =
      nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,

        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

    // =========================================
    // VERIFY SMTP
    // =========================================

    await transporter.verify();

    console.log(
      "STUDENT SMTP CONNECTION VERIFIED."
    );

    // =========================================
    // SEND EMAIL
    // =========================================

    await transporter.sendMail({
      from: smtpFrom,

      to: student.email,

      subject:
        "CampusConnect Student Password Reset",

      html: `
        <!DOCTYPE html>
        <html>
          <body
            style="
              margin:0;
              padding:0;
              background:#f4f7f6;
              font-family:Arial,Helvetica,sans-serif;
            "
          >

            <div
              style="
                max-width:600px;
                margin:40px auto;
                background:#ffffff;
                border-radius:12px;
                padding:40px;
                box-shadow:0 5px 25px rgba(0,0,0,0.08);
              "
            >

              <h1
                style="
                  margin:0 0 10px 0;
                  color:#111827;
                "
              >
                CampusConnect
              </h1>

              <h2
                style="
                  margin-top:0;
                  color:#111827;
                "
              >
                Student Password Reset
              </h2>

              <p
                style="
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                We received a request to reset the password
                for your CampusConnect student account.
              </p>

              <p
                style="
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Click the button below to create a new password.
              </p>

              <div
                style="
                  text-align:center;
                  margin:35px 0;
                "
              >

                <a
                  href="${resetUrl}"
                  style="
                    display:inline-block;
                    padding:14px 28px;
                    background:#10b981;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                  "
                >
                  Reset Student Password
                </a>

              </div>

              <p
                style="
                  color:#6b7280;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                This password reset link will expire in
                <strong>15 minutes</strong>.
              </p>

              <p
                style="
                  color:#6b7280;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                If you did not request this password reset,
                you can safely ignore this email.
              </p>

              <hr
                style="
                  border:none;
                  border-top:1px solid #e5e7eb;
                  margin:30px 0;
                "
              />

              <p
                style="
                  color:#9ca3af;
                  font-size:12px;
                  margin:0;
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