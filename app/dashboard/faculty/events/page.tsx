"use client";

import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Pencil,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard/faculty",
    icon: GraduationCap,
  },
  {
    title: "Students",
    href: "/students",
    icon: Users,
  },
  {
    title: "Student Approval",
    href: "/dashboard/faculty/approvals/students",
    icon: CheckCircle2,
  },
  {
    title: "Attendance",
    href: "/dashboard/faculty/attendance",
    icon: CheckCircle2,
  },
  {
    title: "Events",
    href: "/dashboard/faculty/events",
    icon: CalendarDays,
  },
  {
    title: "Faculty Profile",
    href: "/faculty/profile",
    icon: UserCircle,
  },
];

const accountNavigation = [
  {
    title: "Account Security",
    href: "/faculty/security",
    icon: ShieldCheck,
  },
];

export default function FacultyEventsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<FacultyUser>(defaultFaculty);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
            // Continue checking the next key.
          }
        }
      } catch {
        // Keep default faculty.
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

  /* =========================================================
     INITIAL DATA LOAD
  ========================================================= */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEvents();
      void fetchClubs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function handleChange(field: keyof EventForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  /* =========================================================
     OPEN CREATE FORM
  ========================================================= */

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

  /* =========================================================
     CREATE / UPDATE EVENT
  ========================================================= */

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

  /* =========================================================
     DELETE EVENT
  ========================================================= */

  async function handleDeleteEvent(
    eventId: string,
    title: string
  ) {
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

  /* =========================================================
     SIGN OUT
  ========================================================= */

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (logoutError) {
      console.error("Faculty logout error:", logoutError);
    }

    try {
      localStorage.removeItem("facultyUser");
      localStorage.removeItem("faculty");
      localStorage.removeItem("currentFaculty");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("facultyToken");
    } catch (storageError) {
      console.error(
        "Local storage cleanup error:",
        storageError
      );
    }

    router.replace("/faculty/login");
  }

  /* =========================================================
     DATE / TIME
  ========================================================= */

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

  /* =========================================================
     ACTIVE NAVIGATION
  ========================================================= */

  function isActive(href: string) {
    if (href === "/dashboard/faculty") {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  const facultyName = user.name || "Vivek Kumar";
  const facultyRole = user.role || "Faculty Member";
  const facultyId = user.facultyId || "RNT-9457";

  const initials =
    facultyName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VK";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-[#23344d] bg-[#0b1423] text-white shadow-[8px_0_35px_rgba(5,15,30,0.16)] transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-[92px] shrink-0 items-center justify-between border-b border-[#223149] px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#54bce5] shadow-[0_8px_25px_rgba(84,188,229,0.25)]">
              <GraduationCap size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="font-serif text-[19px] font-bold tracking-tight">
                CampusConnect
              </h1>

              <p className="mt-0.5 text-[11px] font-medium text-[#91a4bb]">
                Faculty Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-[#8fa3bb] transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMobileSidebarOpen(false)
                  }
                  className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-[#17263a] text-[#64c8ee] shadow-[inset_3px_0_0_#54bce5]"
                      : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={
                      active
                        ? "text-[#63c9ef]"
                        : "text-[#8195ad] group-hover:text-[#63c9ef]"
                    }
                  />

                  <span>{item.title}</span>

                  {active && (
                    <ChevronRight
                      size={16}
                      className="ml-auto text-[#63c9ef]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="my-7 h-px bg-[#223149]" />

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Account
          </p>

          <nav className="space-y-1.5">
            {accountNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMobileSidebarOpen(false)
                  }
                  className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-[#17263a] text-[#64c8ee]"
                      : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className="text-[#8195ad] group-hover:text-[#63c9ef]"
                  />

                  <span>{item.title}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
            >
              <LogOut
                size={18}
                strokeWidth={1.8}
                className="text-[#8195ad] group-hover:text-[#63c9ef]"
              />

              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        <div className="shrink-0 border-t border-[#223149] p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#111e2f] px-3.5 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#54bce5] text-[12px] font-bold">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">
                {facultyName}
              </p>

              <p className="truncate text-[11px] text-[#8296ae]">
                {facultyRole}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="min-h-screen w-full min-w-0 lg:pl-[270px]">

        {/* HEADER */}

        <header className="sticky top-0 z-30 h-[86px] w-full border-b border-[#dce6f0] bg-white/95 backdrop-blur-xl">
          <div className="flex h-full w-full items-center justify-between px-5 sm:px-7">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(true)
                }
                aria-label="Open sidebar"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#263a53] shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3985b6]">
                  Faculty Portal
                </p>

                <p className="mt-1 hidden text-[11px] text-[#71839a] sm:block">
                  Academic management workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe]"
              >
                <Bell size={18} />

                <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#54bce5]" />
              </button>

              <button
                type="button"
                aria-label="Settings"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe] sm:flex"
              >
                <Settings size={18} />
              </button>

              <div className="mx-1 hidden h-8 w-px bg-[#dce6f0] sm:block" />

              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#69acd2] text-[12px] font-bold text-white">
                  {initials}
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-[#18283d]">
                    {facultyName}
                  </p>

                  <p className="text-[10px] text-[#72849a]">
                    {facultyRole}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <main className="relative min-h-[calc(100vh-86px)] w-full overflow-hidden bg-[#edf4fa] px-4 py-6 sm:px-6">

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

            {/* =================================================
                HERO
            ================================================= */}

            <section className="group/hero relative overflow-hidden rounded-[24px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-7 py-7 shadow-[0_18px_45px_rgba(10,27,48,0.18)] transition-all duration-500 hover:border-[#31516d] hover:shadow-[0_25px_60px_rgba(10,27,48,0.25)] sm:px-9 lg:px-10">

              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#54bce5]/20 transition-transform duration-700 group-hover/hero:scale-110" />

              <div className="pointer-events-none absolute right-8 top-14 h-40 w-40 rounded-full border border-[#54bce5]/10 transition-transform duration-700 group-hover/hero:scale-110" />

              <div className="pointer-events-none absolute bottom-[-100px] left-[42%] h-64 w-64 rounded-full bg-[#54bce5]/5 blur-3xl" />

              <div className="relative z-10 max-w-[1100px]">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#76d0f1]">
                  <GraduationCap size={14} />
                  Faculty Event Management
                </div>

                <h1 className="font-serif text-[35px] font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-[45px] lg:text-[51px]">
                  Create campus
                  <br />
                  <span className="text-[#69c9ed]">
                    events & activities.
                  </span>
                </h1>

                <p className="mt-4 max-w-[900px] text-[13px] leading-6 text-[#a7b7c9] sm:text-[14px]">
                  Create, manage and remove campus events directly
                  from the Faculty Portal. Changes are reflected in
                  the same database used by the Student Events section.
                </p>

                {/* =================================================
                    HERO CREATE BUTTON
                ================================================= */}

                <div className="mt-6 flex flex-wrap items-center gap-3">

                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="group/create relative inline-flex h-12 items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#54bce5] px-5 text-[13px] font-bold text-white shadow-[0_10px_30px_rgba(84,188,229,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#43b1dc] hover:shadow-[0_16px_35px_rgba(84,188,229,0.4)] active:translate-y-0"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover/create:translate-x-full" />

                    <Plus
                      size={18}
                      className="relative transition-transform duration-300 group-hover/create:rotate-90"
                    />

                    <span className="relative">
                      Create Event
                    </span>
                  </button>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#49c997]/30 bg-[#49c997]/10 px-3.5 py-2 text-[11px] font-semibold text-[#72dcb4]">
                    <CheckCircle2 size={14} />
                    Faculty Access
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#7890aa]/30 bg-white/[0.04] px-3.5 py-2 text-[11px] font-medium text-[#b3c0d0]">
                    <UserCircle size={14} />
                    Faculty ID:
                    <span className="font-bold text-white">
                      {facultyId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-7 right-8 hidden h-[92px] w-[92px] items-center justify-center rounded-[21px] border border-[#54bce5]/25 bg-[#15273b]/90 shadow-[0_20px_45px_rgba(0,0,0,0.2)] transition-all duration-500 group-hover/hero:scale-105 group-hover/hero:border-[#54bce5]/50 lg:flex">
                <CalendarDays
                  size={46}
                  strokeWidth={1.5}
                  className="text-[#67bfe6]"
                />
              </div>
            </section>

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
              <div className="mt-5 rounded-xl border border-[#bde4cf] bg-[#f1faf5] px-4 py-3 text-sm font-medium text-[#31986d] shadow-sm">
                {success}
              </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm">
                {error}
              </div>
            )}

            {/* =================================================
                EVENTS
            ================================================= */}

            <section className="mt-8">

              <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#438bb8]">
                    Campus Events
                  </p>

                  <h2 className="mt-1 font-serif text-[27px] font-bold text-[#0d1728]">
                    Created Events
                  </h2>

                  <p className="mt-1 text-[12px] text-[#72849a]">
                    Events created here are visible to students.
                  </p>
                </div>

                <div className="flex gap-2">

                  {/* CREATE EVENT BUTTON */}

                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#54bce5] px-4 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(84,188,229,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3eabd7] hover:shadow-[0_12px_25px_rgba(84,188,229,0.32)]"
                  >
                    <Plus
                      size={16}
                      className="transition-transform duration-300 group-hover:rotate-90"
                    />

                    Create Event
                  </button>

                  {/* REFRESH */}

                  <button
                    type="button"
                    onClick={() => void fetchEvents()}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e3ed] bg-white px-4 text-xs font-semibold text-[#526b84] shadow-sm transition hover:border-[#9bcbe4] hover:text-[#3989b7] disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={
                        loading ? "animate-spin" : ""
                      }
                    />

                    Refresh
                  </button>
                </div>
              </div>

              {/* =================================================
                  LOADING
              ================================================= */}

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

                /* =================================================
                   EMPTY
                ================================================= */

                <div className="rounded-[22px] border border-dashed border-[#c9d8e5] bg-white px-6 py-16 text-center shadow-[0_7px_22px_rgba(30,60,90,0.04)]">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf7fc] text-[#54bce5]">
                    <CalendarDays size={30} />
                  </div>

                  <h3 className="mt-5 font-serif text-[21px] font-bold text-[#142238]">
                    No events created yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-[12px] leading-6 text-[#72849a]">
                    Create your first campus event. After creation,
                    students will be able to see it in their Events
                    section.
                  </p>

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
                </div>

              ) : (

                /* =================================================
                   EVENT CARDS
                ================================================= */

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {events.map((event) => {

                    const effect =
                      cursorEffect?.id === event.id
                        ? cursorEffect
                        : null;

                    return (
                      <article
                        key={event.id}
                        className="group min-w-0 overflow-hidden rounded-[20px] border border-[#d8e3ed] bg-white shadow-[0_7px_22px_rgba(30,60,90,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#b9d8e9] hover:shadow-[0_18px_38px_rgba(30,70,100,0.13)]"
                      >

                        {/* IMAGE */}

                        <div
                          className="relative h-[205px] w-full overflow-hidden bg-gradient-to-br from-[#dff2fa] to-[#edf7fc]"
                          onMouseMove={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();

                            const x =
                              ((e.clientX - rect.left) /
                                rect.width -
                                0.5) *
                              10;

                            const y =
                              ((e.clientY - rect.top) /
                                rect.height -
                                0.5) *
                              10;

                            setCursorEffect({
                              id: event.id,
                              x,
                              y,
                            });
                          }}
                          onMouseLeave={() =>
                            setCursorEffect(null)
                          }
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
                              {event.club?.name ||
                                "Campus Event"}
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
                                  void handleDeleteEvent(
                                    event.id,
                                    event.title
                                  )
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

                              <span>
                                {formatDate(
                                  event.eventDate
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#61768c]">
                              <Clock
                                size={14}
                                className="shrink-0 text-[#54bce5]"
                              />

                              <span>
                                {formatTime(
                                  event.eventDate
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#61768c]">
                              <MapPin
                                size={14}
                                className="shrink-0 text-[#54bce5]"
                              />

                              <span className="truncate">
                                {event.venue}
                              </span>
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

      {/* =====================================================
          CREATE EVENT MODAL
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#07111f]/70 px-4 py-6 backdrop-blur-sm">

          <div className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-[#d8e3ed] bg-white shadow-2xl">

            {/* MODAL HEADER */}

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

            {/* FORM */}

            <form
              onSubmit={handleCreateEvent}
              className="p-6 sm:p-7"
            >

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* TITLE */}

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Event Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      handleChange(
                        "title",
                        e.target.value
                      )
                    }
                    placeholder="Enter event title"
                    disabled={creating}
                    className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      handleChange(
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Describe the event..."
                    rows={4}
                    disabled={creating}
                    className="w-full resize-none rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 py-3 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />
                </div>

                {/* VENUE */}

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
                      onChange={(e) =>
                        handleChange(
                          "venue",
                          e.target.value
                        )
                      }
                      placeholder="Event venue"
                      disabled={creating}
                      className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] pl-11 pr-4 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                    />

                  </div>
                </div>

                {/* DATE */}

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
                        handleChange(
                          "eventDate",
                          e.target.value
                        )
                      }
                      disabled={creating}
                      className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] pl-11 pr-3 text-sm text-[#142238] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                    />

                  </div>
                </div>

                {/* CLUB */}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#40566e]">
                    Club
                  </label>

                  <select
                    value={form.clubId}
                    onChange={(e) =>
                      handleChange(
                        "clubId",
                        e.target.value
                      )
                    }
                    disabled={creating}
                    className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 text-sm text-[#142238] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  >
                    <option value="">
                      Select a club
                    </option>

                    {clubs.map((club) => (
                      <option
                        key={club.id}
                        value={club.id}
                      >
                        {club.name}
                      </option>
                    ))}
                  </select>

                  {clubs.length === 0 && (
                    <p className="mt-1.5 text-[10px] text-[#9aabba]">
                      No clubs were loaded. Please make sure
                      your existing clubs API is available.
                    </p>
                  )}
                </div>

                {/* IMAGE */}

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
                    onChange={(e) =>
                      handleChange(
                        "image",
                        e.target.value
                      )
                    }
                    placeholder="https://..."
                    disabled={creating}
                    className="h-12 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-4 text-sm text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* FORM ERROR */}

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                  {error}
                </div>
              )}

              {/* ACTIONS */}

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