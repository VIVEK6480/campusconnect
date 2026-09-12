import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type TokenPayload = JwtPayload & { id?: string; userId?: string; role?: string };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function authenticateAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const token = bearer || request.cookies.get("token")?.value || "";

  if (!token) return { ok: false as const, response: json({ success: false, message: "Authentication required." }, 401) };

  const secret = process.env.JWT_SECRET;
  if (!secret) return { ok: false as const, response: json({ success: false, message: "Server authentication configuration error." }, 500) };

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const role = String(decoded.role || "").toUpperCase();
    const userId = typeof decoded.id === "string" ? decoded.id : typeof decoded.userId === "string" ? decoded.userId : typeof decoded.sub === "string" ? decoded.sub : "";

    if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return { ok: false as const, response: json({ success: false, message: "Admin access is required." }, 403) };
    }

    return { ok: true as const, userId, role };
  } catch (error) {
    console.error("ADMIN SETTINGS AUTH ERROR:", error);
    return { ok: false as const, response: json({ success: false, message: "Invalid or expired session." }, 401) };
  }
}

const userSelect = {
  id: true,
  campusUserId: true,
  name: true,
  email: true,
  phone: true,
  department: true,
  designation: true,
  profileImage: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAdmin(request);
    if (!auth.ok) return auth.response;

    const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: userSelect });
    if (!user) return json({ success: false, message: "Admin profile was not found." }, 404);

    return json({ success: true, user });
  } catch (error) {
    console.error("ADMIN SETTINGS GET ERROR:", error);
    return json({ success: false, message: "Unable to load admin profile." }, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = authenticateAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const department = typeof body.department === "string" ? body.department.trim() : "";
    const designation = typeof body.designation === "string" ? body.designation.trim() : "";
    const profileImage = typeof body.profileImage === "string" && body.profileImage.trim() ? body.profileImage.trim() : null;

    if (!name) return json({ success: false, message: "Name is required." }, 400);
    if (!email) return json({ success: false, message: "Email is required." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, message: "Please enter a valid email address." }, 400);
    if (profileImage && !profileImage.startsWith("data:image/")) return json({ success: false, message: "Invalid profile image format." }, 400);
    if (profileImage && profileImage.length > 7_000_000) return json({ success: false, message: "Profile image is too large." }, 413);

    const duplicate = await prisma.user.findFirst({ where: { email, NOT: { id: auth.userId } }, select: { id: true } });
    if (duplicate) return json({ success: false, message: "This email address is already being used by another account." }, 409);

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: { name, email, phone: phone || null, department: department || null, designation: designation || null, profileImage },
      select: userSelect,
    });

    return json({ success: true, message: "Admin profile updated successfully.", user });
  } catch (error) {
    console.error("ADMIN SETTINGS PUT ERROR:", error);
    return json({ success: false, message: "Unable to update admin profile." }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = authenticateAdmin(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) return json({ success: false, message: "Current password and new password are required." }, 400);
    if (newPassword.length < 6) return json({ success: false, message: "New password must contain at least 6 characters." }, 400);
    if (currentPassword === newPassword) return json({ success: false, message: "New password must be different from the current password." }, 400);

    const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { password: true } });
    if (!user) return json({ success: false, message: "Admin profile was not found." }, 404);

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) return json({ success: false, message: "Current password is incorrect." }, 401);

    const password = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: auth.userId }, data: { password } });

    return json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("ADMIN SETTINGS PASSWORD ERROR:", error);
    return json({ success: false, message: "Unable to change admin password." }, 500);
  }
}
