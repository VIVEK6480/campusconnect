import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    // =========================================
    // VALIDATION
    // =========================================

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Faculty email address is required.",
        },
        { status: 400 }
      );
    }

    // =========================================
    // FIND FACULTY
    // =========================================

    const faculty = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!faculty) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No faculty account was found with this email.",
        },
        { status: 404 }
      );
    }

    // =========================================
    // FACULTY ONLY
    // =========================================

    if (faculty.role !== "FACULTY") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account is not a faculty account.",
        },
        { status: 403 }
      );
    }

    // =========================================
    // JWT SECRET
    // =========================================

    const jwtSecret =
      process.env.JWT_SECRET?.trim();

    if (!jwtSecret) {
      console.error(
        "FACULTY RESET: JWT_SECRET is missing."
      );

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
    // FACULTY SMTP CONFIGURATION
    // =========================================

    const smtpHost =
      process.env.FACULTY_SMTP_HOST?.trim();

    const smtpPortRaw =
      process.env.FACULTY_SMTP_PORT?.trim() ||
      "465";

    const smtpPort = Number(smtpPortRaw);

    const smtpUser =
      process.env.FACULTY_SMTP_USER?.trim();

    const smtpPassword =
      process.env.FACULTY_SMTP_PASSWORD?.trim();

    const smtpFrom =
      process.env.FACULTY_SMTP_FROM?.trim();

    // =========================================
    // SMTP VALIDATION
    // =========================================

    if (!smtpHost) {
      console.error(
        "FACULTY SMTP ERROR: FACULTY_SMTP_HOST is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty email service is not configured.",
        },
        { status: 500 }
      );
    }

    if (
      !Number.isInteger(smtpPort) ||
      smtpPort < 1 ||
      smtpPort > 65535
    ) {
      console.error(
        "FACULTY SMTP ERROR: Invalid SMTP port."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty email service has an invalid SMTP port.",
        },
        { status: 500 }
      );
    }

    if (!smtpUser || !smtpPassword) {
      console.error(
        "FACULTY SMTP ERROR: SMTP credentials are missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Faculty email service is not configured.",
        },
        { status: 500 }
      );
    }

    // =========================================
    // PASSWORD VERSION
    // =========================================

    const passwordVersion = crypto
      .createHash("sha256")
      .update(faculty.password)
      .digest("hex");

    // =========================================
    // CREATE FACULTY RESET TOKEN
    // =========================================

    const token = jwt.sign(
      {
        purpose: "faculty-password-reset",
        userId: faculty.id,
        passwordVersion,
      },
      jwtSecret,
      {
        expiresIn: "15m",
      }
    );

    // =========================================
    // DETERMINE CURRENT APP HOST
    //
    // Uses the host/IP through which the current
    // request reached the Next.js server.
    //
    // This prevents the reset URL from depending
    // on one fixed local network IP.
    // =========================================

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

    // Only allow valid protocols.
    if (
      protocol !== "http" &&
      protocol !== "https"
    ) {
      protocol =
        process.env.NODE_ENV === "production"
          ? "https"
          : "http";
    }

    // =========================================
    // FALLBACK APP URL
    // =========================================

    const configuredAppUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim();

    const appUrl = requestHost
      ? `${protocol}://${requestHost}`
      : configuredAppUrl
        ? configuredAppUrl.replace(/\/+$/, "")
        : "http://localhost:3000";

    // =========================================
    // FACULTY RESET URL
    // =========================================

    const resetUrl =
      `${appUrl}/faculty/reset-password` +
      `?token=${encodeURIComponent(token)}`;

    // =========================================
    // LOG RESET URL
    // =========================================

    console.log(
      "========================================"
    );

    console.log(
      "FACULTY PASSWORD RESET REQUEST"
    );

    console.log(
      "FACULTY EMAIL:",
      faculty.email
    );

    console.log(
      "FACULTY RESET HOST:",
      requestHost || "fallback"
    );

    console.log(
      "FACULTY RESET URL:",
      resetUrl
    );

    console.log(
      "========================================"
    );

    // =========================================
    // CREATE SMTP TRANSPORTER
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
    // VERIFY SMTP CONNECTION
    // =========================================

    await transporter.verify();

    console.log(
      "FACULTY SMTP CONNECTION VERIFIED."
    );

    // =========================================
    // SEND FACULTY RESET EMAIL
    // =========================================

    await transporter.sendMail({
      from:
        smtpFrom ||
        `"CampusConnect Faculty" <${smtpUser}>`,

      to: faculty.email,

      subject:
        "CampusConnect Faculty Password Reset",

      html: `
        <!DOCTYPE html>
        <html>

          <head>
            <meta charset="UTF-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />

            <title>
              CampusConnect Faculty Password Reset
            </title>
          </head>

          <body
            style="
              margin:0;
              padding:0;
              background:#f4f7fb;
              font-family:Arial,Helvetica,sans-serif;
            "
          >

            <div
              style="
                max-width:600px;
                margin:40px auto;
                background:#ffffff;
                border-radius:16px;
                padding:32px;
                box-shadow:0 10px 30px rgba(0,0,0,0.08);
              "
            >

              <h2
                style="
                  margin:0 0 8px;
                  color:#0f172a;
                "
              >
                CampusConnect
              </h2>

              <p
                style="
                  margin:0 0 25px;
                  color:#64748b;
                "
              >
                Smart Campus Management
              </p>

              <h3
                style="
                  color:#0f172a;
                  margin-bottom:15px;
                "
              >
                Faculty Password Reset
              </h3>

              <p
                style="
                  color:#334155;
                  line-height:1.6;
                "
              >
                Hello ${faculty.name || "Faculty"},
              </p>

              <p
                style="
                  color:#334155;
                  line-height:1.6;
                "
              >
                We received a request to reset your
                CampusConnect faculty account password.
              </p>

              <p
                style="
                  color:#334155;
                  line-height:1.6;
                "
              >
                Click the button below to create a new
                password.
              </p>

              <div
                style="
                  margin:30px 0;
                  text-align:center;
                "
              >

                <a
                  href="${resetUrl}"
                  style="
                    display:inline-block;
                    padding:14px 24px;
                    background:#0ea5e9;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                  "
                >
                  Reset Faculty Password
                </a>

              </div>

              <p
                style="
                  color:#64748b;
                  line-height:1.6;
                "
              >
                This password reset link will expire
                in <strong>15 minutes</strong>.
              </p>

              <p
                style="
                  color:#64748b;
                  line-height:1.6;
                "
              >
                If you did not request this password
                reset, you can safely ignore this email.
              </p>

              <hr
                style="
                  margin:30px 0;
                  border:none;
                  border-top:1px solid #e2e8f0;
                "
              />

              <p
                style="
                  margin:0;
                  font-size:12px;
                  color:#94a3b8;
                "
              >
                CampusConnect Faculty Portal
              </p>

            </div>

          </body>

        </html>
      `,
    });

    // =========================================
    // SUCCESS LOG
    // =========================================

    console.log(
      "FACULTY RESET EMAIL SENT:",
      faculty.email
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Faculty password reset link has been sent to your email.",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      "FACULTY FORGOT PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to send faculty password reset email. Please try again.",
      },
      { status: 500 }
    );
  }
}