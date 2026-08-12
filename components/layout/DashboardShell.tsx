"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  // Top navbar should appear ONLY on the admin dashboard.
  const isDashboard = pathname === "/admin/dashboard";

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* SIDEBAR */}
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* MAIN AREA */}
      <main className="lg:ml-[252px]">
        {/* TOP NAVBAR - DASHBOARD ONLY */}
        {isDashboard && (
          <TopNavbar
            mobileMenuOpen={mobileMenuOpen}
            onMenuClick={() => setMobileMenuOpen(true)}
          />
        )}

        {/* PAGE CONTENT */}
        <div
          className={
            isDashboard
              ? "relative min-h-[calc(100vh-76px)] overflow-hidden"
              : "relative min-h-screen overflow-hidden"
          }
        >
          {/* BACKGROUND */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-400/10 blur-3xl" />

            <div className="absolute -left-40 top-[35%] h-[360px] w-[360px] rounded-full bg-indigo-400/10 blur-3xl" />

            <div className="absolute -bottom-40 right-[20%] h-[360px] w-[360px] rounded-full bg-violet-400/10 blur-3xl" />
          </div>

          {/* ACTUAL PAGE */}
          <div className="relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}