import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==============================
// GET ALL EVENTS
// ==============================
export async function GET() {
  try {
    const events = await prisma.event.findMany({
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
    console.error("GET EVENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
      },
      {
        status: 500,
      }
    );
  }
}

// ==============================
// CREATE EVENT
// ==============================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("REQUEST BODY:", body);

    const {
      title,
      description,
      venue,
      eventDate,
      image,
      clubId,
    } = body;

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
          message: "All required fields are required",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================
    // DEBUG
    // ==========================

    const clubs = await prisma.club.findMany();

    console.log("ALL CLUBS:", clubs);

    const club = clubs.find(
      (c) => c.id === String(clubId).trim()
    );

    console.log("MATCHED CLUB:", club);

    if (!club) {
      return NextResponse.json(
        {
          success: false,
          message: "Club not found",
        },
        {
          status: 404,
        }
      );
    }

    // ==========================
    // CREATE EVENT
    // ==========================

    const event = await prisma.event.create({
      data: {
        title,
        description,
        venue,
        eventDate: new Date(eventDate),
        image: image || null,
        club: {
          connect: {
            id: club.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully",
        event,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error:
          error instanceof Error
            ? error.message
            : "Unknown Error",
      },
      {
        status: 500,
      }
    );
  }
}