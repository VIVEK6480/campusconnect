"use client";

import {
  ClipboardCheck,
  ChevronRight,
  Users,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type FacultyUser = {
  name?: string;
  email?: string;
  facultyId?: string;
  campusUserId?: string | null;
  role?: string;
};

export default function FacultyAttendanceLandingPage() {
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

  const facultyId =
    user.facultyId || user.campusUserId || "RNT-9457";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">
      <div className="min-h-screen w-full min-w-0">
        {/* PAGE CONTENT */}
        <main className="min-h-screen w-full bg-[#edf4fa] px-5 py-7 sm:px-6 lg:px-8">
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