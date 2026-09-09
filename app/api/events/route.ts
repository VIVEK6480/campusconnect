import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET ALL EVENTS
========================================================= */

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
      { status: 200 }
    );
  } catch (error) {
    console.error("GET EVENTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events.",
        events: [],
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE EVENT
========================================================= */

export async function POST(request: NextRequest) {
  try {
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

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

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
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       DATE VALIDATION
    ------------------------------------------------------- */

    const parsedDate = new Date(eventDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event date.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       CHECK CLUB
    ------------------------------------------------------- */

    const club = await prisma.club.findUnique({
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
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       CREATE EVENT
    ------------------------------------------------------- */

    const event = await prisma.event.create({
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
        message: "Event created successfully.",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create event.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE EVENT
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
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
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       CHECK EVENT
    ------------------------------------------------------- */

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
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       DELETE ATTENDANCE + EVENT
    ------------------------------------------------------- */

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
      { status: 200 }
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
      { status: 500 }
    );
  }
}