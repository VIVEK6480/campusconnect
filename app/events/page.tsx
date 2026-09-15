"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import StudentLayout from "@/components/student/StudentLayout";

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
    <StudentLayout>
      <div className="min-h-screen bg-[#f4f8f6] text-slate-900">
        <main className="w-full min-w-0">
          <section className="w-full px-5 py-7 sm:px-7 lg:px-9">
            {/* =================================================
                HERO (EXACT CLUBS PAGE PROPORTIONS & SIZING)
            ================================================== */}

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
                    Discover your.
                    <span className="block text-emerald-300">
                      campus events.
                    </span>
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Discover workshops, competitions, activities and events happening around your campus.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <CalendarCheck2 size={22} />
                  </div>

                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "..." : events.length}
                    </p>

                    <p className="text-xs text-slate-400">
                      Events available
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
                  onChange={(event) => setSearch(event.target.value)}
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

            {!loading && !error && filteredEvents.length === 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <CalendarDays size={29} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {search ? "No events found" : "No upcoming events"}
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

            {!loading && !error && filteredEvents.length > 0 && (
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
    </StudentLayout>
  );
}