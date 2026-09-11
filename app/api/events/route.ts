import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type AuthResult = {
  token: string;
  role: string;
  userId: string | null;
};

function getAuth(
  request: NextRequest,
  allowedRoles: string[]
): AuthResult | null {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "JWT_SECRET is missing from environment variables."
    );
    return null;
  }

  const candidates: string[] = [];

  const authorization =
    request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const bearerToken =
      authorization.slice(7).trim();

    if (bearerToken) {
      candidates.push(bearerToken);
    }
  }

  const studentToken =
    request.cookies.get(
      "studentToken"
    )?.value;

  const facultyToken =
    request.cookies.get(
      "facultyToken"
    )?.value;

  const adminToken =
    request.cookies.get("token")?.value;

  if (studentToken) {
    candidates.push(studentToken);
  }

  if (facultyToken) {
    candidates.push(facultyToken);
  }

  if (adminToken) {
    candidates.push(adminToken);
  }

  for (const token of candidates) {
    try {
      const decoded = jwt.verify(
        token,
        secret
      ) as TokenPayload;

      const role = String(
        decoded.role ?? ""
      ).toUpperCase();

      if (!allowedRoles.includes(role)) {
        continue;
      }

      const userId =
        typeof decoded.id === "string"
          ? decoded.id
          : typeof decoded.userId === "string"
          ? decoded.userId
          : typeof decoded.sub === "string"
          ? decoded.sub
          : null;

      return {
        token,
        role,
        userId,
      };
    } catch {
      continue;
    }
  }

  return null;
}

/* =========================================================
   GET ALL EVENTS
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const auth = getAuth(request, [
      "ADMIN",
      "SUPER_ADMIN",
      "STUDENT",
      "FACULTY",
    ]);

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const events =
      await prisma.event.findMany({
        include: {
          club: true,
        },
        orderBy: {
          eventDate: "asc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        events,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET EVENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events.",
        events: [],
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   CREATE EVENT - ADMIN ONLY
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const auth = getAuth(request, [
      "ADMIN",
      "SUPER_ADMIN",
    ]);

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const venue =
      typeof body.venue === "string"
        ? body.venue.trim()
        : "";

    const eventDate =
      typeof body.eventDate === "string"
        ? body.eventDate.trim()
        : "";

    const image =
      typeof body.image === "string" &&
      body.image.trim()
        ? body.image.trim()
        : null;

    const clubId =
      typeof body.clubId === "string"
        ? body.clubId.trim()
        : "";

    if (
      !title ||
      !description ||
      !venue ||
      !eventDate ||
      !clubId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Title, description, venue, event date and club are required.",
        },
        {
          status: 400,
        }
      );
    }

    const parsedDate = new Date(
      eventDate
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event date.",
        },
        {
          status: 400,
        }
      );
    }

    const club =
      await prisma.club.findUnique({
        where: {
          id: clubId,
        },
      });

    if (!club) {
      return NextResponse.json(
        {
          success: false,
          message: "Club not found.",
        },
        {
          status: 404,
        }
      );
    }

    const event =
      await prisma.event.create({
        data: {
          title,
          description,
          venue,
          eventDate: parsedDate,
          image,
          clubId,
        },
        include: {
          club: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Event created successfully.",
        event,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE EVENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create event.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE EVENT - ADMIN ONLY
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth = getAuth(request, [
      "ADMIN",
      "SUPER_ADMIN",
    ]);

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id")?.trim() || "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Event ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const event =
      await prisma.event.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          title: true,
        },
      });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.attendance.deleteMany({
          where: {
            eventId: id,
          },
        });

        await tx.event.delete({
          where: {
            id,
          },
        });
      }
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Event deleted successfully from database.",
        eventId: id,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "DELETE EVENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete event.",
      },
      {
        status: 500,
      }
    );
  }
}