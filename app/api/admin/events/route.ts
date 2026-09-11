import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

function getToken(request: NextRequest) {
  return request.cookies.get("token")?.value || "";
}

function getAuth(request: NextRequest) {
  const token = getToken(request);

  if (!token) {
    return { ok: false, status: 401, message: "Unauthorized." };
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return { ok: false, status: 500, message: "JWT_SECRET is not configured." };
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const role = String(decoded.role || "").toUpperCase();

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return { ok: false, status: 403, message: "Admin access required." };
    }

    return { ok: true, status: 200, message: "Authorized.", decoded };
  } catch {
    return { ok: false, status: 401, message: "Invalid or expired session." };
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: CACHE_HEADERS }
  );
}

async function deleteExpiredEvents() {
  const now = new Date();

  try {
    const result = await prisma.event.deleteMany({
      where: {
        eventDate: {
          lt: now,
        },
      },
    });

    if (result.count > 0) {
      console.log(
        `[EVENT CLEANUP] Deleted ${result.count} expired event(s) automatically.`
      );
    }

    return result.count;
  } catch (error) {
    console.error(
      "EVENT EXPIRY CLEANUP ERROR:",
      error
    );

    return 0;
  }
}

export async function GET(request: NextRequest) {
  const auth = getAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  await deleteExpiredEvents();

  const id = request.nextUrl.searchParams.get("id")?.trim();

  try {
    if (id) {
      const event = await prisma.event.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          venue: true,
          clubId: true,
          eventDate: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          club: {
            select: {
              id: true,
              name: true,
              logo: true,
              category: true,
            },
          },
          _count: {
            select: {
              attendances: true,
            },
          },
        },
      });

      if (!event) {
        return jsonError("Event not found.", 404);
      }

      return NextResponse.json(
        {
          success: true,
          event: {
            ...event,
            attendanceCount: event._count.attendances,
          },
        },
        { status: 200, headers: CACHE_HEADERS }
      );
    }

    const events = await prisma.event.findMany({
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        venue: true,
        clubId: true,
        eventDate: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
          },
        },
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      venue: event.venue,
      clubId: event.clubId,
      eventDate: event.eventDate,
      image: event.image,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      club: event.club,
      attendanceCount: event._count.attendances,
    }));

    return NextResponse.json(
      { success: true, events: formattedEvents, count: formattedEvents.length },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("GET ADMIN EVENTS ERROR:", error);
    return jsonError("Failed to fetch events.", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  await deleteExpiredEvents();

  try {
    const body = await request.json();

    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const venue = String(body?.venue || "").trim();
    const clubId = String(body?.clubId || "").trim();
    const image = body?.image ? String(body.image).trim() : null;
    const eventDateValue = String(body?.eventDate || "").trim();

    if (!title) return jsonError("Event title is required.", 400);
    if (!description) return jsonError("Event description is required.", 400);
    if (!venue) return jsonError("Event venue is required.", 400);
    if (!clubId) return jsonError("Club is required.", 400);
    if (!eventDateValue) return jsonError("Event date and time are required.", 400);

    const eventDate = new Date(eventDateValue);

    if (Number.isNaN(eventDate.getTime())) {
      return jsonError("Invalid event date and time.", 400);
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });

    if (!club) {
      return jsonError("Selected club not found.", 404);
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        venue,
        clubId,
        eventDate,
        image: image || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        venue: true,
        clubId: true,
        eventDate: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: "Event created successfully.", event },
      { status: 201, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("CREATE ADMIN EVENT ERROR:", error);
    return jsonError("Failed to create event.", 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = getAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  await deleteExpiredEvents();

  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("Event id is required.", 400);
  }

  try {
    const body = await request.json();

    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const venue = String(body?.venue || "").trim();
    const clubId = String(body?.clubId || "").trim();
    const image = body?.image ? String(body.image).trim() : null;
    const eventDateValue = String(body?.eventDate || "").trim();

    if (!title) return jsonError("Event title is required.", 400);
    if (!description) return jsonError("Event description is required.", 400);
    if (!venue) return jsonError("Event venue is required.", 400);
    if (!clubId) return jsonError("Club is required.", 400);
    if (!eventDateValue) return jsonError("Event date and time are required.", 400);

    const eventDate = new Date(eventDateValue);

    if (Number.isNaN(eventDate.getTime())) {
      return jsonError("Invalid event date and time.", 400);
    }

    const [existingEvent, club] = await Promise.all([
      prisma.event.findUnique({
        where: { id },
        select: { id: true },
      }),
      prisma.club.findUnique({
        where: { id: clubId },
        select: { id: true },
      }),
    ]);

    if (!existingEvent) {
      return jsonError("Event not found.", 404);
    }

    if (!club) {
      return jsonError("Selected club not found.", 404);
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        venue,
        clubId,
        eventDate,
        image: image || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        venue: true,
        clubId: true,
        eventDate: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: "Event updated successfully.", event },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("UPDATE ADMIN EVENT ERROR:", error);
    return jsonError("Failed to update event.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = getAuth(request);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  await deleteExpiredEvents();

  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("Event id is required.", 400);
  }

  try {
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingEvent) {
      return jsonError("Event not found.", 404);
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Event deleted successfully." },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("DELETE ADMIN EVENT ERROR:", error);
    return jsonError(
      "Failed to delete event. Remove related attendance records first if your database relation requires it.",
      500
    );
  }
}
