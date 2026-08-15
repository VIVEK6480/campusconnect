import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/prisma";

type JwtPayload = {
  userId?: string;
  id?: string;
  role?: string;
};

export async function getApprovedStudent() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing.");
      return null;
    }

    let payload: JwtPayload;

    try {
      payload = jwt.verify(
        token,
        jwtSecret
      ) as JwtPayload;
    } catch {
      return null;
    }

    const userId = payload.userId || payload.id;

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        campusUserId: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return null;
    }

    // STUDENT ONLY
    if (user.role !== "STUDENT") {
      return null;
    }

    // APPROVAL REQUIRED
    if (user.approvalStatus !== "APPROVED") {
      return null;
    }

    return user;
  } catch (error) {
    console.error(
      "GET APPROVED STUDENT ERROR:",
      error
    );

    return null;
  }
}