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
          message: "Email address is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // FIND USER
    // -----------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No account was found with this email.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // ADMIN ONLY
    // -----------------------------------------

    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This account is not an admin account.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------
    // JWT SECRET
    // -----------------------------------------

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing.");

      return NextResponse.json(
        {
          success: false,
          message: "Authentication system is not configured.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // SMTP
    // -----------------------------------------

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(
      process.env.SMTP_PORT || "465"
    );
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (
      !smtpHost ||
      !smtpUser ||
      !smtpPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin SMTP is not configured.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // PASSWORD VERSION
    // -----------------------------------------

    const passwordVersion = crypto
      .createHash("sha256")
      .update(user.password)
      .digest("hex");

    // -----------------------------------------
    // CREATE ADMIN RESET TOKEN
    // -----------------------------------------

    const token = jwt.sign(
      {
        purpose: "admin-password-reset",
        userId: user.id,
        passwordVersion,
      },
      jwtSecret,
      {
        expiresIn: "15m",
      }
    );

    // -----------------------------------------
    // RESET URL
    // -----------------------------------------

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${appUrl}/auth/reset-password` +
      `?portal=admin` +
      `&token=${encodeURIComponent(token)}`;

    // -----------------------------------------
    // SMTP TRANSPORTER
    // -----------------------------------------

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

    // -----------------------------------------
    // SEND EMAIL
    // -----------------------------------------

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        `"CampusConnect Admin" <${smtpUser}>`,

      to: user.email,

      subject:
        "CampusConnect Admin Password Reset",

      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px">

          <h2>CampusConnect</h2>

          <h3>Admin Password Reset</h3>

          <p>
            Hello ${user.name || "Admin"},
          </p>

          <p>
            We received a request to reset your
            CampusConnect administrator password.
          </p>

          <p>
            Click the button below to create a new password.
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display:inline-block;
                padding:12px 22px;
                background:#67d5a5;
                color:#000;
                text-decoration:none;
                border-radius:8px;
                font-weight:bold;
              "
            >
              Reset Admin Password
            </a>
          </p>

          <p>
            This link will expire in 15 minutes.
          </p>

          <p>
            If you did not request this password reset,
            you can safely ignore this email.
          </p>

          <p>
            CampusConnect
          </p>

        </div>
      `,
    });

    console.log(
      "ADMIN RESET EMAIL SENT:",
      user.email
    );

    return NextResponse.json({
      success: true,
      message:
        "Admin password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error(
      "ADMIN FORGOT PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to send admin password reset email.",
      },
      { status: 500 }
    );
  }
}