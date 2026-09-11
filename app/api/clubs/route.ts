import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
};

type AuthResult = {
  userId: string | null;
  role: string;
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
        userId,
        role,
      };
    } catch {
      continue;
    }
  }

  return null;
}

// ===============================
// GET ALL CLUBS
// ===============================

export async function GET(
  req: NextRequest
) {
  try {
    const auth = getAuth(req, [
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

    const { searchParams } =
      new URL(req.url);

    const userId =
      searchParams.get("userId");

    const clubs =
      await prisma.club.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          members: true,
        },
      });

    let myClubIds: string[] = [];

    if (userId) {
      const memberships =
        await prisma.membership.findMany({
          where: {
            userId,
          },
          select: {
            clubId: true,
          },
        });

      myClubIds =
        memberships.map(
          (membership) =>
            membership.clubId
        );
    }

    const formattedClubs =
      clubs.map((club) => ({
        id: club.id,
        name: club.name,
        description:
          club.description,
        category: club.category,
        logo: club.logo,
        members:
          Array.isArray(club.members)
            ? club.members.length
            : 0,
      }));

    const totalMembers =
      formattedClubs.reduce(
        (total, club) =>
          total +
          Number(club.members || 0),
        0
      );

    return NextResponse.json({
      success: true,
      clubs: formattedClubs,
      totalClubs:
        formattedClubs.length,
      totalMembers,
      myClubIds,
    });
  } catch (error) {
    console.error(
      "GET /api/clubs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch clubs",
      },
      {
        status: 500,
      }
    );
  }
}

// ===============================
// CREATE CLUB / JOIN CLUB
// ===============================

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const {
      action,
      name,
      description,
      category,
      userId,
      clubId,
    } = body;

    // ===============================
    // JOIN CLUB
    // ===============================

    if (action === "join") {
      const auth = getAuth(req, [
        "STUDENT",
        "FACULTY",
      ]);

      if (!auth) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student or Faculty authentication is required.",
          },
          {
            status: 401,
          }
        );
      }

      if (!userId || !clubId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "User ID and Club ID are required",
          },
          {
            status: 400,
          }
        );
      }

      // Prevent one user from joining on behalf of another user.
      if (
        auth.userId &&
        auth.userId !== userId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You can only join a club for your own account.",
          },
          {
            status: 403,
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
            message:
              "Club not found",
          },
          {
            status: 404,
          }
        );
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message:
              "User not found",
          },
          {
            status: 404,
          }
        );
      }

      const existingMembership =
        await prisma.membership.findUnique({
          where: {
            userId_clubId: {
              userId,
              clubId,
            },
          },
        });

      if (existingMembership) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You have already joined this club",
          },
          {
            status: 400,
          }
        );
      }

      const membership =
        await prisma.membership.create({
          data: {
            userId,
            clubId,
          },
        });

      return NextResponse.json(
        {
          success: true,
          message:
            "Club joined successfully",
          membership,
        },
        {
          status: 201,
        }
      );
    }

    // ===============================
    // CREATE CLUB - ADMIN ONLY
    // ===============================

    const auth = getAuth(req, [
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

    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name and description are required",
        },
        {
          status: 400,
        }
      );
    }

    const existingClub =
      await prisma.club.findUnique({
        where: {
          name,
        },
      });

    if (existingClub) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Club already exists",
        },
        {
          status: 400,
        }
      );
    }

    const club =
      await prisma.club.create({
        data: {
          name,
          description,
          category:
            category || null,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Club created successfully",
        club,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/clubs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}

// ===============================
// LEAVE CLUB
// ===============================

export async function DELETE(
  req: NextRequest
) {
  try {
    const auth = getAuth(req, [
      "STUDENT",
      "FACULTY",
    ]);

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student or Faculty authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const userId =
      searchParams.get("userId");

    const clubId =
      searchParams.get("clubId");

    if (!userId || !clubId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User ID and Club ID are required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      auth.userId &&
      auth.userId !== userId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only leave a club for your own account.",
        },
        {
          status: 403,
        }
      );
    }

    const existingMembership =
      await prisma.membership.findUnique({
        where: {
          userId_clubId: {
            userId,
            clubId,
          },
        },
      });

    if (!existingMembership) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Membership not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.membership.delete({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "You have left the club",
    });
  } catch (error) {
    console.error(
      "DELETE /api/clubs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to leave club",
      },
      {
        status: 500,
      }
    );
  }
}