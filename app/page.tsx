"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Building2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
  BookOpen,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">

      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 overflow-hidden">

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(
                circle at 10% 15%,
                rgba(16, 185, 129, 0.22),
                transparent 30%
              ),
              radial-gradient(
                circle at 90% 20%,
                rgba(59, 130, 246, 0.20),
                transparent 32%
              ),
              radial-gradient(
                circle at 80% 90%,
                rgba(139, 92, 246, 0.20),
                transparent 32%
              ),
              linear-gradient(
                135deg,
                #020617 0%,
                #071512 50%,
                #0b1024 100%
              )
            `,
          }}
        />

        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />

        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px]" />

        <div className="absolute -bottom-40 left-[35%] h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[130px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(255,255,255,0.8) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,0.8) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "55px 55px",
          }}
        />

        {/* Floating lights */}
        <div className="absolute left-[12%] top-[22%] h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_25px_rgba(110,231,183,1)]" />

        <div className="absolute right-[16%] top-[30%] h-2 w-2 animate-pulse rounded-full bg-blue-300 shadow-[0_0_25px_rgba(147,197,253,1)]" />

        <div className="absolute bottom-[22%] left-[20%] h-2 w-2 animate-pulse rounded-full bg-violet-300 shadow-[0_0_25px_rgba(196,181,253,1)]" />
      </div>

      {/* =========================================================
          CONTENT
      ========================================================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-6xl">

          {/* =====================================================
              HEADER
          ===================================================== */}

          <header className="mb-10 flex items-center justify-between">

            {/* Logo */}

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                <GraduationCap size={27} />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  CampusConnect
                </h1>

                <p className="text-xs text-slate-400 sm:text-sm">
                  Smart Campus Management
                </p>
              </div>

            </div>

            {/* Security badge */}

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400 backdrop-blur-sm sm:flex">

              <ShieldCheck
                size={15}
                className="text-emerald-400"
              />

              Secure Campus Platform

            </div>

          </header>

          {/* =====================================================
              HERO
          ===================================================== */}

          <section className="mb-10 text-center">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 sm:text-sm">

              <Sparkles size={15} />

              Welcome to CampusConnect

            </div>

            <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">

              Your campus.

              <br />

              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-blue-300 bg-clip-text text-transparent">
                One connected platform.
              </span>

            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Access clubs, events, activities, announcements and
              campus services from one modern platform.
            </p>

          </section>

          {/* =====================================================
              PORTAL CARDS
          ===================================================== */}

          <section className="grid gap-6 lg:grid-cols-2">

            {/* ===================================================
                STUDENT PORTAL
            =================================================== */}

            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.06] sm:p-9">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl transition duration-500 group-hover:bg-emerald-500/20" />

              <div className="relative z-10">

                {/* Icon */}

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                  <GraduationCap size={28} />
                </div>

                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Student Portal
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Welcome, Student
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Sign in to manage your campus activities,
                  clubs, events, memberships and notifications.
                </p>

                {/* Features */}

                <div className="mt-7 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <Users
                      size={16}
                      className="text-emerald-400"
                    />
                    Clubs
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <CalendarDays
                      size={16}
                      className="text-teal-400"
                    />
                    Events
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <BookOpen
                      size={16}
                      className="text-blue-400"
                    />
                    Activities
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <Sparkles
                      size={16}
                      className="text-violet-400"
                    />
                    Updates
                  </div>

                </div>

                {/* STUDENT LOGIN */}

                <Link
                  href="/auth/login"
                  className="group/button mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition duration-300 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-400/30"
                >
                  Student Login

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />
                </Link>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Student accounts only
                </p>

              </div>
            </div>

            {/* ===================================================
                ADMIN PORTAL
            =================================================== */}

            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.06] sm:p-9">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl transition duration-500 group-hover:bg-blue-500/20" />

              <div className="relative z-10">

                {/* Icon */}

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                  <ShieldCheck size={27} />
                </div>

                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  Administration
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Admin Portal
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Authorized administrators can manage users,
                  clubs, events, announcements and the complete
                  CampusConnect platform.
                </p>

                {/* Features */}

                <div className="mt-7 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <Users
                      size={16}
                      className="text-blue-400"
                    />
                    Users
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <Building2
                      size={16}
                      className="text-indigo-400"
                    />
                    Clubs
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <CalendarDays
                      size={16}
                      className="text-violet-400"
                    />
                    Events
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-xs text-slate-300">
                    <ShieldCheck
                      size={16}
                      className="text-emerald-400"
                    />
                    Security
                  </div>

                </div>

                {/* ADMIN LOGIN */}

                <Link
                  href="/admin/login"
                  className="group/button mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-5 py-3.5 text-sm font-semibold text-blue-300 transition duration-300 hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-white"
                >
                  Login as Admin

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />
                </Link>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Authorized administration access only
                </p>

              </div>
            </div>

          </section>

          {/* =====================================================
              BOTTOM FEATURES
          ===================================================== */}

          <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3 text-xs text-slate-500">
              <Building2
                size={15}
                className="text-emerald-400"
              />
              Club Management
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3 text-xs text-slate-500">
              <CalendarDays
                size={15}
                className="text-blue-400"
              />
              Event Management
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3 text-xs text-slate-500">
              <ShieldCheck
                size={15}
                className="text-violet-400"
              />
              Secure Access
            </div>

          </section>

          {/* =====================================================
              FOOTER
          ===================================================== */}

          <footer className="mt-8 text-center">

            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} CampusConnect
            </p>

            <p className="mt-1 text-xs text-slate-700">
              Smart Campus Management Platform
            </p>

          </footer>

        </div>

      </div>

    </main>
  );
}