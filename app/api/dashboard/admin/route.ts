import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    // ==========================================
    // 1. GET TOKEN
    // ==========================================

    const authHeader = req.headers.get("authorization");

    let token: string | undefined;

    // First check Authorization header
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    // If no Bearer token, check HTTP-only cookie
    if (!token) {
      token = req.cookies.get("token")?.value;
    }

    // No token
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // 2. VERIFY TOKEN
    // ==========================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");

      return NextResponse.json(
        {
          success: false,
          message: "JWT_SECRET is not configured",
        },
        {
          status: 500,
        }
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      ) as JwtPayload;
    } catch (error) {
      console.error("JWT VERIFY ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired token",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // 3. ADMIN AUTHORIZATION
    // ==========================================

    const allowedRoles = [
      "ADMIN",
      "SUPER_ADMIN",
    ];

    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // 4. CHECK USER STILL EXISTS
    // ==========================================

    const admin = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin user not found",
        },
        {
          status: 404,
        }
      );
    }

    if (!allowedRoles.includes(admin.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // 5. DASHBOARD STATISTICS
    // ==========================================

    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalClubs,
      totalMemberships,
      totalEvents,
      totalAnnouncements,
      totalCertificates,
      totalNotifications,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: {
          role: "STUDENT",
        },
      }),

      prisma.user.count({
        where: {
          role: "FACULTY",
        },
      }),

      prisma.user.count({
        where: {
          role: {
            in: ["ADMIN", "SUPER_ADMIN"],
          },
        },
      }),

      prisma.club.count(),

      prisma.membership.count(),

      prisma.event.count(),

      prisma.announcement.count(),

      prisma.certificate.count(),

      prisma.notification.count(),
    ]);

    // ==========================================
    // 6. RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,

        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          profileImage: admin.profileImage,
        },

        dashboard: {
          users: totalUsers,
          students: totalStudents,
          faculty: totalFaculty,
          admins: totalAdmins,
          clubs: totalClubs,
          memberships: totalMemberships,
          events: totalEvents,
          announcements: totalAnnouncements,
          certificates: totalCertificates,
          notifications: totalNotifications,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN DASHBOARD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch dashboard statistics",
      },
      {
        status: 500,
      }
    );
  }
}