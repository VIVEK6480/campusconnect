"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
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

type ActivityForm = {
  title: string;
  description: string;
  venue: string;
  activityDate: string;
};

const EMPTY_FORM: ActivityForm = {
  title: "",
  description: "",
  venue: "",
  activityDate: "",
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

export default function Page() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">(
    "all"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ActivityForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/activities", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch activities.");
      }

      setActivities(
        data?.success && Array.isArray(data.activities)
          ? data.activities
          : []
      );
    } catch (err) {
      console.error("LOAD ADMIN ACTIVITIES ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load activities."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchActivities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchActivities]);

  const now = useMemo(() => new Date(), [activities]);

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return activities
      .filter((activity) => {
        const activityDate = new Date(activity.activityDate);
        const matchesFilter =
          filter === "all" ||
          (filter === "upcoming" && activityDate >= now) ||
          (filter === "past" && activityDate < now);

        if (!matchesFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          activity.title,
          activity.description,
          activity.venue,
        ].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.activityDate).getTime() -
          new Date(b.activityDate).getTime()
      );
  }, [activities, filter, now, search]);

  const totalActivities = activities.length;
  const upcomingActivities = activities.filter(
    (activity) => new Date(activity.activityDate) >= now
  ).length;
  const todayActivities = activities.filter((activity) => {
    const date = new Date(activity.activityDate);
    const current = new Date();

    return (
      date.getFullYear() === current.getFullYear() &&
      date.getMonth() === current.getMonth() &&
      date.getDate() === current.getDate()
    );
  }).length;

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
    setModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      description: activity.description,
      venue: activity.venue,
      activityDate: toDateTimeLocal(activity.activityDate),
    });
    setError("");
    setMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Activity title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Activity description is required.");
      return;
    }

    if (!form.venue.trim()) {
      setError("Activity venue is required.");
      return;
    }

    if (!form.activityDate) {
      setError("Activity date and time are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `/api/admin/activities?id=${encodeURIComponent(editingId)}`
        : "/api/admin/activities";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          venue: form.venue.trim(),
          activityDate: new Date(form.activityDate).toISOString(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (editingId
              ? "Failed to update activity."
              : "Failed to create activity.")
        );
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setMessage(
        data?.message ||
          (editingId
            ? "Activity updated successfully."
            : "Activity created successfully.")
      );

      await fetchActivities();
    } catch (err) {
      console.error("SAVE ADMIN ACTIVITY ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save activity."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity: Activity) => {
    const confirmed = window.confirm(
      `Delete activity "${activity.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(activity.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/activities?id=${encodeURIComponent(activity.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to delete activity."
        );
      }

      setMessage(
        data?.message || "Activity deleted successfully."
      );

      await fetchActivities();
    } catch (err) {
      console.error("DELETE ADMIN ACTIVITY ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete activity."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <style jsx>{`
        /* Whole activity card: normal first, glow only while the cursor is anywhere over it. */
        .cc-activity-card {
          position: relative;
          overflow: hidden;
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            border-color 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease;
          will-change: transform, box-shadow, background;
        }

        /* Soft transparent Admin-blue wash appears only while the card is hovered. */
        .cc-activity-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          background:
            linear-gradient(135deg,
              rgba(79,70,229,.045) 0%,
              rgba(45,79,174,.075) 52%,
              rgba(70,105,226,.055) 100%
            );
          box-shadow: inset 0 0 0 1px rgba(79,70,229,.08);
          transition: opacity 220ms ease;
        }

        .cc-activity-card > * {
          position: relative;
          z-index: 1;
        }

        .cc-activity-card:hover,
        .cc-activity-card:focus-within {
          transform: translate3d(0, -4px, 0) scale(1.006);
          border-color: rgba(79,70,229,.38) !important;
          background: #fbfcff;
          box-shadow:
            0 16px 34px rgba(15,23,42,.10),
            0 0 0 1px rgba(79,70,229,.10),
            0 0 26px rgba(79,70,229,.20),
            0 0 54px rgba(59,130,246,.11);
          z-index: 10;
        }

        .cc-activity-card:hover::before,
        .cc-activity-card:focus-within::before {
          opacity: 1;
        }

        /* Stats cards use the same lift + soft transparent Admin UI effect as activity cards. */
        .cc-stat-card {
          position: relative;
          overflow: hidden;
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            border-color 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease;
          will-change: transform, box-shadow, background;
        }

        .cc-stat-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          background: linear-gradient(135deg,
            rgba(79,70,229,.035) 0%,
            rgba(45,79,174,.065) 52%,
            rgba(70,105,226,.045) 100%
          );
          box-shadow: inset 0 0 0 1px rgba(79,70,229,.07);
          transition: opacity 220ms ease;
        }

        .cc-stat-card > * {
          position: relative;
          z-index: 1;
        }

        .cc-stat-card:hover,
        .cc-stat-card:focus-within {
          transform: translate3d(0, -4px, 0) scale(1.006);
          border-color: rgba(79,70,229,.36) !important;
          background: #fbfcff;
          box-shadow:
            0 14px 30px rgba(15,23,42,.09),
            0 0 0 1px rgba(79,70,229,.09),
            0 0 24px rgba(79,70,229,.18),
            0 0 48px rgba(59,130,246,.10);
          z-index: 10;
        }

        .cc-stat-card:hover::before,
        .cc-stat-card:focus-within::before {
          opacity: 1;
        }

        /* Statistics icon: normal first, then reacts to the whole stat-card hover. */
        .cc-stat-icon {
          position: relative;
          overflow: hidden;
          transform: translate3d(0, 0, 0) scale(1);
          transform-origin: center;
          background: #eef2ff;
          color: #4f46e5;
          border-color: rgba(99,102,241,.22);
          transition:
            transform 180ms cubic-bezier(.2,.8,.2,1),
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease,
            color 180ms ease;
          will-change: transform, box-shadow;
          z-index: 2;
        }

        .cc-stat-card:hover .cc-stat-icon,
        .cc-stat-card:focus-within .cc-stat-icon {
          transform: translate3d(0, -5px, 0) scale(1.11) !important;
          border-color: rgba(99,102,241,.88) !important;
          background: linear-gradient(112deg, #202b63 0%, #2d4fae 52%, #4669e2 100%) !important;
          color: #ffffff !important;
          box-shadow:
            0 12px 24px rgba(15,23,42,.14),
            0 0 0 1px rgba(79,70,229,.22),
            0 0 24px rgba(79,70,229,.44),
            0 0 58px rgba(59,130,246,.30) !important;
        }

        .cc-stat-icon::before {
          content: "";
          position: absolute;
          inset: -45%;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(
            circle at 50% 20%,
            rgba(255,255,255,.24) 0%,
            rgba(70,105,226,.20) 30%,
            transparent 68%
          );
          transition: opacity 180ms ease;
        }

        .cc-stat-icon::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.22);
          transition: opacity 180ms ease;
        }

        .cc-stat-card:hover .cc-stat-icon::before,
        .cc-stat-card:hover .cc-stat-icon::after,
        .cc-stat-card:focus-within .cc-stat-icon::before,
        .cc-stat-card:focus-within .cc-stat-icon::after {
          opacity: 1;
        }

        .cc-stat-icon > * {
          position: relative;
          z-index: 1;
          transition: color 180ms ease, transform 180ms ease;
        }

        .cc-stat-card:hover .cc-stat-icon > *,
        .cc-stat-card:focus-within .cc-stat-icon > * {
          color: #ffffff !important;
          transform: scale(1.06);
        }

        /* Mini boxes: stay pale in the normal state. */
        .cc-mini-box {
          position: relative;
          overflow: hidden;
          transform: translate3d(0, 0, 0) scale(1);
          transform-origin: center;
          background: #eef2ff;
          color: #4f46e5;
          border-color: rgba(99,102,241,.22);
          transition:
            transform 180ms cubic-bezier(.2,.8,.2,1),
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease,
            color 180ms ease;
          will-change: transform, box-shadow;
          z-index: 1;
        }

        /* When the activity card lifts, the three interactive mini boxes glow together.
           The date/time pill is excluded intentionally. */
        .cc-activity-card:hover .cc-mini-box:not(.cc-time-box),
        .cc-activity-card:focus-within .cc-mini-box:not(.cc-time-box) {
          transform: translate3d(0, -3px, 0) scale(1.045);
          border-color: rgba(99,102,241,.72) !important;
          background: linear-gradient(112deg, #202b63 0%, #2d4fae 52%, #4669e2 100%) !important;
          color: #ffffff !important;
          box-shadow:
            0 8px 18px rgba(15,23,42,.12),
            0 0 0 1px rgba(79,70,229,.14),
            0 0 18px rgba(79,70,229,.28),
            0 0 34px rgba(59,130,246,.16);
          z-index: 20;
        }

        .cc-activity-card:hover .cc-mini-box:not(.cc-time-box)::before,
        .cc-activity-card:hover .cc-mini-box:not(.cc-time-box)::after,
        .cc-activity-card:focus-within .cc-mini-box:not(.cc-time-box)::before,
        .cc-activity-card:focus-within .cc-mini-box:not(.cc-time-box)::after {
          opacity: 1;
        }

        /* The top-right date/time pill intentionally stays NORMAL even when the whole card is hovered. */
        .cc-time-box {
          position: relative;
          z-index: 2;
          transform: translate3d(0, 0, 0) scale(1) !important;
          background: #eef2ff !important;
          color: #4f46e5;
          border-color: rgba(99,102,241,.22) !important;
          box-shadow: 0 1px 4px rgba(15,23,42,.06) !important;
          transition: none !important;
        }

        .cc-mini-box::before {
          content: "";
          position: absolute;
          inset: -45%;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          background:
            radial-gradient(
              circle at 50% 20%,
              rgba(255,255,255,.24) 0%,
              rgba(70,105,226,.20) 30%,
              transparent 68%
            );
          transition: opacity 180ms ease;
        }

        .cc-mini-box::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.22);
          transition: opacity 180ms ease;
        }

        /* Individual mini-box hover: enlarge + fill with the Event/Admin hero gradient + glow. */
        .cc-mini-box:hover,
        .cc-mini-box:focus-visible {
          transform: translate3d(0, -5px, 0) scale(1.11);
          border-color: rgba(99,102,241,.88) !important;
          background: linear-gradient(112deg, #202b63 0%, #2d4fae 52%, #4669e2 100%) !important;
          color: #ffffff !important;
          box-shadow:
            0 12px 24px rgba(15,23,42,.14),
            0 0 0 1px rgba(79,70,229,.22),
            0 0 24px rgba(79,70,229,.44),
            0 0 58px rgba(59,130,246,.30);
          z-index: 30;
        }

        .cc-mini-box:hover::before,
        .cc-mini-box:hover::after,
        .cc-mini-box:focus-visible::before,
        .cc-mini-box:focus-visible::after {
          opacity: 1;
        }

        .cc-mini-box > * {
          position: relative;
          z-index: 1;
          transition: color 180ms ease, transform 180ms ease;
        }

        .cc-mini-box:hover > *,
        .cc-mini-box:focus-visible > * {
          color: #ffffff !important;
          transform: scale(1.06);
        }
      `}</style>

      <div className="min-h-screen w-full bg-[#f4f7fb] px-2 py-4 sm:px-3 md:px-4 lg:px-5 lg:py-6">
      <div className="relative w-full">
        <div className="pointer-events-none absolute -right-28 top-8 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-28 top-[42%] h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl" />
        {/* HEADER */}
        <section className="relative h-[300px] overflow-hidden rounded-3xl bg-[linear-gradient(112deg,#202b63_0%,#2d4fae_52%,#4669e2_100%)] px-6 py-7 text-white shadow-xl shadow-blue-900/15 sm:px-8 sm:py-8 lg:px-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-2xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-300/15 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-8 lg:flex-row lg:items-center lg:gap-10">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 shadow-lg shadow-black/20">
                <BookOpen size={14} />
                Campus Activities
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Manage Activities
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/90 sm:text-base">
                Create and manage campus activities that appear directly in the
                existing Student Activities panel.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="shrink-0 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white/95 px-7 text-sm font-bold text-[#28346f] shadow-xl shadow-blue-950/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white hover:shadow-[0_14px_32px_rgba(32,43,99,.24)]"
            >
              <Plus size={18} />
              Create Activity
            </button>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={<BookOpen size={20} />}
            label="Total Activities"
            value={String(totalActivities)}
            description="All activities"
          />
          <StatCard
            icon={<CalendarDays size={20} />}
            label="Upcoming"
            value={String(upcomingActivities)}
            description="Future activities"
          />
          <StatCard
            icon={<Clock3 size={20} />}
            label="Today"
            value={String(todayActivities)}
            description="Scheduled today"
          />
        </section>

        {/* TOOLBAR */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-2xl">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search activity, venue or description..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All Activities"],
                  ["upcoming", "Upcoming"],
                  ["past", "Past"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    filter === value
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* MESSAGES */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            {message}
          </div>
        )}

        {/* ACTIVITY LIST */}
        <section className="relative z-10 mt-5">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="min-h-[350px] animate-pulse rounded-[24px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-1.5 rounded-t-[24px] bg-slate-200" />
                  <div className="space-y-5 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                      <div className="h-12 w-28 rounded-xl bg-slate-200" />
                    </div>
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-slate-200" />
                      <div className="h-4 w-4/5 rounded bg-slate-200" />
                    </div>
                    <div className="h-28 rounded-2xl bg-slate-100" />
                    <div className="h-10 rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
              <div className="cc-mini-box mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                <BookOpen size={28} />
              </div>

              <h2 className="text-xl font-black text-slate-800">
                No activities found
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Create your first activity from the button above. Once saved,
                it will use the same Activity table and appear on the existing
                Student Activities page.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Create Activity
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredActivities.map((activity) => {
                const activityDate = new Date(activity.activityDate);
                const isPast = activityDate < new Date();

                return (
                  <article
                    key={activity.id}
                    className={`cc-activity-card group relative flex min-h-[365px] flex-col overflow-hidden rounded-[24px] border bg-white shadow-sm ${
                      isPast
                        ? "border-slate-200"
                        : "border-blue-100"
                    }`}
                  >
                    {/* TOP ACCENT */}
                    <div className="h-1.5 shrink-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      {/* CARD TOP */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="cc-mini-box flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                          <BookOpen size={22} />
                        </div>

                        <div className="cc-time-box rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-right text-indigo-700 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            {formatDate(activity.activityDate)}
                          </p>
                          <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-slate-500">
                            <Clock3 size={12} />
                            <span>{formatTime(activity.activityDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#4669e2] shadow-[0_0_10px_rgba(70,105,226,.45)]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                            Campus Activity
                          </span>
                        </div>

                        <h2 className="line-clamp-2 text-xl font-black leading-7 text-slate-900">
                          {activity.title}
                        </h2>

                        <p className="mt-2 line-clamp-3 min-h-[66px] text-sm leading-6 text-slate-500">
                          {activity.description}
                        </p>
                      </div>

                      {/* INFO PANEL — student-style */}
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                        <div className="flex items-center gap-3 py-2">
                          <div className="cc-mini-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                            <MapPin size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Venue
                            </p>
                            <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
                              {activity.venue}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-slate-100" />

                        <div className="flex items-center gap-3 py-2">
                          <div className="cc-mini-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                            <CalendarDays size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Schedule
                            </p>
                            <p className="mt-0.5 text-sm font-bold text-slate-800">
                              {formatDate(activity.activityDate)} • {formatTime(activity.activityDate)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CARD FOOTER */}
                      <div className="mt-auto flex items-center gap-2 pt-5">
                        <button
                          type="button"
                          onClick={() => openEditModal(activity)}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit3 size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(activity)}
                          disabled={deletingId === activity.id}
                          className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={`Delete ${activity.title}`}
                        >
                          {deletingId === activity.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  {editingId ? "Edit Activity" : "New Activity"}
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {editingId ? "Update Activity" : "Create Activity"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close activity modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Activity Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Coding Workshop"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe the activity..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Venue
                  </label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        venue: event.target.value,
                      }))
                    }
                    placeholder="e.g. Seminar Hall"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Activity Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.activityDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        activityDate: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ChevronRight size={16} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Activity"
                      : "Create Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-2xl border bg-white p-5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        transform: hovered
          ? "translate3d(0, -5px, 0) scale(1.006)"
          : "translate3d(0, 0, 0) scale(1)",
        transformOrigin: "center",
        borderColor: hovered
          ? "rgba(79,70,229,.40)"
          : "rgb(226 232 240)",
        background: hovered ? "#fbfcff" : "#ffffff",
        boxShadow: hovered
          ? "0 16px 34px rgba(15,23,42,.10), 0 0 0 1px rgba(79,70,229,.10), 0 0 26px rgba(79,70,229,.20), 0 0 54px rgba(59,130,246,.11)"
          : "0 1px 2px rgba(15,23,42,.05)",
        transition:
          "transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, background 220ms ease, box-shadow 220ms ease",
        willChange: "transform, box-shadow",
        zIndex: hovered ? 10 : 0,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          background:
            "linear-gradient(135deg, rgba(79,70,229,.045) 0%, rgba(45,79,174,.075) 52%, rgba(70,105,226,.055) 100%)",
          boxShadow: "inset 0 0 0 1px rgba(79,70,229,.08)",
          transition: "opacity 220ms ease",
        }}
      />

      <div className="relative z-[1] flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl border"
          style={{
            position: "relative",
            overflow: "hidden",
            transform: hovered
              ? "translate3d(0, -5px, 0) scale(1.11)"
              : "translate3d(0, 0, 0) scale(1)",
            transformOrigin: "center",
            background: hovered
              ? "linear-gradient(112deg, #202b63 0%, #2d4fae 52%, #4669e2 100%)"
              : "#eef2ff",
            color: hovered ? "#ffffff" : "#4f46e5",
            borderColor: hovered
              ? "rgba(99,102,241,.88)"
              : "rgba(99,102,241,.22)",
            boxShadow: hovered
              ? "0 12px 24px rgba(15,23,42,.14), 0 0 0 1px rgba(79,70,229,.22), 0 0 24px rgba(79,70,229,.44), 0 0 58px rgba(59,130,246,.30)"
              : "0 1px 4px rgba(15,23,42,.06)",
            transition:
              "transform 180ms cubic-bezier(.2,.8,.2,1), border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, color 180ms ease",
            zIndex: 2,
            willChange: "transform, box-shadow",
          }}
        >
          <span
            className="relative z-[1]"
            style={{
              display: "inline-flex",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 180ms ease, color 180ms ease",
            }}
          >
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}
