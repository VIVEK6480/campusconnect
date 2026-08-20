"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import {
  Bell,
  BookOpen,
  Building2,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type Club = {
  id: string;
  name: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  image?: string | null;
  club?: Club | null;
};

export default function StudentEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
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

  // =========================================================
  // FETCH EVENTS
  // =========================================================

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/events", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch events"
        );
      }

      setEvents(data.events || []);
    } catch (error) {
      console.error("FETCH EVENTS ERROR:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load events"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        setError("");

        const response = await fetch("/api/events", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch events"
          );
        }

        if (!cancelled) {
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("FETCH EVENTS ERROR:", error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load events"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredEvents = events.filter((event) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      event.title?.toLowerCase().includes(searchText) ||
      event.description?.toLowerCase().includes(searchText) ||
      event.venue?.toLowerCase().includes(searchText) ||
      event.club?.name?.toLowerCase().includes(searchText)
    );
  });

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDay = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
    });
  };

  const formatMonth = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f8f6] text-slate-900">

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
            mobileMenu ? "Close menu" : "Open menu"
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
          STUDENT SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#071c16] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* LOGO */}

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


        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Main Menu
          </p>

          <nav className="space-y-1">

            <SidebarItem
              href="/dashboard/student"
              icon={<LayoutDashboardIcon />}
              label="Dashboard"
            />

            <SidebarItem
              href="/clubs"
              icon={<Building2 size={18} />}
              label="Clubs"
            />

            <SidebarItem
              href="/events"
              icon={<CalendarDays size={18} />}
              label="Events"
              active
            />

            {/* ACTIVITIES - FIXED */}
            <SidebarItem
              href="/activities"
              icon={<BookOpen size={18} />}
              label="Activities"
            />

            <SidebarItem
              href="/notifications"
              icon={<Bell size={18} />}
              label="Notifications"
            />

          </nav>


          {/* CAMPUS */}

          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Campus
          </p>

          <nav className="space-y-1">

            <SidebarItem
              href="/clubs"
              icon={<Users size={18} />}
              label="My Clubs"
            />

            <SidebarItem
              href="/events"
              icon={<CalendarDays size={18} />}
              label="My Events"
            />

          </nav>

        </div>


        {/* STUDENT PROFILE */}

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
            <span className="text-lg">↪</span>
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

      <main className="min-h-screen lg:pl-[270px]">

        {/* =================================================
            TOPBAR
        ================================================== */}

        <header className="sticky top-0 z-30 hidden h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-8 backdrop-blur lg:flex">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Student Portal
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Your campus, your experience.
            </p>

          </div>


          <div className="flex items-center gap-5">

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
            >

              <Bell size={19} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />

            </Link>


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

        <section className="w-full px-5 py-7 sm:px-7 lg:px-9">

          {/* =================================================
              HERO
          ================================================== */}

          <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2d22] via-[#0f3d2f] to-[#15513f] p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-9">

            <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="pointer-events-none absolute right-[30%] top-8 h-28 w-28 rounded-full border border-emerald-200/10" />

            <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">

              <div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <Sparkles size={13} />
                  Discover campus life
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Upcoming Events
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Discover workshops, competitions,
                  activities and events happening around
                  your campus.
                </p>

              </div>


              <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 backdrop-blur-sm">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <CalendarCheck2 size={22} />
                </div>

                <div>

                  <p className="text-2xl font-bold text-white">
                    {events.length}
                  </p>

                  <p className="text-xs text-emerald-100/70">
                    Events available
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              SEARCH
          ================================================== */}

          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                Explore
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Find an event that interests you.
              </p>

            </div>


            <div className="relative w-full sm:max-w-md">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search events, clubs or venues..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
              />

            </div>

          </div>


          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >

                  <div className="h-48 animate-pulse bg-slate-100" />

                  <div className="space-y-4 p-5">

                    <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />

                    <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />

                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />

                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />

                  </div>

                </div>
              ))}

            </div>
          )}


          {/* =================================================
              ERROR
          ================================================== */}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500">
                <CalendarDays size={25} />
              </div>

              <h3 className="font-bold text-red-800">
                Unable to load events
              </h3>

              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchEvents}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

            </div>
          )}


          {/* =================================================
              EMPTY
          ================================================== */}

          {!loading &&
            !error &&
            filteredEvents.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <CalendarDays size={29} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {search
                    ? "No events found"
                    : "No upcoming events"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "Try searching with a different event name, venue or club."
                    : "New campus events will appear here when they are available."}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    Clear Search
                  </button>
                )}

              </div>
            )}


          {/* =================================================
              EVENTS
          ================================================== */}

          {!loading &&
            !error &&
            filteredEvents.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {filteredEvents.map((event) => (
                  <article
                    key={event.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-xl"
                  >

                    {/* COVER */}

                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#15513f]">

                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <>
                          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-emerald-300/10" />

                          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl" />

                          <div className="flex h-full items-center justify-center">

                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/10 bg-white/[0.06] text-emerald-200/70 backdrop-blur-sm">
                              <CalendarDays size={31} />
                            </div>

                          </div>
                        </>
                      )}


                      {/* DATE */}

                      <div className="absolute left-4 top-4 flex overflow-hidden rounded-xl bg-white shadow-lg">

                        <div className="flex w-12 flex-col items-center justify-center bg-emerald-500 px-1 py-2 text-white">

                          <span className="text-lg font-bold leading-none">
                            {formatDay(event.eventDate)}
                          </span>

                          <span className="mt-1 text-[9px] font-bold uppercase">
                            {formatMonth(event.eventDate)}
                          </span>

                        </div>

                      </div>

                    </div>


                    {/* CONTENT */}

                    <div className="p-5">

                      <div className="mb-3 flex items-center gap-2">

                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                          <Building2 size={14} />
                        </span>

                        <span className="truncate text-xs font-semibold text-emerald-600">
                          {event.club?.name || "Campus Event"}
                        </span>

                      </div>


                      <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-emerald-700">
                        {event.title}
                      </h3>


                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                        {event.description}
                      </p>


                      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">

                        <div className="flex items-center gap-3 text-sm text-slate-500">

                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-emerald-500">
                            <Clock3 size={15} />
                          </span>

                          <div>

                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Time
                            </p>

                            <p className="font-medium text-slate-700">
                              {formatTime(event.eventDate)}
                            </p>

                          </div>

                        </div>


                        <div className="flex items-center gap-3 text-sm text-slate-500">

                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-emerald-500">
                            <MapPin size={15} />
                          </span>

                          <div className="min-w-0">

                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Venue
                            </p>

                            <p className="truncate font-medium text-slate-700">
                              {event.venue}
                            </p>

                          </div>

                        </div>

                      </div>


                      {/* DATE ONLY */}

                      <div className="mt-5 border-t border-slate-100 pt-4">

                        <span className="text-xs font-medium text-slate-400">
                          {formatDate(event.eventDate)}
                        </span>

                      </div>

                    </div>

                  </article>
                ))}

              </div>
            )}

        </section>

      </main>

    </div>
  );
}


/* ============================================================
   DASHBOARD ICON
============================================================ */

function LayoutDashboardIcon() {
  return (
    <span className="grid grid-cols-2 gap-1">

      <span className="h-[6px] w-[6px] rounded-[2px] border border-current" />

      <span className="h-[6px] w-[6px] rounded-[2px] border border-current" />

      <span className="h-[6px] w-[6px] rounded-[2px] border border-current" />

      <span className="h-[6px] w-[6px] rounded-[2px] border border-current" />

    </span>
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
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
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