"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bell,
  BookOpen,
  Users,
  Clock3,
  ChevronRight,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  MapPin,
  RefreshCw,
} from "lucide-react";

type Activity = {
  id: string;
  title: string;
  description: string;
  venue: string;
  activityDate: string;
  createdAt: string;
  updatedAt: string;
};

export default function ActivitiesPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // FETCH ACTIVITIES
  // ============================================================

  const fetchActivities = async () => {
    try {
      setRefreshing(true);

      const response = await fetch("/api/activities", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.activities)) {
        setActivities(data.activities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("FETCH ACTIVITIES ERROR:", error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // LOAD ACTIVITIES
  // ============================================================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchActivities();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================

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

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigate = (href: string) => {
    setMobileMenu(false);
    window.location.href = href;
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  // ============================================================
  // TIME FORMAT
  // ============================================================

  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

      {/* ======================================================
          MOBILE HEADER
      ======================================================= */}

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
          aria-label={mobileMenu ? "Close menu" : "Open menu"}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
        >
          {mobileMenu ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>

      </header>


      {/* ======================================================
          STUDENT SIDEBAR
          SAME WIDTH = 270px
      ======================================================= */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#071c16] text-white shadow-2xl transition-transform duration-300 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* ==================================================
            LOGO
        =================================================== */}

        <div className="flex h-[82px] shrink-0 items-center gap-3 border-b border-white/10 px-5">

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


        {/* ==================================================
            NAVIGATION
        =================================================== */}

        <div className="flex-1 overflow-y-auto px-3.5 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Main Menu
          </p>

          <nav className="space-y-1">

            <SidebarItem
              href="/dashboard/student"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
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

            <SidebarItem
              href="/activities"
              icon={<BookOpen size={18} />}
              label="Activities"
              active
              onNavigate={() => setMobileMenu(false)}
            />

            <SidebarItem
              href="/notifications"
              icon={<Bell size={18} />}
              label="Notifications"
              onNavigate={() => setMobileMenu(false)}
            />

          </nav>


          {/* ==================================================
              CAMPUS
          =================================================== */}

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


        {/* ==================================================
            STUDENT PROFILE
        =================================================== */}

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


      {/* ======================================================
          MOBILE OVERLAY
      ======================================================= */}

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}


      {/* ======================================================
          MAIN CONTENT
          SIDEBAR = 270px
      ======================================================= */}

      <main className="min-h-screen w-full lg:pl-[270px]">

        {/* ==================================================
            DESKTOP TOPBAR
        =================================================== */}

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
              onClick={() => navigate("/notifications")}
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


        {/* ==================================================
            PAGE CONTENT
        =================================================== */}

        <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">

          {/* ==================================================
              HERO
          =================================================== */}

          <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b] p-7 text-white shadow-xl shadow-emerald-900/10 sm:p-9">

            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="pointer-events-none absolute right-[35%] top-10 h-24 w-24 rounded-full border border-emerald-300/10" />

            <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">

              <div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">

                  <Sparkles size={13} />

                  Campus Life

                </div>


                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Campus Activities
                </h1>


                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Explore and track activities happening around your campus.
                  Stay involved and make the most of your student experience.
                </p>

              </div>


              {/* ==================================================
                  ACTIVITY COUNT
              =================================================== */}

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-sm">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">

                  <BookOpen size={23} />

                </div>

                <div>

                  <p className="text-xl font-bold text-white">
                    {activities.length}
                  </p>

                  <p className="text-[11px] text-slate-300">
                    Activities available
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              SECTION HEADER
          =================================================== */}

          <div className="mb-5 flex items-end justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                Explore
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Available Activities
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Discover activities and opportunities around campus.
              </p>

            </div>


            {/* ==================================================
                REFRESH
            =================================================== */}

            <button
              type="button"
              onClick={fetchActivities}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />

              Refresh

            </button>

          </div>


          {/* ==================================================
              LOADING
          =================================================== */}

          {loading ? (

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {[1, 2, 3].map((item) => (

                <div
                  key={item}
                  className="h-[390px] animate-pulse rounded-3xl border border-slate-200 bg-white"
                />

              ))}

            </div>

          ) : activities.length === 0 ? (

            /* ==================================================
               EMPTY STATE
            =================================================== */

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">

                <BookOpen size={28} />

              </div>

              <h3 className="text-lg font-bold text-slate-800">
                No activities available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no campus activities available right now.
                New activities will appear here when they are added.
              </p>

              <button
                type="button"
                onClick={() => navigate("/dashboard/student")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 hover:shadow-md"
              >
                <ChevronRight
                  size={16}
                  className="rotate-180"
                />

                Back to Dashboard

              </button>

            </div>

          ) : (

            /* ==================================================
               ACTIVITY GRID
            =================================================== */

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {activities.map((activity) => (

                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />

              ))}

            </div>

          )}


          {/* ==================================================
              FOOTER
          =================================================== */}

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
   ACTIVITY CARD
============================================================ */

function ActivityCard({
  activity,
  formatDate,
  formatTime,
}: {
  activity: Activity;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-emerald-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-emerald-300
        hover:bg-gradient-to-br
        hover:from-emerald-50
        hover:via-white
        hover:to-teal-50
        hover:shadow-xl
        hover:shadow-emerald-500/10
      "
    >

      {/* =====================================================
          TOP ACCENT
      ====================================================== */}

      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />


      <div className="p-5">

        {/* ==================================================
            TOP ROW
        =================================================== */}

        <div className="mb-6 flex items-start justify-between gap-4">

          {/* =================================================
              MAIN ICON

              IMPORTANT:
              CARD HOVER -> GREEN BOX + WHITE ICON
          ================================================= */}

          <div
            className="
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-emerald-50
              to-teal-50
              text-emerald-500
              ring-1
              ring-emerald-100
              transition-all
              duration-300
              group-hover:scale-105
              group-hover:bg-emerald-500
              group-hover:from-emerald-500
              group-hover:to-teal-500
              group-hover:text-white
              group-hover:ring-emerald-500
              group-hover:shadow-lg
              group-hover:shadow-emerald-500/20
            "
          >

            <BookOpen size={25} />

          </div>


          {/* =================================================
              DATE BADGE
          ================================================= */}

          <div
            className="
              rounded-2xl
              border
              border-emerald-100
              bg-emerald-50/70
              px-3
              py-2.5
              text-right
              transition-all
              duration-300
              group-hover:border-emerald-200
              group-hover:bg-white
              group-hover:shadow-sm
            "
          >

            <p className="text-xs font-bold text-emerald-700">
              {formatDate(activity.activityDate)}
            </p>

            <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">

              <Clock3 size={11} />

              {formatTime(activity.activityDate)}

            </div>

          </div>

        </div>


        {/* ==================================================
            TITLE
        =================================================== */}

        <h3 className="text-lg font-bold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-emerald-800">
          {activity.title}
        </h3>


        {/* ==================================================
            DESCRIPTION
        =================================================== */}

        <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500 transition-colors duration-300 group-hover:text-slate-600">
          {activity.description}
        </p>


        {/* ==================================================
            DETAILS BOX
        =================================================== */}

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-slate-200
            bg-slate-50/80
            p-4
            transition-all
            duration-300
            group-hover:border-emerald-100
            group-hover:bg-white/80
            group-hover:shadow-sm
          "
        >

          {/* =================================================
              VENUE
          ================================================= */}

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white
                text-emerald-500
                shadow-sm
                ring-1
                ring-slate-200
                transition-all
                duration-300
                group-hover:bg-emerald-500
                group-hover:text-white
                group-hover:ring-emerald-500
                group-hover:shadow-md
              "
            >

              <MapPin size={18} />

            </div>


            <div className="min-w-0">

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Venue
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {activity.venue}
              </p>

            </div>

          </div>


          <div className="my-4 h-px bg-slate-200 transition-colors duration-300 group-hover:bg-emerald-100" />


          {/* =================================================
              SCHEDULE
          =================================================== */}

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white
                text-emerald-500
                shadow-sm
                ring-1
                ring-slate-200
                transition-all
                duration-300
                group-hover:bg-emerald-500
                group-hover:text-white
                group-hover:ring-emerald-500
                group-hover:shadow-md
              "
            >

              <CalendarDays size={18} />

            </div>


            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Schedule
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatDate(activity.activityDate)}
                {" • "}
                {formatTime(activity.activityDate)}
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            BOTTOM LABEL
            VIEW ACTIVITY REMOVED
        =================================================== */}

        <div className="mt-5 flex items-center gap-2">

          <span
            className="
              h-2
              w-2
              rounded-full
              bg-emerald-400
              transition-all
              duration-300
              group-hover:scale-125
              group-hover:bg-emerald-500
            "
          />

          <span className="text-xs font-semibold text-emerald-600">
            Campus Activity
          </span>

        </div>

      </div>

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

  const handleNavigation = () => {

    if (onNavigate) {
      onNavigate();
    }

    window.location.href = href;
  };

  return (
    <button
      type="button"
      onClick={handleNavigation}
      className={`
        group
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        px-3.5
        py-3
        text-left
        text-sm
        font-medium
        transition
        ${
          active
            ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-950/30"
            : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
        }
      `}
    >

      <span
        className={`
          transition
          ${
            active
              ? "text-white"
              : "text-slate-500 group-hover:text-emerald-300"
          }
        `}
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

    </button>
  );
}