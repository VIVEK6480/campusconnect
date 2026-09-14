"use client";

import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  GraduationCap,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  FormEvent,
  ReactNode,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

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

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  campusUserId?: string | null;
  facultyId?: string;
  role?: string;
  approvalStatus?: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY_FORM: ActivityForm = {
  title: "",
  description: "",
  venue: "",
  activityDate: "",
};

const defaultFaculty: FacultyUser = {
  id: "",
  name: "Faculty",
  email: "faculty@campusconnect.com",
  facultyId: "FACULTY",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
};

/* =========================================================
   SIDEBAR
========================================================= */

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard/faculty",
    icon: GraduationCap,
  },
  {
    title: "Students",
    href: "/dashboard/faculty/students",
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
    icon: BookOpen,
  },
  {
    title: "Events",
    href: "/dashboard/faculty/events",
    icon: CalendarDays,
  },
  {
    title: "Activities",
    href: "/dashboard/faculty/activities",
    icon: BookOpen,
  },
  {
    title: "Clubs",
    href: "/dashboard/faculty/clubs",
    icon: Users,
  },
  {
    title: "Faculty Profile",
    href: "/faculty/profile",
    icon: UserCircle,
  },
  {
    title: "Notifications",
    href: "/dashboard/faculty/notifications",
    icon: Bell,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return value;
  }
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return "";
  }
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate = new Date(
    date.getTime() -
      offset * 60 * 1000
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

/* =========================================================
   PAGE
========================================================= */

export default function FacultyActivitiesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [faculty, setFaculty] =
    useState<FacultyUser>(
      defaultFaculty
    );

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<
      "all" | "upcoming" | "past"
    >("all");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<ActivityForm>(
      EMPTY_FORM
    );

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  /* =========================================================
     LOAD FACULTY
  ========================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        try {
          const possibleKeys = [
            "facultyUser",
            "faculty",
            "currentFaculty",
            "user",
          ];

          let parsed:
            | FacultyUser
            | null = null;

          for (
            const key of possibleKeys
          ) {
            const stored =
              localStorage.getItem(
                key
              );

            if (!stored) {
              continue;
            }

            try {
              const candidate =
                JSON.parse(stored);

              if (
                candidate &&
                typeof candidate ===
                  "object" &&
                candidate.email
              ) {
                parsed =
                  candidate;
                break;
              }
            } catch {
              continue;
            }
          }

          if (!parsed) {
            return;
          }

          setFaculty({
            id: parsed.id,
            name:
              parsed.name ||
              defaultFaculty.name,
            email:
              parsed.email ||
              defaultFaculty.email,
            campusUserId:
              parsed.campusUserId,
            facultyId:
              parsed.facultyId ||
              parsed.campusUserId ||
              defaultFaculty.facultyId,
            role:
              parsed.role ||
              defaultFaculty.role,
            approvalStatus:
              parsed.approvalStatus ||
              defaultFaculty.approvalStatus,
          });
        } catch (err) {
          console.error(
            "FACULTY INFORMATION ERROR:",
            err
          );
        }
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, []);

  /* =========================================================
     FETCH ACTIVITIES
  ========================================================== */

  const fetchActivities =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/faculty/activities",
            {
              method: "GET",
              credentials:
                "include",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to fetch activities."
          );
        }

        setActivities(
          data?.success &&
            Array.isArray(
              data.activities
            )
            ? data.activities
            : []
        );
      } catch (err) {
        console.error(
          "LOAD FACULTY ACTIVITIES ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load activities."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void fetchActivities();
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [fetchActivities]);

  /* =========================================================
     DATE
  ========================================================== */

  const now = useMemo(
    () => new Date(),
    [activities]
  );

  /* =========================================================
     SEARCH + FILTER
  ========================================================== */

  const filteredActivities =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return activities
        .filter((activity) => {
          const activityDate =
            new Date(
              activity.activityDate
            );

          const matchesFilter =
            filter === "all" ||
            (filter ===
              "upcoming" &&
              activityDate >=
                now) ||
            (filter === "past" &&
              activityDate < now);

          if (!matchesFilter) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          return [
            activity.title,
            activity.description,
            activity.venue,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          );
        })
        .sort(
          (a, b) =>
            new Date(
              a.activityDate
            ).getTime() -
            new Date(
              b.activityDate
            ).getTime()
        );
    }, [
      activities,
      filter,
      now,
      search,
    ]);

  /* =========================================================
     STATS
  ========================================================== */

  const totalActivities =
    activities.length;

  const upcomingActivities =
    activities.filter(
      (activity) =>
        new Date(
          activity.activityDate
        ) >= now
    ).length;

  const todayActivities =
    activities.filter(
      (activity) => {
        const date =
          new Date(
            activity.activityDate
          );

        const current =
          new Date();

        return (
          date.getFullYear() ===
            current.getFullYear() &&
          date.getMonth() ===
            current.getMonth() &&
          date.getDate() ===
            current.getDate()
        );
      }
    ).length;

  /* =========================================================
     MODALS
  ========================================================== */

  const openCreateModal =
    () => {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setError("");
      setMessage("");
      setModalOpen(true);
    };

  const openEditModal = (
    activity: Activity
  ) => {
    setEditingId(activity.id);

    setForm({
      title: activity.title,
      description:
        activity.description,
      venue: activity.venue,
      activityDate:
        toDateTimeLocal(
          activity.activityDate
        ),
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
    setError("");
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError(
        "Activity title is required."
      );
      return;
    }

    if (
      !form.description.trim()
    ) {
      setError(
        "Activity description is required."
      );
      return;
    }

    if (!form.venue.trim()) {
      setError(
        "Activity venue is required."
      );
      return;
    }

    if (!form.activityDate) {
      setError(
        "Activity date and time are required."
      );
      return;
    }

    const wasEditing =
      Boolean(editingId);

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const method = wasEditing
        ? "PUT"
        : "POST";

      const url = wasEditing
        ? `/api/faculty/activities?id=${encodeURIComponent(
            editingId as string
          )}`
        : "/api/faculty/activities";

      const response =
        await fetch(url, {
          method,
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            title:
              form.title.trim(),
            description:
              form.description.trim(),
            venue:
              form.venue.trim(),
            activityDate:
              new Date(
                form.activityDate
              ).toISOString(),
          }),
        });

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (wasEditing
              ? "Failed to update activity."
              : "Failed to create activity.")
        );
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);

      setMessage(
        data?.message ||
          (wasEditing
            ? "Activity updated successfully."
            : "Activity created successfully.")
      );

      await fetchActivities();
    } catch (err) {
      console.error(
        "SAVE FACULTY ACTIVITY ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save activity."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================== */

  const handleDelete =
    async (
      activity: Activity
    ) => {
      const confirmed =
        window.confirm(
          `Delete activity "${activity.title}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          activity.id
        );

        setError("");
        setMessage("");

        const response =
          await fetch(
            `/api/faculty/activities?id=${encodeURIComponent(
              activity.id
            )}`,
            {
              method: "DELETE",
              credentials:
                "include",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to delete activity."
          );
        }

        setMessage(
          data?.message ||
            "Activity deleted successfully."
        );

        await fetchActivities();
      } catch (err) {
        console.error(
          "DELETE FACULTY ACTIVITY ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete activity."
        );
      } finally {
        setDeletingId(null);
      }
    };

  /* =========================================================
     SIGN OUT
  ========================================================== */

  const handleSignOut =
    async () => {
      try {
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials:
              "include",
            cache: "no-store",
          }
        );
      } catch (err) {
        console.error(
          "FACULTY LOGOUT ERROR:",
          err
        );
      }

      try {
        [
          "facultyUser",
          "faculty",
          "currentFaculty",
          "user",
          "token",
          "facultyToken",
        ].forEach((key) => {
          localStorage.removeItem(
            key
          );
        });
      } catch (err) {
        console.error(
          "STORAGE CLEANUP ERROR:",
          err
        );
      }

      router.replace(
        "/faculty/login"
      );
    };

  /* =========================================================
     FACULTY DISPLAY
  ========================================================== */

  const facultyName =
    faculty.name ||
    "Faculty";

  const facultyRole =
    faculty.role ||
    "Faculty Member";

  const initials =
    facultyName
      .split(" ")
      .filter(Boolean)
      .map((part) =>
        part.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "FC";

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#edf4fa] text-[#0d1728]">

      {/* ===================================================
          MOBILE SIDEBAR OVERLAY
      ==================================================== */}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setMobileSidebarOpen(
              false
            )
          }
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ===================================================
          MOBILE MENU BUTTON
          TOP HEADER REMOVED
      ==================================================== */}

      <button
        type="button"
        aria-label="Open faculty sidebar"
        onClick={() =>
          setMobileSidebarOpen(
            true
          )
        }
        className="fixed left-4 top-4 z-[45] flex h-11 w-11 items-center justify-center rounded-xl border border-[#d5e4ed] bg-white text-[#38566d] shadow-lg lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* ===================================================
          FACULTY SIDEBAR
      ==================================================== */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-[270px]
          flex-col
          border-r border-[#23344d]
          bg-[#0b1423]
          text-white
          shadow-[8px_0_35px_rgba(5,15,30,0.16)]
          transition-transform duration-300
          lg:translate-x-0
          ${
            mobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* BRAND */}

        <div className="flex h-[92px] shrink-0 items-center justify-between border-b border-[#223149] px-6">

          <Link
            href="/dashboard/faculty"
            onClick={() =>
              setMobileSidebarOpen(
                false
              )
            }
            className="flex min-w-0 items-center gap-3"
          >

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#54bce5] shadow-[0_8px_25px_rgba(84,188,229,0.25)]">
              <GraduationCap
                size={25}
              />
            </div>

            <div className="min-w-0">

              <h1 className="font-serif text-[19px] font-bold tracking-tight text-white">
                CampusConnect
              </h1>

              <p className="mt-0.5 text-[11px] text-[#91a4bb]">
                Faculty Portal
              </p>

            </div>

          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileSidebarOpen(
                false
              )
            }
            className="rounded-lg p-2 text-[#8fa3bb] hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>

        </div>

        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-4 py-7">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
            Main Menu
          </p>

          <nav className="space-y-1.5">

            {navigation.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  pathname ===
                  item.href;

                return (
                  <Link
                    key={
                      item.title
                    }
                    href={
                      item.href
                    }
                    onClick={() =>
                      setMobileSidebarOpen(
                        false
                      )
                    }
                    className={`
                      group flex h-11 w-full items-center gap-3
                      rounded-xl px-3.5
                      text-[13px] font-medium
                      transition-all duration-200
                      ${
                        active
                          ? "bg-[#17263a] text-[#64c8ee] shadow-[inset_3px_0_0_#54bce5]"
                          : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
                      }
                    `}
                  >

                    <Icon
                      size={18}
                      strokeWidth={
                        1.8
                      }
                      className={
                        active
                          ? "text-[#63c9ef]"
                          : "text-[#8195ad] group-hover:text-[#63c9ef]"
                      }
                    />

                    <span>
                      {
                        item.title
                      }
                    </span>

                    {active && (
                      <ChevronRight
                        size={
                          16
                        }
                        className="ml-auto text-[#63c9ef]"
                      />
                    )}

                  </Link>
                );
              }
            )}

          </nav>

          {/* ACCOUNT */}

          <div className="mt-7 border-t border-[#223149] pt-5">

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
              Account
            </p>

            <Link
              href="/faculty/security"
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-[#9aabc0] hover:bg-[#142135] hover:text-white"
            >

              <Settings
                size={18}
                className="text-[#8195ad] group-hover:text-[#63c9ef]"
              />

              Settings

            </Link>

            <button
              type="button"
              onClick={
                handleSignOut
              }
              className="group mt-1.5 flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] hover:bg-[#142135] hover:text-white"
            >

              <LogOut
                size={18}
                className="text-[#8195ad] group-hover:text-[#63c9ef]"
              />

              Sign Out

            </button>

          </div>

        </div>

        {/* USER */}

        <div className="shrink-0 border-t border-[#223149] p-4">

          <div className="flex items-center gap-3 rounded-2xl bg-[#111e2f] px-3.5 py-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#54bce5] text-[12px] font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0">

              <p className="truncate text-[13px] font-semibold text-white">
                {facultyName}
              </p>

              <p className="truncate text-[11px] text-[#8296ae]">
                {facultyRole}
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* ===================================================
          MAIN
      ==================================================== */}

      <main className="min-h-screen w-full overflow-x-hidden bg-[#edf4fa] lg:pl-[270px]">

        {/* BACKGROUND */}

        <div className="pointer-events-none fixed inset-0 opacity-60">

          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(88,157,197,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.055) 1px, transparent 1px)",
              backgroundSize:
                "42px 42px",
            }}
          />

          <div className="absolute left-[20%] top-[8%] h-[450px] w-[450px] rounded-full bg-[#dceef8] blur-3xl" />

          <div className="absolute right-[5%] top-[30%] h-[350px] w-[350px] rounded-full bg-[#e4f2f9] blur-3xl" />

        </div>

        <div className="relative w-full px-4 py-5 md:px-6 lg:px-8">

          {/* =================================================
              HERO
              EXACTLY 280PX
          ================================================== */}

          <section className="relative h-[280px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-6 py-7 text-white shadow-[0_18px_45px_rgba(10,27,48,0.18)] sm:px-8 sm:py-8 lg:px-10">

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-2xl" />

            <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-300/15 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-8 lg:flex-row lg:items-center lg:gap-10">

              <div className="max-w-3xl">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 shadow-lg shadow-black/20">

                  <BookOpen
                    size={14}
                  />

                  Campus Activities

                </div>

                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  Manage Activities
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/90 sm:text-base">
                  Create and manage campus
                  activities that appear
                  directly in the existing
                  Student Activities panel.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="shrink-0 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white/95 px-7 text-sm font-bold text-[#28346f] shadow-xl shadow-blue-950/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-white hover:shadow-[0_14px_32px_rgba(32,43,99,.24)]"
              >

                <Plus size={18} />

                Create Activity

              </button>

            </div>

          </section>

          {/* =================================================
              STATS
          ================================================== */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

            <StatCard
              icon={
                <BookOpen size={20} />
              }
              label="Total Activities"
              value={String(
                totalActivities
              )}
              description="All activities"
            />

            <StatCard
              icon={
                <CalendarDays
                  size={20}
                />
              }
              label="Upcoming"
              value={String(
                upcomingActivities
              )}
              description="Future activities"
            />

            <StatCard
              icon={
                <Clock3 size={20} />
              }
              label="Today"
              value={String(
                todayActivities
              )}
              description="Scheduled today"
            />

          </section>

          {/* =================================================
              TOOLBAR
          ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#d7e5ec] bg-white p-4 shadow-sm sm:p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="relative w-full lg:max-w-2xl">

                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ba1b0]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search activity, venue or description..."
                  className="h-11 w-full rounded-xl border border-[#d8e5ec] bg-[#f7fbfd] pl-10 pr-4 text-sm font-medium text-[#344e60] outline-none transition placeholder:text-[#91a4b1] focus:border-[#54bce5] focus:bg-white focus:ring-4 focus:ring-[#54bce5]/10"
                />

              </div>

              <div className="flex flex-wrap gap-2">

                {(
                  [
                    [
                      "all",
                      "All Activities",
                    ],
                    [
                      "upcoming",
                      "Upcoming",
                    ],
                    [
                      "past",
                      "Past",
                    ],
                  ] as const
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFilter(
                          value
                        )
                      }
                      className={`
                        rounded-lg px-3.5 py-2 text-xs font-bold transition
                        ${
                          filter ===
                          value
                            ? "bg-[#54bce5] text-white shadow-sm"
                            : "bg-[#edf7fc] text-[#3989b7] hover:bg-[#dff2fa] hover:text-[#246f98]"
                        }
                      `}
                    >
                      {label}
                    </button>
                  )
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              MESSAGES
          ================================================== */}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-[#b9e2f2] bg-[#eff9fd] px-4 py-3 text-sm font-semibold text-[#287ca5]">
              {message}
            </div>
          )}

          {/* =================================================
              ACTIVITY LIST
          ================================================== */}

          <section className="relative z-10 mt-5">

            {loading ? (

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="min-h-[350px] animate-pulse rounded-[24px] border border-[#d9e6ec] bg-white shadow-sm"
                    >

                      <div className="h-1.5 rounded-t-[24px] bg-[#d9e6ec]" />

                      <div className="space-y-5 p-5 sm:p-6">

                        <div className="flex items-start justify-between gap-4">

                          <div className="h-12 w-12 rounded-2xl bg-[#e6f1f6]" />

                          <div className="h-12 w-28 rounded-xl bg-[#e6f1f6]" />

                        </div>

                        <div className="h-5 w-2/3 rounded bg-[#e6f1f6]" />

                        <div className="space-y-2">

                          <div className="h-4 w-full rounded bg-[#edf4f8]" />

                          <div className="h-4 w-4/5 rounded bg-[#edf4f8]" />

                        </div>

                        <div className="h-28 rounded-2xl bg-[#f1f7fa]" />

                        <div className="h-10 rounded-xl bg-[#e6f1f6]" />

                      </div>

                    </div>
                  )
                )}

              </div>

            ) : filteredActivities.length === 0 ? (

              <div className="rounded-3xl border border-dashed border-[#b9d1db] bg-white px-6 py-20 text-center shadow-sm">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c8e7f3] bg-[#edf8fc] text-[#4ca7d3] shadow-sm">

                  <BookOpen size={28} />

                </div>

                <h2 className="text-xl font-black text-[#203a4b]">
                  No activities found
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#718895]">
                  Create your first activity
                  from the button above. Once
                  saved, it will use the same
                  Activity table and appear on
                  the existing Student Activities
                  page.
                </p>

                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#54bce5] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#42add9]"
                >

                  <Plus size={17} />

                  Create Activity

                </button>

              </div>

            ) : (

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {filteredActivities.map(
                  (activity) => {

                    const activityDate =
                      new Date(
                        activity.activityDate
                      );

                    const isPast =
                      activityDate <
                      new Date();

                    return (
                      <article
                        key={
                          activity.id
                        }
                        className={`
                          faculty-activity-card
                          group relative flex min-h-[365px]
                          flex-col overflow-hidden rounded-[24px]
                          border bg-white shadow-sm
                          transition-all duration-300
                          ${
                            isPast
                              ? "border-[#d8e3ed]"
                              : "border-[#c6e7f0]"
                          }
                        `}
                      >

                        {/* TOP ACCENT */}

                        <div className="h-1.5 shrink-0 bg-gradient-to-r from-[#54bce5] via-[#43afd5] to-[#378bb5]" />

                        <div className="flex flex-1 flex-col p-5 sm:p-6">

                          {/* CARD TOP */}

                          <div className="flex items-start justify-between gap-4">

                            <div className="faculty-mini-box flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cce8f1] bg-[#edf8fc] text-[#398fb5] shadow-sm">

                              <BookOpen
                                size={22}
                              />

                            </div>

                            <div className="faculty-time-box rounded-xl border border-[#d5e9f0] bg-[#edf7fb] px-3 py-2 text-right text-[#3e7892] shadow-sm">

                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#718798]">
                                {formatDate(
                                  activity.activityDate
                                )}
                              </p>

                              <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#718798]">

                                <Clock3
                                  size={12}
                                />

                                <span>
                                  {formatTime(
                                    activity.activityDate
                                  )}
                                </span>

                              </div>

                            </div>

                          </div>

                          {/* TITLE */}

                          <div className="mt-5">

                            <div className="mb-2 flex items-center gap-2">

                              <span className="h-1.5 w-1.5 rounded-full bg-[#54bce5] shadow-[0_0_10px_rgba(84,188,229,.45)]" />

                              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#3989b7]">
                                Campus Activity
                              </span>

                            </div>

                            <h2 className="line-clamp-2 text-xl font-black leading-7 text-[#142238]">
                              {
                                activity.title
                              }
                            </h2>

                            <p className="mt-2 line-clamp-3 min-h-[66px] text-sm leading-6 text-[#718798]">
                              {
                                activity.description
                              }
                            </p>

                          </div>

                          {/* INFO PANEL */}

                          <div className="mt-5 rounded-2xl border border-[#dce8ee] bg-white px-3 py-2.5 shadow-sm">

                            {/* VENUE */}

                            <div className="flex items-center gap-3 py-2">

                              <div className="faculty-mini-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#cce8f1] bg-[#edf8fc] text-[#398fb5] shadow-sm">

                                <MapPin
                                  size={16}
                                />

                              </div>

                              <div className="min-w-0">

                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9aa7]">
                                  Venue
                                </p>

                                <p className="mt-0.5 truncate text-sm font-bold text-[#1b2f41]">
                                  {
                                    activity.venue
                                  }
                                </p>

                              </div>

                            </div>

                            <div className="border-t border-[#edf2f5]" />

                            {/* SCHEDULE */}

                            <div className="flex items-center gap-3 py-2">

                              <div className="faculty-mini-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#cce8f1] bg-[#edf8fc] text-[#398fb5] shadow-sm">

                                <CalendarDays
                                  size={16}
                                />

                              </div>

                              <div className="min-w-0">

                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9aa7]">
                                  Schedule
                                </p>

                                <p className="mt-0.5 text-sm font-bold text-[#1b2f41]">
                                  {formatDate(
                                    activity.activityDate
                                  )}{" "}
                                  •{" "}
                                  {formatTime(
                                    activity.activityDate
                                  )}
                                </p>

                              </div>

                            </div>

                          </div>

                          {/* FOOTER */}

                          <div className="mt-auto flex items-center gap-2 pt-5">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  activity
                                )
                              }
                              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d7e3e9] bg-white text-sm font-bold text-[#587080] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9ed6e4] hover:bg-[#edf8fc] hover:text-[#18779a]"
                            >

                              <Edit3
                                size={15}
                              />

                              Edit

                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(
                                  activity
                                )
                              }
                              disabled={
                                deletingId ===
                                activity.id
                              }
                              className="inline-flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Delete ${activity.title}`}
                            >

                              {deletingId ===
                              activity.id ? (
                                <Loader2
                                  size={
                                    16
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={
                                    16
                                  }
                                />
                              )}

                            </button>

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

          </section>

          {/* FOOTER */}

          <footer className="mt-8 border-t border-[#d9e6ec] py-6">

            <div className="flex flex-col justify-between gap-2 text-xs text-[#8ca0ad] sm:flex-row">

              <p>
                © 2026 CampusConnect.
                Smart Campus Management.
              </p>

              <p>
                Faculty Portal
              </p>

            </div>

          </footer>

        </div>

      </main>

      {/* ===================================================
          CREATE / EDIT MODAL
      ==================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#d8e5eb] bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dbe7ec] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3989b7]">
                  {editingId
                    ? "Edit Activity"
                    : "New Activity"}
                </p>

                <h2 className="mt-1 text-xl font-black text-[#172f40]">
                  {editingId
                    ? "Update Activity"
                    : "Create Activity"}
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e4e9] bg-white text-[#667d8a] transition hover:bg-[#f1f7f9] hover:text-[#203a4b]"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-5 sm:p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {/* TITLE */}

              <div>

                <label className="mb-2 block text-sm font-bold text-[#405b6b]">
                  Activity Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        title:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. Coding Workshop"
                  className="h-11 w-full rounded-xl border border-[#d7e4e9] bg-[#f7fbfc] px-4 text-sm font-medium text-[#243d4d] outline-none transition placeholder:text-[#91a3ae] focus:border-[#58bddd] focus:bg-white focus:ring-4 focus:ring-[#4bb9dc]/10"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-bold text-[#405b6b]">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Describe the activity..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#d7e4e9] bg-[#f7fbfc] px-4 py-3 text-sm font-medium text-[#243d4d] outline-none transition placeholder:text-[#91a3ae] focus:border-[#58bddd] focus:bg-white focus:ring-4 focus:ring-[#4bb9dc]/10"
                />

              </div>

              {/* VENUE / DATE */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-bold text-[#405b6b]">
                    Venue
                  </label>

                  <input
                    type="text"
                    value={
                      form.venue
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          venue:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. Seminar Hall"
                    className="h-11 w-full rounded-xl border border-[#d7e4e9] bg-[#f7fbfc] px-4 text-sm font-medium text-[#243d4d] outline-none transition placeholder:text-[#91a3ae] focus:border-[#58bddd] focus:bg-white focus:ring-4 focus:ring-[#4bb9dc]/10"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold text-[#405b6b]">
                    Activity Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.activityDate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          activityDate:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-[#d7e4e9] bg-[#f7fbfc] px-4 text-sm font-medium text-[#243d4d] outline-none transition focus:border-[#58bddd] focus:bg-white focus:ring-4 focus:ring-[#4bb9dc]/10"
                  />

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-[#e5edf1] pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d7e4e9] bg-white px-5 text-sm font-bold text-[#5b7180] transition hover:bg-[#f3f8fa] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#087493] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#06647e] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <ChevronRight
                      size={16}
                    />
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

      {/* ===================================================
          FACULTY ACTIVITY EFFECTS
      ==================================================== */}

      <style jsx>{`

        .faculty-activity-card {
          position: relative;
          overflow: hidden;
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            border-color 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease;
          will-change:
            transform,
            box-shadow,
            background;
        }

        .faculty-activity-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          opacity: 0;

          background:
            linear-gradient(
              135deg,
              rgba(84,188,229,.035) 0%,
              rgba(74,157,197,.065) 52%,
              rgba(54,132,177,.045) 100%
            );

          box-shadow:
            inset 0 0 0 1px
              rgba(84,188,229,.08);

          transition:
            opacity 220ms ease;
        }

        .faculty-activity-card > * {
          position: relative;
          z-index: 1;
        }

        .faculty-activity-card:hover,
        .faculty-activity-card:focus-within {
          transform:
            translate3d(0,-4px,0)
            scale(1.006);

          border-color:
            rgba(84,188,229,.55)
            !important;

          background:
            #fbfdfe;

          box-shadow:
            0 16px 34px
              rgba(15,23,42,.10),
            0 0 0 1px
              rgba(84,188,229,.10),
            0 0 26px
              rgba(84,188,229,.20),
            0 0 54px
              rgba(59,130,246,.08);

          z-index: 10;
        }

        .faculty-activity-card:hover::before,
        .faculty-activity-card:focus-within::before {
          opacity: 1;
        }

        .faculty-mini-box {
          position: relative;
          overflow: hidden;

          transition:
            transform 180ms
              cubic-bezier(.2,.8,.2,1),
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease,
            color 180ms ease;

          will-change:
            transform,
            box-shadow;
        }

        .faculty-activity-card:hover
          .faculty-mini-box:not(
            .faculty-time-box
          ),
        .faculty-activity-card:focus-within
          .faculty-mini-box:not(
            .faculty-time-box
          ) {

          transform:
            translate3d(0,-3px,0)
            scale(1.045);

          border-color:
            rgba(84,188,229,.80)
            !important;

          background:
            linear-gradient(
              112deg,
              #0f3146 0%,
              #185b79 52%,
              #298bb0 100%
            ) !important;

          color:
            #ffffff !important;

          box-shadow:
            0 8px 18px
              rgba(15,23,42,.12),
            0 0 0 1px
              rgba(84,188,229,.16),
            0 0 18px
              rgba(84,188,229,.28),
            0 0 34px
              rgba(59,130,246,.10);

          z-index: 20;
        }

        .faculty-time-box {
          transition: none !important;
        }

        .faculty-activity-card:hover
          .faculty-mini-box
          > *,
        .faculty-activity-card:focus-within
          .faculty-mini-box
          > * {

          color:
            #ffffff !important;

          transform:
            scale(1.06);
        }

        @media
          (prefers-reduced-motion: reduce) {

          .faculty-activity-card,
          .faculty-mini-box {
            transition:
              none !important;
          }
        }

      `}</style>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

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
  const [hovered, setHovered] =
    useState(false);

  return (
    <div
      className="rounded-2xl border bg-white p-5"
      onMouseEnter={() =>
        setHovered(true)
      }
      onMouseLeave={() =>
        setHovered(false)
      }
      onFocus={() =>
        setHovered(true)
      }
      onBlur={() =>
        setHovered(false)
      }
      style={{
        position:
          "relative",
        overflow:
          "hidden",

        transform:
          hovered
            ? "translate3d(0,-5px,0) scale(1.006)"
            : "translate3d(0,0,0) scale(1)",

        transformOrigin:
          "center",

        borderColor:
          hovered
            ? "rgba(84,188,229,.48)"
            : "rgb(216 227 237)",

        background:
          hovered
            ? "#fbfdff"
            : "#ffffff",

        boxShadow:
          hovered
            ? "0 16px 34px rgba(15,23,42,.10), 0 0 0 1px rgba(84,188,229,.10), 0 0 26px rgba(84,188,229,.16), 0 0 54px rgba(59,130,246,.08)"
            : "0 1px 2px rgba(15,23,42,.05)",

        transition:
          "transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, background 220ms ease, box-shadow 220ms ease",

        willChange:
          "transform, box-shadow",

        zIndex:
          hovered
            ? 10
            : 0,
      }}
    >

      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          inset: 0,

          borderRadius:
            "inherit",

          pointerEvents:
            "none",

          opacity:
            hovered
              ? 1
              : 0,

          background:
            "linear-gradient(135deg, rgba(84,188,229,.035) 0%, rgba(74,157,197,.065) 52%, rgba(54,132,177,.045) 100%)",

          boxShadow:
            "inset 0 0 0 1px rgba(84,188,229,.08)",

          transition:
            "opacity 220ms ease",
        }}
      />

      <div className="relative z-[1] flex items-start justify-between gap-4">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a9da9]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-[#183344]">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-[#8b9da8]">
            {description}
          </p>

        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl border"
          style={{
            position:
              "relative",

            overflow:
              "hidden",

            transform:
              hovered
                ? "translate3d(0,-5px,0) scale(1.11)"
                : "translate3d(0,0,0) scale(1)",

            background:
              hovered
                ? "linear-gradient(112deg, #0f3146 0%, #185b79 52%, #298bb0 100%)"
                : "#e7f7fb",

            color:
              hovered
                ? "#ffffff"
                : "#398fb5",

            borderColor:
              hovered
                ? "rgba(84,188,229,.90)"
                : "rgba(84,188,229,.24)",

            boxShadow:
              hovered
                ? "0 12px 24px rgba(15,23,42,.14), 0 0 0 1px rgba(84,188,229,.22), 0 0 24px rgba(84,188,229,.40), 0 0 58px rgba(59,130,246,.18)"
                : "0 1px 4px rgba(15,23,42,.06)",

            transition:
              "transform 180ms cubic-bezier(.2,.8,.2,1), border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, color 180ms ease",

            zIndex: 2,
          }}
        >

          <span
            className="relative z-[1]"
            style={{
              display:
                "inline-flex",

              transform:
                hovered
                  ? "scale(1.06)"
                  : "scale(1)",

              transition:
                "transform 180ms ease, color 180ms ease",
            }}
          >
            {icon}
          </span>

        </div>

      </div>
    </div>
  );
}