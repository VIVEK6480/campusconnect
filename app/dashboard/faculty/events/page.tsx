"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  facultyId?: string;
  campusUserId?: string | null;
  role?: string;
  approvalStatus?: string;
};

type Club = {
  id: string;
  name: string;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  image?: string | null;
  clubId?: string | null;
  club?: Club | null;
};

type EventForm = {
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  image: string;
  clubId: string;
};

const defaultFaculty: FacultyUser = {
  id: "",
  name: "Vivek Kumar",
  email: "faculty@campusconnect.com",
  facultyId: "RNT-9457",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
};

const emptyForm: EventForm = {
  title: "",
  description: "",
  venue: "",
  eventDate: "",
  image: "",
  clubId: "",
};

type EventStatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
};

function EventStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: EventStatCardProps) {
  return (
    <div className="group/stat relative min-w-0 overflow-hidden rounded-[19px] border border-[#d8e3ed] bg-white p-4 shadow-[0_7px_22px_rgba(30,60,90,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#b9d8e9] hover:shadow-[0_16px_32px_rgba(30,70,100,0.11)]">
      <span className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-all duration-700 group-hover/stat:left-[120%] group-hover/stat:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#687c93]">{title}</p>
          <p className="mt-2 font-serif text-[27px] font-bold leading-none text-[#0b1728]">
            {value}
          </p>
        </div>

        <div
          className={`group/stat-icon relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ${iconClass} transition-all duration-300 group-hover/stat:h-12 group-hover/stat:w-12 group-hover/stat:rounded-2xl group-hover/stat:bg-[#54bce5] group-hover/stat:text-white group-hover/stat:shadow-[0_10px_28px_rgba(84,188,229,0.32)]`}
        >
          <span className="pointer-events-none absolute inset-y-0 left-[-120%] w-[55%] -skew-x-[18deg] bg-gradient-to-r from-transparent via-white/65 to-transparent opacity-0 transition-all duration-700 group-hover/stat-icon:left-[150%] group-hover/stat-icon:opacity-100" />
          <span className="pointer-events-none absolute inset-0 rounded-xl border border-white/30 opacity-0 transition-opacity duration-300 group-hover/stat-icon:opacity-100 group-hover/stat-icon:rounded-2xl" />

          <Icon
            size={18}
            className="relative z-10 transition-all duration-300 group-hover/stat:scale-110 group-hover/stat-icon:scale-110 group-hover/stat-icon:rotate-3"
          />
        </div>
      </div>

      <p className="relative z-10 mt-4 text-[10px] leading-5 text-[#7890a8]">
        {description}
      </p>

      <div className="pointer-events-none absolute bottom-0 left-4 right-4 h-[3px] origin-left scale-x-0 rounded-full bg-[#54bce5] transition-transform duration-300 group-hover/stat:scale-x-100" />
    </div>
  );
}

