import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

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
  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is missing");
    redirect("/admin/login");
  }

  let decoded: TokenPayload;

  try {
    decoded = jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    console.error("ADMIN JWT ERROR:", error);
    redirect("/admin/login");
  }

  if (
    decoded.role !== "ADMIN" &&
    decoded.role !== "SUPER_ADMIN"
  ) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}