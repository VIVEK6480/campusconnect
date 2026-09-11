import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  email?: string;
  role?: string;
};

function getAdminFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is missing.");
      return null;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (
      decoded.role !== "ADMIN" &&
      decoded.role !== "SUPER_ADMIN"
    ) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("ADMIN CLUB AUTH ERROR:", error);
    return null;
  }
}

// ======================================================
// GET SINGLE CLUB
// ======================================================

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = getAdminFromToken(req);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized admin access.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Club ID is required.",
        },
        { status: 400 }
      );
    }

    const club = await prisma.club.findUnique({
      where: {
        id,
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                campusUserId: true,
              },
            },
          },

          orderBy: {
            joinedAt: "desc",
          },
        },

        events: {
          select: {
            id: true,
            title: true,
            description: true,
            venue: true,
            eventDate: true,
            image: true,
            createdAt: true,
          },

          orderBy: {
            eventDate: "desc",
          },
        },

        announcements: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },
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

    return NextResponse.json(
      {
        success: true,

        club: {
          ...club,
          memberCount: club.members.length,
          eventCount: club.events.length,
          announcementCount: club.announcements.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET SINGLE ADMIN CLUB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch club.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// UPDATE CLUB
// ======================================================

export async function PUT(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = getAdminFromToken(req);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized admin access.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Club ID is required.",
        },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : null;

    const logo =
      typeof body.logo === "string"
        ? body.logo.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Club name is required.",
        },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          message: "Club description is required.",
        },
        { status: 400 }
      );
    }

    const existingClub = await prisma.club.findUnique({
      where: {
        id,
      },
    });

    if (!existingClub) {
      return NextResponse.json(
        {
          success: false,
          message: "Club not found.",
        },
        { status: 404 }
      );
    }

    const duplicateClub = await prisma.club.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateClub) {
      return NextResponse.json(
        {
          success: false,
          message: "Another club with this name already exists.",
        },
        { status: 409 }
      );
    }

    const updatedClub = await prisma.club.update({
      where: {
        id,
      },

      data: {
        name,
        description,
        category: category || null,
        logo: logo || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club updated successfully.",
        club: updatedClub,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE ADMIN CLUB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update club.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE CLUB
// ======================================================

export async function DELETE(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = getAdminFromToken(req);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized admin access.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Club ID is required.",
        },
        { status: 400 }
      );
    }

    const club = await prisma.club.findUnique({
      where: {
        id,
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

    await prisma.club.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Club deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE ADMIN CLUB ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete club.",
      },
      { status: 500 }
    );
  }
}