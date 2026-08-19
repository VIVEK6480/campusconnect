"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Users,
} from "lucide-react";

export default function FacultyAttendancePage() {
  return (
    <main className="min-h-screen bg-[#edf4fa] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1500px]">

        <Link
          href="/dashboard/faculty"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#3989b7] hover:text-[#1d658d]"
        >
          <ArrowLeft size={17} />
          Back to Faculty Dashboard
        </Link>

        <section className="rounded-[23px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] p-7 text-white shadow-[0_18px_45px_rgba(10,27,48,0.18)] sm:p-9">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3 py-1.5 text-xs font-semibold text-[#76d0f1]">
                <ClipboardCheck size={14} />
                Faculty Attendance
              </div>

              <h1 className="font-serif text-3xl font-bold sm:text-4xl">
                Attendance Management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a7b7c9]">
                Record and monitor attendance for students assigned to you.
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#54bce5]/25 bg-[#15273b]">
              <ClipboardCheck
                size={32}
                strokeWidth={1.6}
                className="text-[#67bfe6]"
              />
            </div>

          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-[20px] border border-[#d8e3ed] bg-white p-5 shadow-[0_7px_22px_rgba(30,60,90,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#687c93]">
                  Total Students
                </p>
                <p className="mt-2 text-3xl font-bold text-[#0b1728]">
                  0
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#4ba4d2]">
                <Users size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#d8e3ed] bg-white p-5 shadow-[0_7px_22px_rgba(30,60,90,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#687c93]">
                  Attendance Records
                </p>
                <p className="mt-2 text-3xl font-bold text-[#0b1728]">
                  0
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#4ba4d2]">
                <ClipboardCheck size={20} />
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#d8e3ed] bg-white p-5 shadow-[0_7px_22px_rgba(30,60,90,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#687c93]">
                  Today
                </p>
                <p className="mt-2 text-lg font-bold text-[#0b1728]">
                  {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#4ba4d2]">
                <CalendarDays size={20} />
              </div>
            </div>
          </div>

        </section>

        <section className="mt-6 rounded-[20px] border border-[#d9e4ee] bg-white p-6 shadow-[0_8px_25px_rgba(30,60,90,0.06)]">

          <h2 className="font-serif text-xl font-bold text-[#142238]">
            Attendance Records
          </h2>

          <p className="mt-2 text-sm text-[#72849a]">
            Attendance records will appear here once students are assigned
            and attendance data is available.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-[#cbd9e5] bg-[#fafcfe] px-5 py-10 text-center">
            <ClipboardCheck
              size={30}
              className="mx-auto text-[#8aa5bb]"
              strokeWidth={1.5}
            />

            <p className="mt-3 text-sm font-semibold text-[#41566d]">
              No attendance records yet
            </p>

            <p className="mt-1 text-xs text-[#8194a8]">
              Attendance data will be displayed here.
            </p>
          </div>

        </section>

      </div>
    </main>
  );
}
