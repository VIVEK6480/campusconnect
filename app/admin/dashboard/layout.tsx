import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

import DashboardShell from "@/components/layout/DashboardShell";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // =========================================================
  // GET AUTH COOKIE
  // =========================================================

  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;

  // =========================================================
  // NO TOKEN
  // =========================================================

  if (!token) {
    redirect("/admin/login");
  }

  // =========================================================
  // JWT SECRET
  // =========================================================

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is missing");

    redirect("/admin/login");
  }

  // =========================================================
  // VERIFY TOKEN
  // =========================================================

  let decoded: TokenPayload;

  try {
    decoded = jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    console.error("ADMIN JWT ERROR:", error);

    redirect("/admin/login");
  }

  // =========================================================
  // CHECK ADMIN ROLE
  // =========================================================

  if (
    decoded.role !== "ADMIN" &&
    decoded.role !== "SUPER_ADMIN"
  ) {
    redirect("/admin/login");
  }

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}