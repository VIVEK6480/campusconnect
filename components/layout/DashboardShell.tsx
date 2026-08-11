"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="min-h-screen lg:ml-[236px]">
        <TopNavbar
          mobileMenuOpen={mobileMenuOpen}
          onMenuClick={() => setMobileMenuOpen((value) => !value)}
        />

        <main className="min-h-[calc(100vh-72px)] min-w-0 overflow-x-hidden bg-gradient-to-br from-[#f5f8fc] via-white to-[#eef4ff]">
          {children}
        </main>
      </div>
    </div>
  );
}