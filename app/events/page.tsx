import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ========================================
// GET ALL EVENTS
// ========================================
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
        count: events.length,
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

// ========================================
// CREATE EVENT
// ========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      venue,
      eventDate,
      image,
      clubId,
    } = body;

    // ==============================
    // VALIDATION
    // ==============================

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
            "Title, Description, Venue, Event Date and Club ID are required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==============================
    // CHECK CLUB
    // ==============================

    const club = await prisma.club.findUnique({
      where: {
        id: clubId.trim(),
      },
    });

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

    // ==============================
    // CREATE EVENT
    // ==============================

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
      include: {
        club: true,
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
      },
      {
        status: 500,
      }
    );
  }
}