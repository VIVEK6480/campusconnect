"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Club = {
  id: string;
  name: string;
  logo?: string | null;
  category?: string | null;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  venue: string;
  clubId: string;
  eventDate: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
  attendanceCount?: number;
  club?: Club | null;
};

type EventForm = {
  title: string;
  description: string;
  venue: string;
  clubId: string;
  eventDate: string;
  image: string;
};

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  venue: "",
  clubId: "",
  eventDate: "",
  image: "",
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isUpcoming(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= Date.now();
}

function isToday(value: string) {
  const eventDate = new Date(value);
  const now = new Date();

  return (
    eventDate.getFullYear() === now.getFullYear() &&
    eventDate.getMonth() === now.getMonth() &&
    eventDate.getDate() === now.getDate()
  );
}

function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-[230px] w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);

  const fetchEvents = useCallback(async () => {
    const response = await fetch("/api/admin/events", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch events.");
    }

    const received = Array.isArray(data?.events) ? data.events : [];
    setEvents(received);
    return received;
  }, []);

  const fetchClubs = useCallback(async () => {
    const response = await fetch("/api/admin/clubs", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Failed to fetch clubs.");
    }

    const received = Array.isArray(data?.clubs) ? data.clubs : [];
    setClubs(received);
    return received;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        await Promise.all([fetchEvents(), fetchClubs()]);
      } catch (err) {
        console.error("LOAD ADMIN EVENTS ERROR:", err);

        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load event data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingClubs(false);
        }
      }
    }

    void load();

    const expiryCheck = window.setInterval(() => {
      if (!cancelled) {
        void fetchEvents().catch((err) => {
          console.error("AUTO CLEANUP EVENT REFRESH ERROR:", err);
        });
      }
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(expiryCheck);
    };
  }, [fetchEvents, fetchClubs]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        [
          event.title,
          event.description,
          event.venue,
          event.club?.name,
          event.club?.category,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesFilter =
        filter === "ALL" ||
        (filter === "UPCOMING" && isUpcoming(event.eventDate)) ||
        (filter === "PAST" && !isUpcoming(event.eventDate));

      return matchesSearch && matchesFilter;
    });
  }, [events, filter, search]);

  const totalEvents = events.length;
  const upcomingEvents = events.filter((event) => isUpcoming(event.eventDate)).length;
  const todayEvents = events.filter((event) => isToday(event.eventDate)).length;
  function openCreateModal() {
    setError("");
    setSuccess("");
    setIsEditing(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(event: EventItem) {
    setError("");
    setSuccess("");
    setIsEditing(true);
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      venue: event.venue || "",
      clubId: event.clubId || "",
      eventDate: toDateTimeLocal(event.eventDate),
      image: event.image || "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const description = form.description.trim();
    const venue = form.venue.trim();
    const clubId = form.clubId.trim();
    const eventDate = form.eventDate.trim();
    const image = form.image.trim();

    if (!title) return setError("Event title is required.");
    if (!description) return setError("Event description is required.");
    if (!venue) return setError("Event venue is required.");
    if (!clubId) return setError("Please select a club.");
    if (!eventDate) return setError("Event date and time are required.");

    try {
      setSaving(true);

      const url =
        isEditing && editingId
          ? `/api/admin/events?id=${encodeURIComponent(editingId)}`
          : "/api/admin/events";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          venue,
          clubId,
          eventDate,
          image: image || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isEditing ? "Failed to update event." : "Failed to create event.")
        );
      }

      setSuccess(
        isEditing
          ? "Event updated successfully."
          : "Event created successfully."
      );

      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      await fetchEvents();
    } catch (err) {
      console.error("SAVE ADMIN EVENT ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save event."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: EventItem) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?\n\nThis will also remove its event attendance records through the database relation.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/events?id=${encodeURIComponent(event.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete event.");
      }

      setEvents((current) => current.filter((item) => item.id !== event.id));
      setSuccess("Event deleted successfully.");
    } catch (err) {
      console.error("DELETE ADMIN EVENT ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete event."
      );
    }
  }

  function handleImageError(
    event: React.SyntheticEvent<HTMLImageElement>
  ) {
    event.currentTarget.style.display = "none";
    event.currentTarget.parentElement?.classList.add("event-image-fallback");
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f6f8fc]">
      <main className="w-full px-4 py-5 md:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/dashboard";
          }}
          className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-[#0b1428]"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <section className="relative flex min-h-[300px] w-full items-center overflow-hidden rounded-[22px] bg-gradient-to-r from-[#28346f] via-[#3d50a2] to-[#5872df] px-6 py-8 text-white shadow-lg md:px-9 lg:px-10">
          <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-12 -top-6 h-28 w-28 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-[17%] bottom-[-85px] h-56 w-56 rounded-full border border-white/10" />

          <div className="relative z-10 flex w-full items-center justify-between gap-8">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm md:text-xs">
                <CalendarDays size={15} />
                <span>CampusConnect Event Administration</span>
              </div>

              <h1 className="mt-5 font-serif text-3xl font-bold leading-tight md:text-5xl lg:text-[52px]">
                Create moments.
                <br />
                <span className="text-indigo-200">Build campus experiences.</span>
              </h1>

              <p className="mt-4 max-w-3xl font-serif text-sm leading-6 text-white/85 md:text-base">
                Create, manage and organize campus events, venues, schedules and
                club associations from one administration portal.
              </p>
            </div>

            <div className="hidden shrink-0 lg:block">
              <button
                type="button"
                onClick={openCreateModal}
                className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#28346f] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_12px_30px_rgba(79,70,229,0.28)]"
              >
                <Plus size={17} className="transition-transform group-hover:scale-110" />
                Create Event
              </button>
            </div>
          </div>

          <div className="absolute bottom-7 left-6 z-10 lg:hidden">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#28346f] shadow-sm"
            >
              <Plus size={17} />
              Create Event
            </button>
          </div>
        </section>

        <div className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(79,70,229,0.16)]">
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_6px_18px_rgba(79,70,229,0.35)]">
              <CalendarDays size={19} />
            </div>
            <p className="text-xs font-medium text-slate-500">Total Events</p>
            <p className="mt-2 font-serif text-3xl font-bold text-slate-900">
              {loading ? "—" : totalEvents}
            </p>
            <p className="mt-1 text-xs text-slate-400">Campus events</p>
          </div>

          <div className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(79,70,229,0.16)]">
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_6px_18px_rgba(79,70,229,0.35)]">
              <Clock3 size={19} />
            </div>
            <p className="text-xs font-medium text-slate-500">Upcoming</p>
            <p className="mt-2 font-serif text-3xl font-bold text-slate-900">
              {loading ? "—" : upcomingEvents}
            </p>
            <p className="mt-1 text-xs text-slate-400">Future events</p>
          </div>

          <div className="group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-indigo-200 hover:shadow-[0_12px_30px_rgba(79,70,229,0.16)]">
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_6px_18px_rgba(79,70,229,0.35)]">
              <CalendarDays size={19} />
            </div>
            <p className="text-xs font-medium text-slate-500">Today</p>
            <p className="mt-2 font-serif text-3xl font-bold text-slate-900">
              {loading ? "—" : todayEvents}
            </p>
            <p className="mt-1 text-xs text-slate-400">Events happening today</p>
          </div>

        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events by title, venue or club..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                filter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Events
            </button>
            <button
              type="button"
              onClick={() => setFilter("UPCOMING")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                filter === "UPCOMING"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setFilter("PAST")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                filter === "PAST"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1.5 transition hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>{success}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="rounded-lg p-1.5 transition hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <EventSkeleton key={index} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <CalendarDays size={24} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {search || filter !== "ALL" ? "No events found" : "No events available"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {search || filter !== "ALL"
                ? "Try another search term or filter."
                : "Create your first event to get started."}
            </p>
            {!search && filter === "ALL" && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0b1428] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111d38]"
              >
                <Plus size={16} />
                Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="group flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.012] hover:border-indigo-200 hover:shadow-[0_14px_35px_rgba(79,70,229,0.18)]"
              >
                <div className="relative h-[230px] w-full overflow-hidden bg-[#0b1428]">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#0b1428] via-[#28346f] to-[#5872df]">
                      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                      <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
                      <div className="absolute right-10 top-8 h-20 w-20 rounded-2xl border border-white/10 bg-white/5 rotate-12" />
                      <div className="absolute bottom-8 left-10 h-16 w-16 rounded-full border border-white/10 bg-white/5" />
                      <div className="relative flex h-full items-center justify-center">
                        <div className="text-center text-white/85">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm">
                            <CalendarDays size={30} />
                          </div>
                          <p className="mt-3 text-sm font-semibold tracking-wide">Event</p>
                          <p className="mt-1 text-[11px] text-white/60">No event image</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute left-3 top-3 rounded-full bg-[#0b1428]/90 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                    {event.club?.name || "Campus Event"}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white drop-shadow-md">
                      {event.title}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                    {event.description}
                  </p>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <CalendarDays size={15} className="text-indigo-500" />
                      {formatDate(event.eventDate)}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <Clock3 size={15} className="text-indigo-500" />
                      {formatTime(event.eventDate)}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <MapPin size={15} className="text-indigo-500" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Attendance
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Users size={14} />
                      {event.attendanceCount || 0}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(event)}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(event)}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>

                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    Created {formatDate(event.createdAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditing ? "Edit Event" : "Create Event"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isEditing
                    ? "Update event information."
                    : "Add a new campus event."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Event Title *
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
                    placeholder="e.g. Annual Coding Workshop"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Club *
                    </label>
                    <select
                      value={form.clubId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          clubId: event.target.value,
                        }))
                      }
                      disabled={saving || loadingClubs}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    >
                      <option value="">
                        {loadingClubs ? "Loading clubs..." : "Choose club"}
                      </option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Venue *
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
                      placeholder="e.g. Main Auditorium"
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={form.eventDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          eventDate: event.target.value,
                        }))
                      }
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <ImageIcon size={15} />
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          image: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                      disabled={saving}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={6}
                    placeholder="Describe the event..."
                    disabled={saving}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Image Preview
                  </p>
                  <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-[#0b1428]">
                    {form.image ? (
                      <img
                        src={form.image}
                        alt="Event preview"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0b1428]">
                        <div className="text-center text-white/80">
                          <ImageIcon size={35} className="mx-auto" />
                          <p className="mt-2 text-sm">Event Image</p>
                        </div>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#0b1428] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#111d38] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      {isEditing ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {isEditing ? <Check size={17} /> : <Plus size={15} />}
                      {isEditing ? "Save Changes" : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .event-image-fallback {
          background: #0b1428 !important;
        }

        .event-image-fallback::after {
          content: "";
          position: absolute;
          inset: 0;
          background: #0b1428;
        }

        html,
        body {
          width: 100%;
          min-width: 0;
          margin: 0;
        }

        #__next {
          width: 100%;
          min-width: 0;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
