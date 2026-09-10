"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";


export default function AdminUsersPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      {/* ============================================================
          BACKGROUND
      ============================================================ */}

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="pointer-events-none fixed -left-40 top-10 z-0 h-96 w-96 rounded-full bg-indigo-300/15 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 top-1/4 z-0 h-[420px] w-[420px] rounded-full bg-blue-300/15 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-180px] left-1/3 z-0 h-[460px] w-[460px] rounded-full bg-sky-300/10 blur-3xl" />

      <div className="relative z-10 w-full px-4 py-6 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* ============================================================
            ADMIN TOP HEADER
        ============================================================ */}

        <header className="-mx-4 -mt-6 mb-6 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-[0_1px_8px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10 2xl:-mx-12 2xl:px-12">
          <div className="mx-auto flex min-h-[62px] w-full items-center justify-between gap-4">
            <div className="min-w-[190px]">
              <div className="text-[15px] font-black tracking-[0.14em] text-indigo-600">
                ADMIN PORTAL
              </div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">
                Your campus, under your control.
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span className="text-lg">♧</span>
                <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              <div className="hidden h-10 w-px bg-slate-200 sm:block" />

              <div className="hidden text-right sm:block">
                <div className="text-sm font-bold text-slate-800">
                  Administrator
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  System Admin
                </div>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
                A
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================
            HERO
        ============================================================ */}

        <section className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#202f73] via-[#30499c] to-[#4d6be0] px-7 py-8 text-white shadow-[0_18px_45px_rgba(37,58,135,0.20)] sm:px-9 sm:py-9 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-20 -top-10 h-32 w-32 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-[-100px] right-[20%] h-64 w-64 rounded-full border border-white/10" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-white backdrop-blur-sm">
                <Users className="h-4 w-4" />
                CampusConnect User Administration
              </div>

              <h2 className="max-w-3xl text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
                One workspace.
                <br />
                Every campus user.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-50 sm:text-base">
                Choose the user category you want to manage. Students are
                organized by semester and section, while faculty are organized
                by department.
              </p>
            </div>

            <div className="hidden shrink-0 lg:flex">
              <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
                <Users className="h-12 w-12 text-white/90" />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            USER CATEGORY CARDS
        ============================================================ */}

        <div className="grid gap-6 xl:grid-cols-2">
          {/* ==========================================================
              STUDENT
          ========================================================== */}

          <section className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_20px_45px_rgba(79,70,229,0.14)]">
            <div className="absolute right-[-45px] top-[-45px] h-36 w-36 rounded-full bg-indigo-50 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 p-6 sm:p-7 lg:p-8">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_12px_28px_rgba(79,70,229,0.25)]">
                  <GraduationCap className="h-8 w-8" />
                </div>

                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-indigo-600">
                  STUDENT
                </span>
              </div>

              <h3 className="text-2xl font-black tracking-tight text-slate-950">
                Student Management
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Manage registered student accounts, academic groups, approval
                status and complete student information.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniBox label="Organized By" value="Semester" />
                <MiniBox label="Academic Group" value="Section" />
                <MiniBox label="Access" value="Student Portal" />
              </div>

              <button
                type="button"
                onClick={() => router.push("/admin/users/students")}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-[0_14px_28px_rgba(79,70,229,0.22)]"
              >
                Manage Students
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </section>

          {/* ==========================================================
              FACULTY
          ========================================================== */}

          <section className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(37,99,235,0.14)]">
            <div className="absolute right-[-45px] top-[-45px] h-36 w-36 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative z-10 p-6 sm:p-7 lg:p-8">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_12px_28px_rgba(37,99,235,0.25)]">
                  <BriefcaseBusiness className="h-8 w-8" />
                </div>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-blue-600">
                  FACULTY
                </span>
              </div>

              <h3 className="text-2xl font-black tracking-tight text-slate-950">
                Faculty Management
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Manage faculty accounts, departments, professional details,
                approval status and faculty profile information.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniBox label="Organized By" value="Department" />
                <MiniBox label="Profile" value="Professional" />
                <MiniBox label="Access" value="Faculty Portal" />
              </div>

              <button
                type="button"
                onClick={() => router.push("/admin/users/faculty")}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-[0_14px_28px_rgba(37,99,235,0.22)]"
              >
                Manage Faculty
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </section>
        </div>

        {/* ============================================================
            FOOTER INFORMATION
        ============================================================ */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-center shadow-sm backdrop-blur-sm">
          <p className="text-sm font-bold text-slate-600">
            Choose a user category above to continue.
          </p>

          <p className="mt-1 text-xs font-medium text-slate-400">
            Students are managed by semester and section, while faculty are
            managed by department.
          </p>
        </section>
      </div>
    </main>
  );
}

function MiniBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}
