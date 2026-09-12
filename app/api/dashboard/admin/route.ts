import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

function getToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") || "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authorization.slice(7).trim();

    if (bearerToken) {
      return bearerToken;
    }
  }

  return request.cookies.get("token")?.value || "";
}

function getAdminAuth(request: NextRequest):
  | { ok: true; userId: string; role: string }
  | { ok: false; response: NextResponse } {
  const token = getToken(request);

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
          headers: CACHE_HEADERS,
        }
      ),
    };
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("ADMIN DASHBOARD: JWT_SECRET is missing.");

    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Server authentication configuration error.",
        },
        {
          status: 500,
          headers: CACHE_HEADERS,
        }
      ),
    };
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const role = String(decoded.role || "").toUpperCase();

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            message: "Admin access is required.",
          },
          {
            status: 403,
            headers: CACHE_HEADERS,
          }
        ),
      };
    }

    const userId =
      typeof decoded.id === "string"
        ? decoded.id
        : typeof decoded.userId === "string"
        ? decoded.userId
        : typeof decoded.sub === "string"
        ? decoded.sub
        : "";

    if (!userId) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            message: "Invalid authentication session.",
          },
          {
            status: 401,
            headers: CACHE_HEADERS,
          }
        ),
      };
    }

    return {
      ok: true,
      userId,
      role,
    };
  } catch (error) {
    console.error("ADMIN DASHBOARD AUTH ERROR:", error);

    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        {
          status: 401,
          headers: CACHE_HEADERS,
        }
      ),
    };
  }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
}

function buildMonthSeries(
  now: Date,
  users: { createdAt: Date }[],
  events: { createdAt: Date }[],
) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - index),
      1,
    );

    return {
      key: monthKey(date),
      month: monthLabel(date),
      users: 0,
      events: 0,
    };
  });

  const lookup = new Map(months.map((item) => [item.key, item]));

  for (const user of users) {
    const item = lookup.get(monthKey(user.createdAt));
    if (item) item.users += 1;
  }

  for (const event of events) {
    const item = lookup.get(monthKey(event.createdAt));
    if (item) item.events += 1;
  }

  return months;
}

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const now = new Date();
    const trendStart = startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 5, 1),
    );

    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalClubs,
      totalEvents,
      totalActivities,
      totalAnnouncements,
      totalCertificates,
      totalNotifications,
      unreadNotifications,
      eventAttendanceTotal,
      eventAttendancePresent,
      usersForTrend,
      eventsForTrend,
      recentEvents,
      recentActivities,
      clubsForRanking,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "FACULTY" } }),
      prisma.user.count({
        where: {
          role: {
            in: ["ADMIN", "SUPER_ADMIN"],
          },
        },
      }),
      prisma.club.count(),
      prisma.event.count(),
      prisma.activity.count(),
      prisma.announcement.count(),
      prisma.certificate.count(),
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.attendance.count(),
      prisma.attendance.count({
        where: {
          status: {
            equals: "Present",
            mode: "insensitive",
          },
        },
      }),
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: trendStart,
          },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.event.findMany({
        where: {
          createdAt: {
            gte: trendStart,
          },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.event.findMany({
        orderBy: {
          eventDate: "asc",
        },
        take: 6,
        select: {
          id: true,
          title: true,
          venue: true,
          eventDate: true,
          image: true,
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.activity.findMany({
        orderBy: {
          activityDate: "desc",
        },
        take: 6,
        select: {
          id: true,
          title: true,
          description: true,
          venue: true,
          activityDate: true,
        },
      }),
      prisma.club.findMany({
        orderBy: {
          events: {
            _count: "desc",
          },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          category: true,
          logo: true,
          _count: {
            select: {
              events: true,
              announcements: true,
            },
          },
        },
      }),
    ]);

    const roleDistribution = [
      {
        name: "Students",
        value: totalStudents,
      },
      {
        name: "Faculty",
        value: totalFaculty,
      },
      {
        name: "Admins",
        value: totalAdmins,
      },
    ];

    const registrationTrend = buildMonthSeries(
      now,
      usersForTrend,
      eventsForTrend,
    );

    const upcomingEvents = recentEvents
      .filter((event) => new Date(event.eventDate) >= now)
      .slice(0, 5);

    const completedEvents = recentEvents
      .filter((event) => new Date(event.eventDate) < now)
      .slice(-5)
      .reverse();

    const eventStatus = [
      {
        name: "Upcoming",
        value: upcomingEvents.length,
      },
      {
        name: "Completed",
        value: completedEvents.length,
      },
    ];

    const eventAttendanceBreakdown = [
      {
        name: "Present",
        value: eventAttendancePresent,
      },
      {
        name: "Other",
        value: Math.max(eventAttendanceTotal - eventAttendancePresent, 0),
      },
    ];

    return NextResponse.json(
      {
        success: true,
        message: "Admin dashboard loaded successfully.",
        data: {
          totalUsers,
          totalStudents,
          totalFaculty,
          totalAdmins,
          totalClubs,
          totalEvents,
          totalActivities,
          totalAnnouncements,
          totalCertificates,
          totalNotifications,
          unreadNotifications,
          eventAttendanceTotal,
          eventAttendancePresent,
          registrationTrend,
          roleDistribution,
          eventStatus,
          eventAttendanceBreakdown,
          upcomingEvents,
          recentActivities,
          topClubs: clubsForRanking,
        },
      },
      {
        status: 200,
        headers: CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load the admin dashboard.",
      },
      {
        status: 500,
        headers: CACHE_HEADERS,
      },
    );
  }
}
