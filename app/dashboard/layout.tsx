"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bell,
  BookOpen,
  Users,
  Clock3,
  ArrowRight,
  ChevronRight,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function StudentDashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Local storage error:", error);
    }

    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur lg:hidden">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <GraduationCap
              size={21}
              className="text-white"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              CampusConnect
            </p>

            <p className="text-[11px] text-emerald-600">
              Student Portal
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label={
            mobileMenu
              ? "Close menu"
              : "Open menu"
          }
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
        >
          {mobileMenu ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>

      </header>


      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#071c16] text-white shadow-2xl transition-transform duration-300 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* =================================================
            LOGO
        ================================================== */}

        <div className="flex h-[82px] shrink-0 items-center gap-3 border-b border-white/10 px-6">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <GraduationCap size={23} />
          </div>

          <div>
            <h1 className="text-lg font-bold">
              CampusConnect
            </h1>

            <p className="text-xs text-emerald-300/70">
              Student Portal
            </p>
          </div>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================== */}

        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Main Menu
          </p>

          <nav className="space-y-1">

            <SidebarItem
              href="/dashboard/student"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active
              onNavigate={() => setMobileMenu(false)}
            />

            <SidebarItem
              href="/clubs"
              icon={<Building2 size={18} />}
              label="Clubs"
              onNavigate={() => setMobileMenu(false)}
            />

            <SidebarItem
              href="/events"
              icon={<CalendarDays size={18} />}
              label="Events"
              onNavigate={() => setMobileMenu(false)}
            />

            {/* ACTIVITIES - FIXED */}
            <SidebarItem
              href="/activities"
              icon={<BookOpen size={18} />}
              label="Activities"
              onNavigate={() => setMobileMenu(false)}
            />

            <SidebarItem
              href="/notifications"
              icon={<Bell size={18} />}
              label="Notifications"
              onNavigate={() => setMobileMenu(false)}
            />

          </nav>


          {/* =================================================
              CAMPUS
          ================================================== */}

          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Campus
          </p>

          <nav className="space-y-1">

            <SidebarItem
              href="/clubs"
              icon={<Users size={18} />}
              label="My Clubs"
              onNavigate={() => setMobileMenu(false)}
            />

            <SidebarItem
              href="/events"
              icon={<CalendarDays size={18} />}
              label="My Events"
              onNavigate={() => setMobileMenu(false)}
            />

          </nav>

        </div>


        {/* =================================================
            STUDENT PROFILE
        ================================================== */}

        <div className="border-t border-white/10 p-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 font-bold">
              S
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-semibold text-white">
                Student
              </p>

              <p className="truncate text-xs text-slate-400">
                CampusConnect User
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>


      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="min-h-screen w-full lg:ml-[270px] lg:w-[calc(100%-270px)]">

        {/* =================================================
            DESKTOP TOPBAR
        ================================================== */}

        <header className="sticky top-0 z-30 hidden h-[82px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:flex xl:px-8">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Student Portal
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Your campus, your experience.
            </p>

          </div>


          <div className="flex items-center gap-5">

            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                window.location.href = "/notifications";
              }}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
            >

              <Bell size={19} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />

            </button>


            <div className="h-8 w-px bg-slate-200" />


            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                S
              </div>

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Student
                </p>

                <p className="text-xs text-slate-500">
                  Campus Member
                </p>

              </div>

            </div>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================== */}

        <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">

          {/* =================================================
              WELCOME HERO
          ================================================== */}

          <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b] p-7 text-white shadow-xl shadow-emerald-900/10 sm:p-9">

            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="pointer-events-none absolute right-[35%] top-10 h-24 w-24 rounded-full border border-emerald-300/10" />

            <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">

              <div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <Sparkles size={13} />
                  Welcome back
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your campus.
                  <span className="block text-emerald-300">
                    Your experience.
                  </span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Discover clubs, explore events,
                  participate in activities and stay
                  connected with everything happening
                  around your campus.
                </p>

              </div>


              <button
                type="button"
                onClick={() => {
                  window.location.href = "/events";
                }}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Explore Events
                <ArrowRight size={17} />
              </button>

            </div>

          </div>


          {/* =================================================
              STATISTICS
          ================================================== */}

          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon={<Building2 size={20} />}
              title="My Clubs"
              value="0"
              description="Clubs joined"
            />

            <StatCard
              icon={<CalendarDays size={20} />}
              title="Upcoming Events"
              value="0"
              description="Events available"
            />

            <StatCard
              icon={<CheckCircle2 size={20} />}
              title="Activities"
              value="0"
              description="Activities completed"
            />

            <StatCard
              icon={<Bell size={20} />}
              title="Notifications"
              value="0"
              description="Unread updates"
            />

          </div>


          {/* =================================================
              QUICK ACCESS
          ================================================== */}

          <div className="mb-7">

            <div className="mb-4 flex items-end justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Quick Access
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Explore CampusConnect
                </h2>

              </div>

            </div>


            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              <FeatureCard
                href="/clubs"
                icon={<Building2 size={22} />}
                title="Clubs"
                description="Find communities and join clubs that match your interests."
              />

              <FeatureCard
                href="/events"
                icon={<CalendarDays size={22} />}
                title="Events"
                description="Discover workshops, competitions and campus events."
              />

              {/* ACTIVITIES - FIXED */}
              <FeatureCard
                href="/activities"
                icon={<BookOpen size={22} />}
                title="Activities"
                description="Track your participation and campus activities."
              />

              <FeatureCard
                href="/notifications"
                icon={<Bell size={22} />}
                title="Notifications"
                description="Stay updated with important campus announcements."
              />

            </div>

          </div>


          {/* =================================================
              LOWER SECTION
          ================================================== */}

          <div className="grid gap-6 xl:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Upcoming Events
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Do not miss what is happening on campus.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/events";
                  }}
                  className="flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                >
                  View all
                  <ChevronRight size={16} />
                </button>

              </div>


              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <CalendarDays size={25} />
                </div>

                <h3 className="font-semibold text-slate-800">
                  No upcoming events
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  New campus events will appear here
                  when they are available.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/events";
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Browse Events
                  <ArrowRight size={16} />
                </button>

              </div>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest campus activity.
                </p>

              </div>


              <div className="space-y-5">

                <ActivityItem
                  icon={<Building2 size={17} />}
                  title="Club membership"
                  description="Join your first campus club"
                />

                <ActivityItem
                  icon={<CalendarDays size={17} />}
                  title="Campus events"
                  description="Explore upcoming events"
                />

                <ActivityItem
                  icon={<Bell size={17} />}
                  title="Notifications"
                  description="Check your latest updates"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================== */}

          <footer className="mt-8 border-t border-slate-200 py-6">

            <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">

              <p>
                © 2026 CampusConnect. Smart Campus Management.
              </p>

              <p>
                Student Portal
              </p>

            </div>

          </footer>

        </section>

      </main>

    </div>
  );
}


/* ============================================================
   SIDEBAR ITEM
============================================================ */

function SidebarItem({
  href,
  icon,
  label,
  active = false,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-950/30"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <span
        className={`transition ${
          active
            ? "text-white"
            : "text-slate-500 group-hover:text-emerald-300"
        }`}
      >
        {icon}
      </span>

      <span>
        {label}
      </span>

      {active && (
        <ChevronRight
          size={15}
          className="ml-auto text-white/70"
        />
      )}
    </Link>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-white">
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}


/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-white">
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500"
        />
      </div>

      <h3 className="text-base font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </Link>
  );
}


/* ============================================================
   ACTIVITY ITEM
============================================================ */

function ActivityItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>

      </div>

      <Clock3
        size={14}
        className="ml-auto mt-1 shrink-0 text-slate-300"
      />

    </div>
  );
}