export default function FacultyEventsPage() {
  const [user, setUser] = useState<FacultyUser>(defaultFaculty);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<"all" | "upcoming" | "past">("all");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  const [cursorEffect, setCursorEffect] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  /* =========================================================
     LOAD FACULTY
  ========================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const possibleKeys = [
          "facultyUser",
          "faculty",
          "currentFaculty",
          "user",
        ];

        for (const key of possibleKeys) {
          const stored = localStorage.getItem(key);

          if (!stored) continue;

          try {
            const candidate = JSON.parse(stored);

            if (
              candidate &&
              typeof candidate === "object" &&
              candidate.email
            ) {
              setUser({
                id: candidate.id || defaultFaculty.id,
                name: candidate.name || defaultFaculty.name,
                email: candidate.email || defaultFaculty.email,
                facultyId:
                  candidate.facultyId ||
                  candidate.campusUserId ||
                  defaultFaculty.facultyId,
                campusUserId: candidate.campusUserId || null,
                role: candidate.role || defaultFaculty.role,
                approvalStatus:
                  candidate.approvalStatus ||
                  defaultFaculty.approvalStatus,
              });

              break;
            }
          } catch {
            // Continue checking next key
          }
        }
      } catch {
        // Keep default
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  /* =========================================================
     FETCH EVENTS
  ========================================================= */

  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/events", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch events.");
      }

      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (fetchError) {
      console.error("FETCH EVENTS ERROR:", fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load events."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FETCH CLUBS
  ========================================================= */

  async function fetchClubs() {
    try {
      const response = await fetch("/api/clubs", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      const receivedClubs = data.clubs || data.data || [];

      if (Array.isArray(receivedClubs)) {
        setClubs(receivedClubs);
      }
    } catch (fetchError) {
      console.warn("FETCH CLUBS ERROR:", fetchError);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEvents();
      void fetchClubs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateCurrentDate = () => setCurrentDate(new Date());

    updateCurrentDate();
    const interval = window.setInterval(updateCurrentDate, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  function handleChange(field: keyof EventForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  function openCreateForm() {
    setIsEditing(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function toDateTimeLocal(value: string | null | undefined) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (number: number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function openEditForm(event: EventItem) {
    setIsEditing(true);
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      venue: event.venue || "",
      eventDate: toDateTimeLocal(event.eventDate),
      image: event.image || "",
      clubId: event.clubId || event.club?.id || "",
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    if (creating) return;

    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function handleCreateEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (creating) return;

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Please enter event title.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter event description.");
      return;
    }

    if (!form.venue.trim()) {
      setError("Please enter event venue.");
      return;
    }

    if (!form.eventDate) {
      setError("Please select event date and time.");
      return;
    }

    if (!form.clubId) {
      setError("Please select a club.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(
        isEditing && editingId
          ? `/api/events?id=${encodeURIComponent(editingId)}`
          : "/api/events",
        {
          method: isEditing && editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            venue: form.venue.trim(),
            eventDate: form.eventDate,
            image: form.image.trim() || null,
            clubId: form.clubId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create event.");
      }

      setSuccess(
        isEditing
          ? "Event updated successfully for Students and Faculty."
          : "Event created successfully. Students can now see this event."
      );

      setForm(emptyForm);
      setShowForm(false);
      setIsEditing(false);
      setEditingId(null);

      await fetchEvents();
    } catch (createError) {
      console.error("CREATE EVENT ERROR:", createError);

      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create event."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteEvent(eventId: string, title: string) {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis will permanently remove the event from the database.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(eventId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/events?id=${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete event.");
      }

      setEvents((previous) =>
        previous.filter((event) => event.id !== eventId)
      );

      setSuccess(
        "Event deleted successfully from CampusConnect database."
      );
    } catch (deleteError) {
      console.error("DELETE EVENT ERROR:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete event."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredEvents = events.filter((event) => {
    const term = searchTerm.trim().toLowerCase();
    const eventDate = new Date(event.eventDate);
    const isUpcoming = currentDate
      ? eventDate.getTime() >= currentDate.getTime()
      : true;

    const matchesSearch =
      !term ||
      event.title.toLowerCase().includes(term) ||
      event.description.toLowerCase().includes(term) ||
      event.venue.toLowerCase().includes(term) ||
      (event.club?.name ?? "").toLowerCase().includes(term);

    const matchesFilter =
      eventFilter === "all" ||
      (eventFilter === "upcoming" && isUpcoming) ||
      (eventFilter === "past" && !isUpcoming);

    return matchesSearch && matchesFilter;
  });

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }

  function formatTime(date: string) {
    try {
      return new Date(date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const facultyId = user.facultyId || "RNT-9457";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">
      <div className="min-h-screen w-full min-w-0">
        <main className="relative min-h-screen w-full overflow-hidden bg-[#edf4fa] px-4 py-6 sm:px-6">
          {/* BACKGROUND EFFECT */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.08) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
            <div className="absolute left-[12%] top-[4%] h-[420px] w-[420px] rounded-full bg-[#dceef8] opacity-60 blur-3xl" />
            <div className="absolute right-[4%] top-[32%] h-[360px] w-[360px] rounded-full bg-[#e4f2f9] opacity-70 blur-3xl" />
          </div>

          <div className="relative w-full">
            {/* HERO */}
            <section className="group/hero relative h-[280px] overflow-hidden rounded-[24px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-7 shadow-[0_18px_45px_rgba(20,40,80,0.18)] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(20,40,80,0.25)] sm:px-9 lg:px-11">
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10 transition-transform duration-700 group-hover/hero:scale-110" />
              <div className="pointer-events-none absolute right-12 top-10 h-40 w-40 rounded-full border border-white/10 transition-transform duration-700 group-hover/hero:scale-110" />
              <div className="pointer-events-none absolute right-[15%] bottom-[-110px] h-64 w-64 rounded-full border border-[#78d4f1]/10" />

              <div className="relative z-10 flex h-full items-center justify-between gap-8">
                <div className="max-w-[900px]">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-[10px] font-semibold text-white/95 backdrop-blur-sm">
                    <CalendarDays size={13} />
                    CampusConnect Faculty Events
                  </div>

                  <h1 className="font-serif text-[32px] font-bold leading-[1.03] tracking-[-0.035em] text-white sm:text-[43px] lg:text-[50px]">
                    Manage campus
                    <br />
                    <span className="text-[#69c9ed]">events with ease.</span>
                  </h1>

                  <p className="mt-4 max-w-[780px] text-[12px] leading-5 text-[#d9e3f4] sm:text-[13px]">
                    Create, update and manage campus events from one focused workspace. Every change stays synced with the shared Events data used across CampusConnect.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#72dcb4]/30 bg-[#72dcb4]/10 px-3 py-1.5 text-[10px] font-semibold text-[#9ae8c9]">
                      <CheckCircle2 size={13} />
                      Faculty Access
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium text-[#d6e0ed]">
                      <UserCircle size={13} />
                      Faculty ID:
                      <span className="font-bold text-white">{facultyId}</span>
                    </div>
                  </div>
                </div>

                {/* CREATE EVENT */}
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="group/create relative hidden shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3 text-[12px] font-bold text-[#243a75] shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#f7fbff] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] lg:inline-flex"
                >
                  <span className="absolute inset-0 -translate-x-full bg-[#54bce5]/10 transition-transform duration-500 group-hover/create:translate-x-full" />
                  <Plus size={16} className="relative" />
                  <span className="relative">Create Event</span>
                </button>

                {/* MOBILE CREATE EVENT */}
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="absolute bottom-6 right-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[11px] font-bold text-[#243a75] shadow-[0_8px_22px_rgba(0,0,0,0.15)] transition-all duration-300 hover:bg-[#f7fbff] lg:hidden"
                >
                  <Plus size={15} />
                  Create Event
                </button>
              </div>
            </section>

            {/* STATS */}
            <section className="mt-5 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              <EventStatCard
                title="Total Events"
                value={events.length}
                description="Campus events"
                icon={CalendarDays}
                iconClass="bg-[#eef2ff] text-[#4f46e5]"
              />

              <EventStatCard
                title="Upcoming"
                value={
                  currentDate
                    ? events.filter(
                        (event) =>
                          new Date(event.eventDate).getTime() >
                          currentDate.getTime()
                      ).length
                    : 0
                }
                description="Future events"
                icon={Clock}
                iconClass="bg-[#eef2ff] text-[#4f46e5]"
              />

              <EventStatCard
                title="Today"
                value={
                  currentDate
                    ? events.filter((event) => {
                        const date = new Date(event.eventDate);
                        return (
                          date.getFullYear() === currentDate.getFullYear() &&
                          date.getMonth() === currentDate.getMonth() &&
                          date.getDate() === currentDate.getDate()
                        );
                      }).length
                    : 0
                }
                description="Events happening today"
                icon={CalendarDays}
                iconClass="bg-[#eef2ff] text-[#4f46e5]"
              />
            </section>

            {/* ALERTS */}
            {success && (
              <div className="mt-5 rounded-xl border border-[#bde4cf] bg-[#f1faf5] px-4 py-3 text-sm font-medium text-[#31986d] shadow-sm">
                {success}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm">
                {error}
              </div>
            )}

            {/* SEARCH + FILTER */}
            <section className="mt-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-[650px]">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8ea2b7]"
                  />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search events by title, venue or club..."
                    className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-white pl-11 pr-10 text-[12px] text-[#24384e] shadow-[0_7px_22px_rgba(30,60,90,0.04)] outline-none transition placeholder:text-[#9aabba] focus:border-[#8fc7e3] focus:ring-4 focus:ring-[#54bce5]/10"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8194a8] transition hover:bg-[#eef5fa] hover:text-[#3989b7]"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {[
                    ["all", "All Events"],
                    ["upcoming", "Upcoming"],
                    ["past", "Past"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setEventFilter(value as "all" | "upcoming" | "past")
                      }
                      className={`rounded-xl px-4 py-2.5 text-[11px] font-semibold transition-all duration-200 ${
                        eventFilter === value
                          ? "bg-[#111d2e] text-white shadow-sm"
                          : "border border-[#d8e3ed] bg-white text-[#526b84] hover:border-[#9bcce6] hover:text-[#3989b7]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* EVENT LIST OR EMPTY STATE */}
              {loading ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[390px] animate-pulse rounded-[20px] border border-[#d8e3ed] bg-white"
                    />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[#c9d8e5] bg-white px-6 py-16 text-center shadow-[0_7px_22px_rgba(30,60,90,0.04)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf7fc] text-[#54bce5]">
                    <CalendarDays size={30} />
                  </div>
                  <h3 className="mt-5 font-serif text-[21px] font-bold text-[#142238]">
                    {searchTerm || eventFilter !== "all"
                      ? "No matching events"
                      : "No events created yet"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-[12px] leading-6 text-[#72849a]">
                    {searchTerm || eventFilter !== "all"
                      ? "Try a different search term or filter."
                      : "Create your first campus event. After creation, students will be able to see it in their Events section."}
                  </p>
                  {!searchTerm && eventFilter === "all" && (
                    <button
                      type="button"
                      onClick={openCreateForm}
                      className="group mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#54bce5] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(84,188,229,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3eabd7] hover:shadow-[0_14px_28px_rgba(84,188,229,0.3)]"
                    >
                      <Plus
                        size={17}
                        className="transition-transform duration-300 group-hover:rotate-90"
                      />
                      Create First Event
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredEvents.map((event) => {
                    const effect =
                      cursorEffect?.id === event.id ? cursorEffect : null;

                    return (
                      <article
                        key={event.id}
                        className="group min-w-0 overflow-hidden rounded-[20px] border border-[#d8e3ed] bg-white shadow-[0_7px_22px_rgba(30,60,90,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#b9d8e9] hover:shadow-[0_18px_38px_rgba(30,70,100,0.13)]"
                      >
                        {/* IMAGE */}
                        <div
                          className="relative h-[205px] w-full overflow-hidden bg-gradient-to-br from-[#dff2fa] to-[#edf7fc]"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x =
                              ((e.clientX - rect.left) / rect.width - 0.5) * 10;
                            const y =
                              ((e.clientY - rect.top) / rect.height - 0.5) * 10;

                            setCursorEffect({
                              id: event.id,
                              x,
                              y,
                            });
                          }}
                          onMouseLeave={() => setCursorEffect(null)}
                        >
                          {event.image ? (
                            <img
                              src={event.image}
                              alt={event.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              style={
                                effect
                                  ? {
                                      transform: `scale(1.08) translate3d(${effect.x}px, ${effect.y}px, 0)`,
                                    }
                                  : undefined
                              }
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <CalendarDays
                                size={55}
                                strokeWidth={1.2}
                                className="text-[#54bce5] transition-transform duration-500 group-hover:scale-110"
                                style={
                                  effect
                                    ? {
                                        transform: `translate3d(${effect.x * 0.6}px, ${effect.y * 0.6}px, 0)`,
                                      }
                                    : undefined
                                }
                              />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-[#07111f]/45 px-2.5 py-1 text-[9px] font-semibold text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                            Move cursor
                          </div>
                        </div>

                        {/* CARD CONTENT */}
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-full border border-[#d7eaf4] bg-[#f1f9fd] px-2.5 py-1 text-[10px] font-semibold text-[#3989b7]">
                              <Users size={12} />
                              {event.club?.name || "Campus Event"}
                            </span>

                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditForm(event)}
                                disabled={creating || deletingId === event.id}
                                aria-label={`Edit ${event.title}`}
                                title="Edit Event"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d7eaf4] bg-[#f1f9fd] text-[#3989b7] transition hover:scale-105 hover:bg-[#e2f4fb] hover:text-[#24749e] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteEvent(event.id, event.title)
                                }
                                disabled={deletingId === event.id || creating}
                                aria-label={`Delete ${event.title}`}
                                title="Delete Event"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:scale-105 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId === event.id ? (
                                  <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>
                            </div>
                          </div>

                          <h3 className="mt-4 line-clamp-2 font-serif text-[19px] font-bold leading-6 text-[#142238]">
                            {event.title}
                          </h3>

                          <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-[#72849a]">
                            {event.description}
                          </p>

                          <div className="mt-4 space-y-2 border-t border-[#edf1f5] pt-4">
                            <div className="flex items-center gap-2 text-[11px] text-[#61768c]">
                              <CalendarDays
                                size={14}
                                className="shrink-0 text-[#54bce5]"
                              />
                              <span>{formatDate(event.eventDate)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#61768c]">
                              <Clock
                                size={14}
                                className="shrink-0 text-[#54bce5]"
                              />
                              <span>{formatTime(event.eventDate)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#61768c]">
                              <MapPin
                                size={14}
                                className="shrink-0 text-[#54bce5]"
                              />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7fafc] px-3 py-2">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8aa0b4]">
                              Faculty Managed
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#3c9a72]">
                              <CheckCircle2 size={12} />
                              Live
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="h-10" />
          </div>
        </main>
      </div>

      {/* CREATE/EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#07111f]/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-[#d8e3ed] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3ebf2] px-6 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#54bce5]">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <h2 className="font-serif text-[20px] font-bold text-[#142238]">
                    {isEditing ? "Edit Event" : "Create New Event"}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[#72849a]">
                    {isEditing
                      ? "Update the shared campus event for students and faculty."
                      : "Create an event for campus students."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={creating}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#72849a] transition hover:bg-[#f2f6f9] hover:text-[#142238]"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 sm:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Enter event title"
                    disabled={creating}
                    className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Describe the event..."
                    rows={4}
                    disabled={creating}
                    className="w-full resize-none rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 py-3 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Venue
                  </label>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ba0b4]"
                    />
                    <input
                      type="text"
                      value={form.venue}
                      onChange={(e) => handleChange("venue", e.target.value)}
                      placeholder="Event venue"
                      disabled={creating}
                      className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] pl-11 pr-4 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Event Date & Time
                  </label>
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ba0b4]"
                    />
                    <input
                      type="datetime-local"
                      value={form.eventDate}
                      onChange={(e) =>
                        handleChange("eventDate", e.target.value)
                      }
                      disabled={creating}
                      className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] pl-11 pr-3 text-sm text-[#142238] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Club
                  </label>
                  <select
                    value={form.clubId}
                    onChange={(e) => handleChange("clubId", e.target.value)}
                    disabled={creating}
                    className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 text-sm text-[#142238] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  >
                    <option value="">Select a club</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>

                  {clubs.length === 0 && (
                    <p className="mt-1.5 text-[10px] text-[#9aabba]">
                      No clubs were loaded. Please make sure your existing clubs API is available.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Event Image URL
                    <span className="ml-1 font-normal text-[#9aabba]">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => handleChange("image", e.target.value)}
                    placeholder="https://..."
                    disabled={creating}
                    className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={creating}
                  className="h-11 rounded-xl border border-[#d8e3ed] bg-white px-5 text-sm font-semibold text-[#526b84] transition hover:bg-[#f5f8fb] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#54bce5] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(84,188,229,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3eabd7] hover:shadow-[0_12px_25px_rgba(84,188,229,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Plus
                        size={17}
                        className="transition-transform duration-300 group-hover:rotate-90"
                      />
                      {isEditing ? "Update Event" : "Create Event"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}