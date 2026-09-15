"use client";

import StudentLayout from "@/components/student/StudentLayout";
import { useEffect, useState } from "react";

import {
  CalendarDays,
  BookOpen,
  Clock3,
  MapPin,
  RefreshCw,
  Sparkles,
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchActivities();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const navigate = (href: string) => {
    window.location.href = href;
  };

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
    <StudentLayout>
      <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

        <main className="min-h-screen w-full">

          <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">

            {/* HERO */}

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

            {/* SECTION HEADER */}

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

            {/* LOADING */}

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

                  <span className="text-base">
                    ←
                  </span>

                  Back to Dashboard

                </button>

              </div>

            ) : (

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

            {/* FOOTER */}

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
    </StudentLayout>
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

      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

      <div className="p-5">

        <div className="mb-6 flex items-start justify-between gap-4">

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

        <h3 className="text-lg font-bold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-emerald-800">
          {activity.title}
        </h3>

        <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500 transition-colors duration-300 group-hover:text-slate-600">
          {activity.description}
        </p>

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