"use client";

import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FacultyUser = {
  name?: string;
  email?: string;
  facultyId?: string;
  campusUserId?: string | null;
  role?: string;
};

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard/faculty",
    icon: ClipboardCheck,
  },
  {
    title: "Students",
    href: "/dashboard/faculty/students",
    icon: Users,
  },
  {
    title: "Student Approval",
    href: "/dashboard/faculty/approvals/students",
    icon: CheckCircle2,
  },
  {
    title: "Attendance",
    href: "/dashboard/faculty/attendance",
    icon: ClipboardCheck,
  },
  {
    title: "Events",
    href: "/dashboard/faculty/events",
    icon: CalendarDays,
  },
  {
    title: "Activities",
    href: "/dashboard/faculty/activities",
    icon: Activity,
  },
  {
    title: "Clubs",
    href: "/dashboard/faculty/clubs",
    icon: Users,
  },
  {
    title: "Faculty Profile",
    href: "/faculty/profile",
    icon: Users,
  },
  {
    title: "Notifications",
    href: "/dashboard/faculty/notifications",
    icon: Bell,
  },
];

export default function FacultyAttendanceLandingPage() {
  const router = useRouter();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [attendanceMenuOpen, setAttendanceMenuOpen] = useState(true);
  const [user, setUser] = useState<FacultyUser>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw =
          localStorage.getItem("facultyUser") ||
          localStorage.getItem("faculty") ||
          localStorage.getItem("currentFaculty");

        if (raw) {
          setUser(JSON.parse(raw) as FacultyUser);
        }
      } catch {}
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const facultyName = user.name || "Faculty Member";

  const facultyId =
    user.facultyId || user.campusUserId || "RNT-9457";

  const initials =
    facultyName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FM";

  function logout() {
    try {
      [
        "facultyUser",
        "faculty",
        "currentFaculty",
        "token",
        "facultyToken",
        "user",
      ].forEach((key) => localStorage.removeItem(key));
    } catch {}

    router.replace("/faculty/login");
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">

      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-[#23344d] bg-[#0b1423] text-white shadow-[8px_0_35px_rgba(5,15,30,0.16)] transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        {/* LOGO */}
        <div className="flex h-[92px] shrink-0 items-center border-b border-[#223149] px-6">
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#54bce5]">
              <GraduationCap
                size={25}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="font-serif text-[19px] font-bold text-white">
                CampusConnect
              </h1>

              <p className="text-[11px] text-[#91a4bb]">
                Faculty Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-[#8fa3bb] lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-7">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Main Menu
          </p>

          <nav className="space-y-1.5">

            {navigation.map((item) => {
              const Icon = item.icon;

              if (item.title === "Attendance") {
                return (
                  <div
                    key={item.title}
                    className="space-y-1"
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceMenuOpen((v) => !v)
                      }
                      className="flex h-11 w-full items-center gap-3 rounded-xl bg-[#17263a] px-3.5 text-left text-[13px] font-medium text-[#64c8ee] shadow-[inset_3px_0_0_#54bce5]"
                    >

                      <Icon size={18} />

                      <span className="flex-1">
                        Attendance
                      </span>

                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          attendanceMenuOpen
                            ? "rotate-90"
                            : ""
                        }`}
                      />

                    </button>

                    {attendanceMenuOpen && (
                      <div className="ml-3 border-l border-[#2b3d55] pl-2">

                        <Link
                          href="/dashboard/faculty/attendance/class"
                          onClick={() =>
                            setMobileSidebarOpen(false)
                          }
                          className="flex h-10 items-center rounded-lg px-3 text-[11px] font-semibold text-[#aab9ca] transition hover:bg-[#142135] hover:text-white"
                        >
                          Mark Class Attendance
                        </Link>

                        <Link
                          href="/dashboard/faculty/attendance/event"
                          onClick={() =>
                            setMobileSidebarOpen(false)
                          }
                          className="flex h-10 items-center rounded-lg px-3 text-[11px] font-semibold text-[#aab9ca] transition hover:bg-[#142135] hover:text-white"
                        >
                          Mark Event Attendance
                        </Link>

                      </div>
                    )}

                  </div>
                );
              }

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMobileSidebarOpen(false)
                  }
                  className="flex h-11 items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-[#9aabc0] transition hover:bg-[#142135] hover:text-white"
                >
                  <Icon size={18} />
                  {item.title}
                </Link>
              );
            })}

          </nav>

          <div className="my-7 h-px bg-[#24344a]" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Account
          </p>

          <Link
            href="/faculty/security"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-[#9aabc0] transition hover:bg-[#142135] hover:text-white"
          >
            <Settings size={18} />
            Settings
          </Link>

          <button
            type="button"
            onClick={logout}
            className="mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] transition hover:bg-[#142135] hover:text-white"
          >
            <LogOut size={18} />
            Sign Out
          </button>

        </div>

        {/* FACULTY PROFILE */}
        <div className="border-t border-[#223149] p-4">

          <div className="flex items-center gap-3 rounded-xl bg-[#111e31] px-3 py-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#69acd2] text-xs font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">

              <p className="truncate text-[12px] font-semibold text-white">
                {facultyName}
              </p>

              <p className="text-[10px] text-[#8296ae]">
                Faculty
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* MAIN AREA */}
      <div className="min-h-screen lg:pl-[270px]">

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open faculty sidebar"
          className="fixed left-4 top-4 z-[45] flex h-11 w-11 items-center justify-center rounded-xl border border-[#d5e4ed] bg-white text-[#38566d] shadow-lg lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* PAGE CONTENT */}
        <main className="min-h-screen bg-[#edf4fa] px-5 py-7 sm:px-6">

          <div className="w-full">

            {/* BANNER */}
            <section className="relative h-[280px] overflow-hidden rounded-[23px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-7 py-7 shadow-[0_18px_45px_rgba(10,27,48,0.18)] sm:px-9">

              <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#54bce5]/20" />

              <div className="relative z-10 flex h-full items-center justify-between gap-6">

                <div>

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#76d0f1]">

                    <ClipboardCheck size={14} />

                    Faculty Attendance

                  </div>

                  <h1 className="font-serif text-[34px] font-bold leading-[1.03] tracking-[-0.03em] text-white sm:text-[43px]">
                    Manage attendance.
                    <br />
                    <span className="text-[#69c9ed]">
                      Keep every record accurate.
                    </span>
                  </h1>

                  <p className="mt-4 max-w-[780px] text-sm leading-6 text-[#a7b7c9] sm:text-[13px]">
                    Record class and event attendance from one focused Faculty workspace,
                    with clear workflows for students, sections, subjects and campus events.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#7890aa]/30 bg-white/[0.04] px-3.5 py-2 text-[11px] text-[#b3c0d0]">

                    Faculty ID:

                    <span className="font-bold text-white">
                      {facultyId}
                    </span>

                  </div>

                </div>

              </div>

            </section>

            {/* ATTENDANCE OPTIONS */}
            <section className="mt-5 grid gap-5 md:grid-cols-2">

              {/* CLASS */}
              <Link
                href="/dashboard/faculty/attendance/class"
                className="
                  group relative overflow-hidden rounded-[20px]
                  border border-[#d9e4ee] bg-white p-7
                  shadow-[0_8px_25px_rgba(30,60,90,0.06)]
                  transition-all duration-300 ease-out
                  hover:-translate-y-1
                  hover:border-[#69b9df]
                  hover:shadow-[0_14px_34px_rgba(30,60,90,0.12),0_0_0_1px_rgba(105,185,223,0.22)]
                "
              >

                <div className="flex items-center justify-between">

                  <div
                    className="
                      flex h-12 w-12 items-center justify-center rounded-2xl
                      bg-[#eef8fc] text-[#3989b7]
                      transition-all duration-300 ease-out
                      group-hover:bg-[#69b9df]
                      group-hover:text-white
                      group-hover:shadow-[0_6px_18px_rgba(105,185,223,0.30)]
                      group-hover:scale-105
                    "
                  >
                    <Users size={22} />
                  </div>

                  <span
                    className="
                      flex h-10 w-10 items-center justify-center rounded-xl
                      bg-[#eef8fc] text-[#7e94a8]
                      transition-all duration-300 ease-out
                      group-hover:bg-[#69b9df]
                      group-hover:text-white
                      group-hover:shadow-[0_6px_18px_rgba(105,185,223,0.28)]
                      group-hover:translate-x-0.5
                    "
                  >
                    <ChevronRight size={20} />
                  </span>

                </div>

                <h2 className="mt-6 font-serif text-[24px] font-bold text-[#142238]">
                  Mark Class Attendance
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-[#72849a]">
                  Select semester, section and subject,
                  then mark multiple students at once.
                </p>

              </Link>

              {/* EVENT */}
              <Link
                href="/dashboard/faculty/attendance/event"
                className="
                  group relative overflow-hidden rounded-[20px]
                  border border-[#d9e4ee] bg-white p-7
                  shadow-[0_8px_25px_rgba(30,60,90,0.06)]
                  transition-all duration-300 ease-out
                  hover:-translate-y-1
                  hover:border-[#69b9df]
                  hover:shadow-[0_14px_34px_rgba(30,60,90,0.12),0_0_0_1px_rgba(105,185,223,0.22)]
                "
              >

                <div className="flex items-center justify-between">

                  <div
                    className="
                      flex h-12 w-12 items-center justify-center rounded-2xl
                      bg-[#eef8fc] text-[#3989b7]
                      transition-all duration-300 ease-out
                      group-hover:bg-[#69b9df]
                      group-hover:text-white
                      group-hover:shadow-[0_6px_18px_rgba(105,185,223,0.30)]
                      group-hover:scale-105
                    "
                  >
                    <CalendarDays size={22} />
                  </div>

                  <span
                    className="
                      flex h-10 w-10 items-center justify-center rounded-xl
                      bg-[#eef8fc] text-[#7e94a8]
                      transition-all duration-300 ease-out
                      group-hover:bg-[#69b9df]
                      group-hover:text-white
                      group-hover:shadow-[0_6px_18px_rgba(105,185,223,0.28)]
                      group-hover:translate-x-0.5
                    "
                  >
                    <ChevronRight size={20} />
                  </span>

                </div>

                <h2 className="mt-6 font-serif text-[24px] font-bold text-[#142238]">
                  Mark Event Attendance
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-[#72849a]">
                  Select an event and mark multiple
                  students present or absent in one action.
                </p>

              </Link>

            </section>

            {/* INFORMATION PANEL */}
            <section className="mt-5 rounded-[20px] border border-[#d9e4ee] bg-white p-5 shadow-[0_8px_25px_rgba(30,60,90,0.05)]">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef8fc] text-[#3989b7]">
                  <ClipboardCheck size={18} />
                </div>

                <div>

                  <h3 className="text-sm font-bold text-[#263a51]">
                    Attendance options
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#72849a]">
                    Use Class Attendance for regular classes
                    and Event Attendance for campus events.
                  </p>

                </div>

              </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}