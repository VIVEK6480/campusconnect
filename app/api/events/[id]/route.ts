import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==============================
// GET SINGLE EVENT
// ==============================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        club: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        event,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET EVENT ERROR:", error);

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

// ==============================
// UPDATE EVENT
// ==============================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const {
      title,
      description,
      venue,
      eventDate,
      image,
    } = body;

    const existingEvent = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        {
          status: 404,
        }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        venue,
        eventDate: new Date(eventDate),
        image,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event updated successfully",
        event: updatedEvent,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update event",
      },
      {
        status: 500,
      }
    );
  }
}

// ==============================
// DELETE EVENT
// ==============================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingEvent = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.event.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Event deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete event",
      },
      {
        status: 500,
      }
    );
  }
}