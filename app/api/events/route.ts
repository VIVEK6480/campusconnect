import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  facultyId?: string;
  role?: string;
};

type AuthResult =
  | {
      ok: true;
      status: 200;
      message: string;
      decoded: TokenPayload;
      role: string;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: CACHE_HEADERS }
  );
}

function getToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") || "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    const bearer = authorization.slice(7).trim();

    if (bearer) {
      return bearer;
    }
  }

  return (
    request.cookies.get("token")?.value ||
    request.cookies.get("studentToken")?.value ||
    request.cookies.get("facultyToken")?.value ||
    ""
  );
}

function getAuth(
  request: NextRequest,
  allowedRoles: string[]
): AuthResult {
  const token = getToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Authentication token is required.",
    };
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return {
      ok: false,
      status: 500,
      message: "JWT_SECRET is not configured.",
    };
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const role = String(decoded.role || "").trim().toUpperCase();

    if (!role || !allowedRoles.includes(role)) {
      return {
        ok: false,
        status: 403,
        message: "You are not authorized to manage events.",
      };
    }

    return {
      ok: true,
      status: 200,
      message: "Authorized.",
      decoded,
      role,
    };
  } catch (error) {
    console.error("EVENT AUTH ERROR:", error);

    return {
      ok: false,
      status: 401,
      message: "Invalid or expired session.",
    };
  }
}

function eventSelect() {
  return {
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
  } as const;
}

type EventRequestBody = {
  title?: unknown;
  description?: unknown;
  venue?: unknown;
  clubId?: unknown;
  image?: unknown;
  eventDate?: unknown;
};

function parseEventBody(body: unknown) {
  const requestBody = (body ?? {}) as EventRequestBody;

  const title = String(requestBody.title || "").trim();
  const description = String(requestBody.description || "").trim();
  const venue = String(requestBody.venue || "").trim();
  const clubId = String(requestBody.clubId || "").trim();
  const image = requestBody.image ? String(requestBody.image).trim() : null;
  const eventDateValue = String(requestBody.eventDate || "").trim();

  return {
    title,
    description,
    venue,
    clubId,
    image,
    eventDateValue,
  };
}

function validateEventInput(input: ReturnType<typeof parseEventBody>) {
  if (!input.title) {
    return "Event title is required.";
  }

  if (!input.description) {
    return "Event description is required.";
  }

  if (!input.venue) {
    return "Event venue is required.";
  }

  if (!input.clubId) {
    return "Club is required.";
  }

  if (!input.eventDateValue) {
    return "Event date and time are required.";
  }

  const eventDate = new Date(input.eventDateValue);

  if (Number.isNaN(eventDate.getTime())) {
    return "Invalid event date and time.";
  }

  return null;
}

export async function GET(request: NextRequest) {
  const auth = getAuth(request, [
    "ADMIN",
    "SUPER_ADMIN",
    "STUDENT",
    "FACULTY",
  ]);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();

  try {
    if (id) {
      const event = await prisma.event.findUnique({
        where: { id },
        select: eventSelect(),
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
      select: eventSelect(),
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
      {
        success: true,
        events: formattedEvents,
        count: formattedEvents.length,
      },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("GET EVENTS ERROR:", error);
    return jsonError("Failed to fetch events.", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuth(request, [
    "ADMIN",
    "SUPER_ADMIN",
    "FACULTY",
  ]);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  try {
    const body = await request.json();
    const input = parseEventBody(body);
    const validationError = validateEventInput(input);

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const eventDate = new Date(input.eventDateValue);

    const club = await prisma.club.findUnique({
      where: { id: input.clubId },
      select: { id: true },
    });

    if (!club) {
      return jsonError("Selected club not found.", 404);
    }

    const event = await prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        venue: input.venue,
        clubId: input.clubId,
        eventDate,
        image: input.image || null,
      },
      select: eventSelect(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully.",
        event: {
          ...event,
          attendanceCount: event._count.attendances,
        },
      },
      { status: 201, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);
    return jsonError("Failed to create event.", 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = getAuth(request, [
    "ADMIN",
    "SUPER_ADMIN",
    "FACULTY",
  ]);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

  const id = request.nextUrl.searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("Event id is required.", 400);
  }

  try {
    const body = await request.json();
    const input = parseEventBody(body);
    const validationError = validateEventInput(input);

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const eventDate = new Date(input.eventDateValue);

    const [existingEvent, club] = await Promise.all([
      prisma.event.findUnique({
        where: { id },
        select: { id: true },
      }),
      prisma.club.findUnique({
        where: { id: input.clubId },
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
        title: input.title,
        description: input.description,
        venue: input.venue,
        clubId: input.clubId,
        eventDate,
        image: input.image || null,
      },
      select: eventSelect(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event updated successfully.",
        event: {
          ...event,
          attendanceCount: event._count.attendances,
        },
      },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);
    return jsonError("Failed to update event.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = getAuth(request, [
    "ADMIN",
    "SUPER_ADMIN",
    "FACULTY",
  ]);

  if (!auth.ok) {
    return jsonError(auth.message, auth.status);
  }

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

    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({
        where: { eventId: id },
      });

      await tx.event.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event deleted successfully.",
      },
      { status: 200, headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);
    return jsonError(
      "Failed to delete event. Please remove related attendance records first if your database relation requires it.",
      500
    );
  }
}
