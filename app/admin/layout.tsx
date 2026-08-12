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

  /*
   * Login page should NOT contain admin sidebar.
   */
  const isLoginPage =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/");

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}