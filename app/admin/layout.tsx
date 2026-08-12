"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();

  // Admin login page should have no dashboard shell
  const isLoginPage =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/");

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Top navbar ONLY on dashboard
  const showTopNavbar = pathname === "/admin/dashboard";

  return (
    <DashboardShell showTopNavbar={showTopNavbar}>
      {children}
    </DashboardShell>
  );
}