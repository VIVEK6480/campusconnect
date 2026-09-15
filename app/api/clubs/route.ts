import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  campusUserId?: string;
  role?: string;
};

type AuthResult = {
  userId: string | null;
  role: string;
};

function getAuth(
  request: NextRequest,
  allowedRoles: string[],
  targetUserId?: string | null
): AuthResult | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const candidates: string[] = [];
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice(7).trim();
    if (bearer) candidates.push(bearer);
  }

  const studentToken = request.cookies.get("studentToken")?.value;
  const adminToken = request.cookies.get("token")?.value;
  const facultyToken = request.cookies.get("facultyToken")?.value;

  if (studentToken) candidates.push(studentToken);
  if (adminToken) candidates.push(adminToken);
  if (facultyToken) candidates.push(facultyToken);

  let fallbackAuth: AuthResult | null = null;

  for (const token of candidates) {
    try {
      const decoded = jwt.verify(token, secret) as TokenPayload;
      const role = String(decoded.role ?? "").toUpperCase();

      if (!allowedRoles.includes(role)) continue;

      const decodedId =
        typeof decoded.id === "string"
          ? decoded.id
          : typeof decoded.userId === "string"
          ? decoded.userId
          : typeof decoded.sub === "string"
          ? decoded.sub
          : null;

      if (
        targetUserId &&
        decodedId &&
        (decodedId === targetUserId || decoded.campusUserId === targetUserId)
      ) {
        return { userId: decodedId, role };
      }

      if (!fallbackAuth) {
        fallbackAuth = { userId: decodedId, role };
      }
    } catch {
      continue;
    }
  }

  return fallbackAuth;
}

// ===============================
// GET ALL CLUBS (FAST / PARALLEL)
// ===============================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const auth = getAuth(
      req,
      ["ADMIN", "SUPER_ADMIN", "STUDENT", "FACULTY"],
      userId
    );

    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const effectiveUserId = userId || auth.userId;

    // Parallel fetch using DB count aggregation
    const [clubs, memberships] = await Promise.all([
      prisma.club.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          logo: true,
          _count: {
            select: { members: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      effectiveUserId
        ? prisma.membership.findMany({
            where: {
              OR: [
                { userId: effectiveUserId },
                { user: { campusUserId: effectiveUserId } },
              ],
            },
            select: { clubId: true },
          })
        : Promise.resolve([]),
    ]);

    let totalMembers = 0;
    const formattedClubs = new Array(clubs.length);

    for (let i = 0; i < clubs.length; i++) {
      const c = clubs[i];
      const count = c._count.members;
      totalMembers += count;
      formattedClubs[i] = {
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
        logo: c.logo,
        members: count,
      };
    }

    const myClubIds = memberships.map((m) => m.clubId);

    return NextResponse.json(
      {
        success: true,
        clubs: formattedClubs,
        totalClubs: formattedClubs.length,
        totalMembers,
        myClubIds,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/clubs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clubs" },
      { status: 500 }
    );
  }
}

// ===============================
// CREATE CLUB / JOIN CLUB
// ===============================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, description, category, userId, clubId } = body;

    // JOIN CLUB
    if (action === "join") {
      const auth = getAuth(req, ["STUDENT", "FACULTY"], userId);

      if (!auth) {
        return NextResponse.json(
          { success: false, message: "Student or Faculty authentication is required." },
          { status: 401 }
        );
      }

      if (!userId || !clubId) {
        return NextResponse.json(
          { success: false, message: "User ID and Club ID are required" },
          { status: 400 }
        );
      }

      // Fast lookup
      const [user, club] = await Promise.all([
        prisma.user.findFirst({
          where: { OR: [{ id: userId }, { campusUserId: userId }] },
          select: { id: true, campusUserId: true },
        }),
        prisma.club.findUnique({
          where: { id: clubId },
          select: { id: true },
        }),
      ]);

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      if (!club) {
        return NextResponse.json(
          { success: false, message: "Club not found" },
          { status: 404 }
        );
      }

      const isAuthorizedUser =
        !auth.userId ||
        auth.userId === user.id ||
        auth.userId === user.campusUserId;

      if (!isAuthorizedUser) {
        return NextResponse.json(
          { success: false, message: "You can only join a club for your own account." },
          { status: 403 }
        );
      }

      const effectiveUserId = user.id;

      // Upsert/Create pattern
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_clubId: {
            userId: effectiveUserId,
            clubId,
          },
        },
        select: { id: true },
      });

      if (existingMembership) {
        return NextResponse.json(
          { success: false, message: "You have already joined this club" },
          { status: 400 }
        );
      }

      const membership = await prisma.membership.create({
        data: {
          userId: effectiveUserId,
          clubId,
        },
        select: { id: true, clubId: true, userId: true },
      });

      return NextResponse.json(
        { success: true, message: "Club joined successfully", membership },
        { status: 201 }
      );
    }

    // CREATE CLUB - ADMIN ONLY
    const auth = getAuth(req, ["ADMIN", "SUPER_ADMIN"]);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Admin authentication is required." },
        { status: 401 }
      );
    }

    if (!name || !description) {
      return NextResponse.json(
        { success: false, message: "Name and description are required" },
        { status: 400 }
      );
    }

    const existingClub = await prisma.club.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existingClub) {
      return NextResponse.json(
        { success: false, message: "Club already exists" },
        { status: 400 }
      );
    }

    const club = await prisma.club.create({
      data: {
        name,
        description,
        category: category || null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Club created successfully", club },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/clubs error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ===============================
// LEAVE CLUB
// ===============================

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const clubId = searchParams.get("clubId");

    const auth = getAuth(req, ["STUDENT", "FACULTY"], userId);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Student or Faculty authentication is required." },
        { status: 401 }
      );
    }

    if (!userId || !clubId) {
      return NextResponse.json(
        { success: false, message: "User ID and Club ID are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ id: userId }, { campusUserId: userId }] },
      select: { id: true, campusUserId: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const isAuthorizedUser =
      !auth.userId ||
      auth.userId === user.id ||
      auth.userId === user.campusUserId;

    if (!isAuthorizedUser) {
      return NextResponse.json(
        { success: false, message: "You can only leave a club for your own account." },
        { status: 403 }
      );
    }

    await prisma.membership.deleteMany({
      where: {
        userId: user.id,
        clubId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "You have left the club",
    });
  } catch (error) {
    console.error("DELETE /api/clubs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to leave club" },
      { status: 500 }
    );
  }
}