"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Clock3,
  Grid2X2,
  GraduationCap,
  LogOut,
  Settings,
  Shield,
  User,
  UserCheck,
} from "lucide-react";

export default function FacultyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /*
   * Dashboard page already contains its own faculty sidebar.
   * Therefore layout sidebar must stay hidden only on:
   * /dashboard/faculty
   *
   * Other faculty pages continue using this layout sidebar.
   */
  const isFacultyDashboard = pathname === "/dashboard/faculty";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07111f] text-slate-900">
      {/* =========================================================
          PERMANENT FACULTY SIDEBAR
          Hidden on Faculty Dashboard because that page already
          contains its own sidebar.
      ========================================================== */}
      {!isFacultyDashboard && (
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-white/10 bg-[#07111f] text-white lg:flex lg:flex-col">
          {/* LOGO */}
          <div className="flex h-24 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] shadow-lg shadow-blue-900/30">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>

            <div>
              <p className="text-lg font-black tracking-tight text-white">
                CampusConnect
              </p>

              <p className="text-xs font-medium text-slate-400">
                Faculty Portal
              </p>
            </div>
          </div>

          {/* FACULTY PROFILE */}
          <div className="px-4 pt-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-black text-white shadow-lg shadow-blue-900/30">
                  F
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    Faculty
                  </p>

                  <p className="text-xs text-slate-400">
                    Faculty Account
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN MENU */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Main Menu
            </p>

            <nav className="space-y-1.5">
              <Link
                href="/dashboard/faculty"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Grid2X2 className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/faculty/approvals/students"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <UserCheck className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Student Approval</span>
              </Link>

              <Link
                href="/dashboard/faculty/attendance"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Clock3 className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Attendance</span>
              </Link>

              <Link
                href="/dashboard/faculty/events"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <CalendarDays className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Events</span>
              </Link>

              <Link
                href="/dashboard/faculty/profile"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <User className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Profile</span>
              </Link>

              <Link
                href="/dashboard/faculty/security"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Shield className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Security</span>
              </Link>
            </nav>

            {/* ACCOUNT */}
            <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Account
            </p>

            <nav className="space-y-1.5">
              <Link
                href="/dashboard/faculty/notifications"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Bell className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Notifications</span>
              </Link>

              <Link
                href="/dashboard/faculty/settings"
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Settings className="h-5 w-5 text-slate-500 transition group-hover:text-blue-400" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>

          {/* SIDEBAR FOOTER */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />

                <span className="text-xs font-semibold text-slate-300">
                  System Operational
                </span>
              </div>

              <LogOut className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </aside>
      )}

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <main
        className={
          isFacultyDashboard
            ? "min-h-screen w-full bg-[#07111f]"
            : "min-h-screen w-full bg-[#07111f] lg:ml-72 lg:w-[calc(100%-18rem)]"
        }
      >
        <div className="min-h-screen w-full bg-[#f3f7fc]">
          {children}
        </div>
      </main>
    </div>
  );
}