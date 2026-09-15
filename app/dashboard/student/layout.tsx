"use client";

import type { ReactNode } from "react";

export default function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      {/* Sidebar aur Header ko yahan se poori tarah hata diya gaya hai */}
      <main className="w-full min-h-screen">
        {children}
      </main>
    </div>
  );
}