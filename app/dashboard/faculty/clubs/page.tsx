"use client";

import {
  Bell,
  Activity,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ======================================================
   TYPES
====================================================== */

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
  description?: string | null;
  logo?: string | null;
  category?: string | null;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
};

type ClubForm = {
  name: string;
  description: string;
  category: string;
  logo: string;
};

const EMPTY_FORM: ClubForm = {
  name: "",
  description: "",
  category: "",
  logo: "",
};

const defaultFaculty: FacultyUser = {
  id: "",
  name: "Faculty",
  email:
    "faculty@campusconnect.com",
  facultyId: "FACULTY",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
};

/* ======================================================
   NAVIGATION
====================================================== */

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
    icon: ClipboardCheck,
  },
  {
    title: "Events",
    href: "/dashboard/faculty/events",
    icon: CalendarDays,
  },
  {
    title: "Activities",
    href: "/dashboard/faculty/activities",
    icon: Activity,
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

/* ======================================================
   HELPERS
====================================================== */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getMemberCount(
  club: Club
) {
  if (
    typeof club.memberCount ===
      "number" &&
    Number.isFinite(
      club.memberCount
    )
  ) {
    return club.memberCount;
  }

  return 0;
}

/* ======================================================
   PAGE
====================================================== */

export default function FacultyClubsPage() {
  const router =
    useRouter();

  /* ==================================================
     FACULTY
  ================================================== */

  const [faculty, setFaculty] =
    useState<FacultyUser>(
      defaultFaculty
    );

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  /* ==================================================
     CLUB STATE
  ================================================== */

  const [clubs, setClubs] =
    useState<Club[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null
  );

  const [form, setForm] =
    useState<ClubForm>(
      EMPTY_FORM
    );

  /* ==================================================
     LOAD FACULTY
  ================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        try {
          const keys = [
            "facultyUser",
            "faculty",
            "currentFaculty",
            "user",
          ];

          for (
            const key of keys
          ) {
            const stored =
              localStorage.getItem(
                key
              );

            if (!stored) {
              continue;
            }

            try {
              const parsed =
                JSON.parse(
                  stored
                );

              if (
                parsed &&
                typeof parsed ===
                  "object" &&
                parsed.email
              ) {
                setFaculty({
                  id:
                    parsed.id ??
                    defaultFaculty.id,

                  name:
                    parsed.name ??
                    defaultFaculty.name,

                  email:
                    parsed.email ??
                    defaultFaculty.email,

                  facultyId:
                    parsed.facultyId ??
                    parsed.campusUserId ??
                    defaultFaculty.facultyId,

                  role:
                    parsed.role ??
                    defaultFaculty.role,

                  approvalStatus:
                    parsed.approvalStatus ??
                    defaultFaculty.approvalStatus,
                });

                break;
              }
            } catch {
              continue;
            }
          }
        } catch (loadError) {
          console.error(
            "FACULTY LOAD ERROR:",
            loadError
          );
        }
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, []);

  /* ==================================================
     FACULTY VALUES
  ================================================== */

  const facultyName =
    faculty.name ||
    "Faculty";

  const facultyRole =
    faculty.role ||
    "Faculty Member";

  const facultyId =
    faculty.facultyId ||
    "FACULTY";

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

  /* ==================================================
     FETCH CLUBS
  ================================================== */

  const fetchClubs =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          }

          const response =
            await fetch(
              "/api/faculty/clubs",
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
              .catch(
                () => ({})
              );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Failed to fetch clubs (${response.status}).`
            );
          }

          const receivedClubs =
            Array.isArray(
              data?.clubs
            )
              ? data.clubs
              : Array.isArray(
                  data?.data
                )
              ? data.data
              : [];

          setClubs(
            receivedClubs
          );
        } finally {
          if (showRefresh) {
            setRefreshing(false);
          }
        }
      },
      []
    );

  /* ==================================================
     INITIAL CLUB LOAD
  ================================================== */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");

        await fetchClubs();

        if (cancelled) {
          return;
        }
      } catch (
        fetchError
      ) {
        if (!cancelled) {
          console.error(
            "FACULTY FETCH CLUBS ERROR:",
            fetchError
          );

          setError(
            fetchError instanceof
              Error
              ? fetchError.message
              : "Failed to fetch clubs."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [fetchClubs]);

  /* ==================================================
     FILTER
  ================================================== */

  const filteredClubs =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return clubs;
      }

      return clubs.filter(
        (club) => {
          const name =
            club.name?.toLowerCase() ||
            "";

          const category =
            club.category?.toLowerCase() ||
            "";

          const description =
            club.description
              ?.toLowerCase() ||
            "";

          return (
            name.includes(
              value
            ) ||
            category.includes(
              value
            ) ||
            description.includes(
              value
            )
          );
        }
      );
    }, [clubs, search]);

  /* ==================================================
     STATS
  ================================================== */

  const totalClubs =
    clubs.length;

  const totalMembers =
    useMemo(() => {
      return clubs.reduce(
        (
          total,
          club
        ) =>
          total +
          getMemberCount(
            club
          ),
        0
      );
    }, [clubs]);

  /* ==================================================
     MODAL
  ================================================== */

  function openCreateModal() {
    setError("");
    setSuccess("");

    setIsEditing(false);
    setEditingId(null);

    setForm(
      EMPTY_FORM
    );

    setIsModalOpen(true);
  }

  function openEditModal(
    club: Club
  ) {
    setError("");
    setSuccess("");

    setIsEditing(true);
    setEditingId(
      club.id
    );

    setForm({
      name:
        club.name || "",

      description:
        club.description ||
        "",

      category:
        club.category ||
        "",

      logo:
        club.logo || "",
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);

    setIsEditing(false);

    setEditingId(null);

    setForm(
      EMPTY_FORM
    );
  }

  function updateForm(
    field: keyof ClubForm,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  /* ==================================================
     SUBMIT
  ================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const description =
      form.description.trim();

    const category =
      form.category.trim();

    const logo =
      form.logo.trim();

    if (!name) {
      setError(
        "Club name is required."
      );
      return;
    }

    if (!description) {
      setError(
        "Club description is required."
      );
      return;
    }

    try {
      setSaving(true);

      const endpoint =
        isEditing &&
        editingId
          ? `/api/faculty/clubs/${editingId}`
          : "/api/faculty/clubs";

      const method =
        isEditing
          ? "PUT"
          : "POST";

      const response =
        await fetch(
          endpoint,
          {
            method,

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                name,

                description,

                category:
                  category ||
                  null,

                logo:
                  logo ||
                  null,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isEditing
              ? "Failed to update club."
              : "Failed to create club.")
        );
      }

      setSuccess(
        isEditing
          ? "Club updated successfully."
          : "Club created successfully."
      );

      closeModal();

      await fetchClubs();
    } catch (
      submitError
    ) {
      console.error(
        "FACULTY CLUB SUBMIT ERROR:",
        submitError
      );

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to save club."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==================================================
     DELETE
  ================================================== */

  async function handleDelete(
    club: Club
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${club.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/faculty/clubs/${club.id}`,
          {
            method: "DELETE",
            credentials:
              "include",
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete club."
        );
      }

      setClubs(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              club.id
          )
      );

      setSuccess(
        "Club deleted successfully."
      );
    } catch (
      deleteError
    ) {
      console.error(
        "FACULTY DELETE CLUB ERROR:",
        deleteError
      );

      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Failed to delete club."
      );
    }
  }

  /* ==================================================
     IMAGE ERROR
  ================================================== */

  function handleImageError(
    event: React.SyntheticEvent<HTMLImageElement>
  ) {
    const image =
      event.currentTarget;

    image.style.display =
      "none";

    const parent =
      image.parentElement;

    if (parent) {
      parent.classList.add(
        "club-image-fallback"
      );
    }
  }

  /* ==================================================
     SIGN OUT
  ================================================== */

  async function handleSignOut() {
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
    } catch (
      logoutError
    ) {
      console.error(
        "FACULTY LOGOUT ERROR:",
        logoutError
      );
    }

    try {
      [
        "facultyUser",
        "faculty",
        "currentFaculty",
        "user",
        "facultyToken",
      ].forEach((key) => {
        localStorage.removeItem(
          key
        );
      });
    } catch (
      storageError
    ) {
      console.error(
        "FACULTY STORAGE CLEANUP ERROR:",
        storageError
      );
    }

    router.replace(
      "/faculty/login"
    );
  }

  /* ==================================================
     SKELETON
  ================================================== */

  function ClubSkeleton() {
    return (
      <div className="overflow-hidden rounded-[20px] border border-[#d8e3ed] bg-white shadow-sm">

        <div className="h-[275px] w-full animate-pulse bg-[#dce8f0]" />

        <div className="space-y-3 p-3">

          <div className="h-10 w-full animate-pulse rounded-lg bg-[#dce8f0]" />

          <div className="h-10 w-full animate-pulse rounded-lg bg-[#dce8f0]" />

          <div className="mx-auto h-3 w-28 animate-pulse rounded bg-[#dce8f0]" />

        </div>

      </div>
    );
  }

  /* ==================================================
     UI
  ================================================== */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#edf4fa] text-[#0d1728]">

      {/* ==================================================
          MOBILE OVERLAY
      ================================================== */}

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

      {/* ==================================================
          SIDEBAR
      ================================================== */}

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

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#54bce5] shadow-[0_8px_25px_rgba(84,188,229,0.25)]">

              <GraduationCap
                size={25}
                strokeWidth={2}
              />

            </div>

            <div className="min-w-0">

              <h1 className="font-serif text-[19px] font-bold text-white">
                CampusConnect
              </h1>

              <p className="mt-0.5 text-[11px] text-[#91a4bb]">
                Faculty Portal
              </p>

            </div>

          </div>

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
                  item.href ===
                  "/dashboard/faculty/clubs";

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
                        size={16}
                        className="ml-auto text-[#63c9ef]"
                      />
                    )}

                  </Link>
                );
              }
            )}

          </nav>

          <nav className="mt-7 border-t border-[#223149] pt-5 space-y-1.5">

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#63758d]">
              Account
            </p>

            <Link
              href="/faculty/security"
              onClick={() =>
                setMobileSidebarOpen(false)
              }
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
            >

              <Settings
                size={18}
                strokeWidth={1.8}
                className="text-[#8195ad] group-hover:text-[#63c9ef]"
              />

              <span>
                Settings
              </span>

            </Link>

            <button
              type="button"
              onClick={
                handleSignOut
              }
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] hover:bg-[#142135] hover:text-white"
            >

              <LogOut
                size={18}
                strokeWidth={1.8}
                className="text-[#8195ad] group-hover:text-[#63c9ef]"
              />

              <span>
                Sign Out
              </span>

            </button>

          </nav>

        </div>

        {/* USER */}

        <div className="shrink-0 border-t border-[#223149] p-4">

          <div className="flex items-center gap-3 rounded-2xl bg-[#111e2f] px-3.5 py-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#54bce5] text-[12px] font-bold">
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

      {/* ==================================================
          MAIN
      ================================================== */}

      <div className="min-h-screen w-full min-w-0 lg:pl-[270px]">

        {/* ==================================================
            MOBILE MENU BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open sidebar"
          className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white/95 text-[#263a53] shadow-lg backdrop-blur-xl lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <main className="relative min-h-screen w-full overflow-hidden bg-[#edf4fa] px-4 py-5 sm:px-6 lg:px-7">

          {/* BACKGROUND */}

          <div className="pointer-events-none absolute inset-0 opacity-60">

            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.07) 1px, transparent 1px)",
                backgroundSize:
                  "42px 42px",
              }}
            />

            <div className="absolute left-[20%] top-[8%] h-[450px] w-[450px] rounded-full bg-[#dceef8] opacity-50 blur-3xl" />

            <div className="absolute right-[5%] top-[30%] h-[350px] w-[350px] rounded-full bg-[#e4f2f9] opacity-60 blur-3xl" />

          </div>

          <div className="relative w-full">

            {/* ==================================================
                HERO
            ================================================== */}

            <section className="group/hero relative flex h-[280px] w-full items-center justify-between overflow-hidden rounded-[24px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-6 text-white shadow-[0_18px_45px_rgba(10,27,48,0.18)] transition-all duration-500 hover:shadow-[0_25px_60px_rgba(10,27,48,0.22)] sm:px-9 lg:px-11">

              <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#54bce5]/20 transition-transform duration-700 group-hover/hero:scale-110" />

              <div className="pointer-events-none absolute right-[-20px] top-16 h-40 w-40 rounded-full border border-[#54bce5]/10 transition-transform duration-700 group-hover/hero:scale-110" />

              <div className="pointer-events-none absolute right-[16%] bottom-[-110px] h-64 w-64 rounded-full border border-[#54bce5]/10" />

              <div className="relative z-10 max-w-[850px]">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#76d0f1]">
                  <Users size={14} />
                  Faculty Club Management
                </div>

                <h1 className="font-serif text-[34px] font-bold leading-[1.03] tracking-[-0.03em] text-white sm:text-[43px] lg:text-[50px]">
                  Manage campus
                  <br />
                  <span className="text-[#69c9ed]">
                    clubs with ease.
                  </span>
                </h1>

                <p className="mt-4 max-w-[760px] text-[12px] leading-5 text-[#d2dce8] sm:text-[13px]">
                  Create, update and manage campus clubs from one focused Faculty workspace.
                  Every change stays synced with the shared club records used across CampusConnect.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#49c997]/30 bg-[#49c997]/10 px-3 py-1.5 text-[10px] font-semibold text-[#8ee4c3]">
                    <CheckCircle2 size={13} />
                    Faculty Access
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium text-[#d6e0ed]">
                    <UserCircle size={13} />
                    Faculty ID:
                    <span className="font-bold text-white">
                      {facultyId}
                    </span>
                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="group/create relative hidden shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3 text-[12px] font-bold text-[#243a75] shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#f7fbff] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)] lg:inline-flex"
              >
                <span className="absolute inset-0 -translate-x-full bg-[#54bce5]/10 transition-transform duration-500 group-hover/create:translate-x-full" />
                <Plus size={16} className="relative" />
                <span className="relative">Create Club</span>
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="absolute bottom-6 right-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[11px] font-bold text-[#243a75] shadow-[0_8px_22px_rgba(0,0,0,0.15)] transition-all duration-300 hover:bg-[#f7fbff] lg:hidden"
              >
                <Plus size={15} />
                Create Club
              </button>

            </section>

            {/* ==================================================
                STATS
            ================================================== */}

            <section className="mt-5 grid w-full grid-cols-1 gap-4 md:grid-cols-2">

              <div className="group rounded-[19px] border border-[#d8e3ed] bg-white p-5 shadow-[0_7px_22px_rgba(30,60,90,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#b9d8e9] hover:shadow-[0_14px_30px_rgba(30,70,100,0.10)]">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-[11px] font-medium text-[#687c93]">
                      Total Clubs
                    </p>

                    <p className="mt-2 font-serif text-[31px] font-bold leading-none text-[#0b1728]">
                      {loading
                        ? "..."
                        : totalClubs}
                    </p>

                    <p className="mt-3 text-[10px] leading-5 text-[#7890a8]">
                      Communities available
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#53a7d4] transition group-hover:bg-[#54bce5] group-hover:text-white">
                    <Users
                      size={19}
                    />
                  </div>

                </div>

              </div>

              <div className="group rounded-[19px] border border-[#d8e3ed] bg-white p-5 shadow-[0_7px_22px_rgba(30,60,90,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#b9d8e9] hover:shadow-[0_14px_30px_rgba(30,70,100,0.10)]">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-[11px] font-medium text-[#687c93]">
                      Total Members
                    </p>

                    <p className="mt-2 font-serif text-[31px] font-bold leading-none text-[#0b1728]">
                      {loading
                        ? "..."
                        : totalMembers}
                    </p>

                    <p className="mt-3 text-[10px] leading-5 text-[#7890a8]">
                      Students participating
                    </p>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#53a7d4] transition group-hover:bg-[#54bce5] group-hover:text-white">
                    <Users
                      size={19}
                    />
                  </div>

                </div>

              </div>

            </section>

            {/* ==================================================
                SEARCH + CREATE
            ================================================== */}

            <section className="mt-5">

              <div className="relative">

                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8da1b6]"
                />

                <input
                  type="text"
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Search clubs by name, category or description..."
                  className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-white pl-11 pr-4 text-xs text-[#203149] outline-none transition placeholder:text-[#8ca0b4] focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10"
                />

              </div>

            </section>

            {/* ==================================================
                MESSAGES
            ================================================== */}

            {error && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                  className="rounded-lg p-1.5 hover:bg-red-100"
                >
                  <X size={16} />
                </button>

              </div>
            )}

            {success && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#cdebdc] bg-[#f1faf5] px-4 py-3 text-xs text-[#31986d]">

                <div className="flex items-center gap-2">

                  <Check
                    size={16}
                  />

                  <span>
                    {success}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSuccess("")
                  }
                  className="rounded-lg p-1.5 hover:bg-[#e0f4e9]"
                >
                  <X size={16} />
                </button>

              </div>
            )}

            {/* ==================================================
                TOOLBAR
            ================================================== */}

            {/* ==================================================
                CLUB GRID
            ================================================== */}

            {loading ? (
              <section className="mt-4 grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">

                {Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <ClubSkeleton
                      key={
                        index
                      }
                    />
                  )
                )}

              </section>
            ) : filteredClubs.length ===
              0 ? (
              <section className="mt-4 rounded-[20px] border border-[#d8e3ed] bg-white px-5 py-14 text-center shadow-[0_8px_25px_rgba(30,60,90,0.05)]">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf7fc] text-[#53a7d4]">

                  <Users
                    size={24}
                  />

                </div>

                <h3 className="mt-4 text-lg font-bold text-[#142238]">
                  {search
                    ? "No clubs found"
                    : "No clubs available"}
                </h3>

                <p className="mt-2 text-sm text-[#72849a]">
                  {search
                    ? "Try another search term."
                    : "Create your first club to get started."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={
                      openCreateModal
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#54bce5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3da8d4]"
                  >

                    <Plus
                      size={16}
                    />

                    Create Club

                  </button>
                )}

              </section>
            ) : (
              <section className="mt-4 grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">

                {filteredClubs.map(
                  (club) => (
                    <article
                      key={
                        club.id
                      }
                      className="group flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#d8e3ed] bg-white shadow-[0_7px_22px_rgba(30,60,90,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#b9d8e9] hover:shadow-[0_18px_35px_rgba(30,70,100,0.12)]"
                    >

                      {/* IMAGE */}

                      <div className="relative h-[275px] w-full overflow-hidden bg-[#0b1423]">

                        {club.logo ? (
                          <img
                            src={
                              club.logo
                            }
                            alt={`${club.name} logo`}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            onError={
                              handleImageError
                            }
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#0b1423]">

                            <div className="text-center text-white">

                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#54bce5]/30 bg-[#54bce5]/10">

                                <ImageIcon
                                  size={31}
                                  className="text-[#67bfe6]"
                                />

                              </div>

                              <p className="mt-4 text-sm font-semibold">
                                {
                                  club.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-white/60">
                                Club Image
                              </p>

                            </div>

                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                        <div className="absolute left-4 top-4 rounded-full border border-[#54bce5]/20 bg-[#0b1423]/90 px-3 py-1.5 text-[10px] font-semibold text-[#8fdbf5] backdrop-blur-sm">

                          {
                            club.category ||
                            "Club"
                          }

                        </div>

                        <div className="absolute bottom-4 left-4 right-4">

                          <div className="flex items-end justify-between gap-3">

                            <h3 className="min-w-0 truncate text-2xl font-bold text-white drop-shadow-md">
                              {
                                club.name
                              }
                            </h3>

                            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm">

                              <Users
                                size={12}
                              />

                              {
                                getMemberCount(
                                  club
                                )
                              }

                            </div>

                          </div>

                        </div>

                      </div>

                      {/* DESCRIPTION */}

                      <div className="p-4">

                        <p className="line-clamp-3 text-xs leading-5 text-[#72849a]">

                          {club.description ||
                            "No description available."}

                        </p>

                      </div>

                      {/* ACTIONS */}

                      <div className="grid grid-cols-2 gap-2 border-t border-[#edf1f5] p-3">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              club
                            )
                          }
                          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#b9ddeb] bg-[#eef8fc] px-3 text-xs font-semibold text-[#3989b7] transition hover:bg-[#e0f3fa]"
                        >

                          <Pencil
                            size={16}
                          />

                          Edit

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              club
                            )
                          }
                          className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                        >

                          <Trash2
                            size={16}
                          />

                          Delete

                        </button>

                      </div>

                      <div className="px-4 pb-4">

                        <p className="text-center text-[10px] text-[#8a9bae]">

                          Created{" "}

                          {formatDate(
                            club.createdAt
                          )}

                        </p>

                      </div>

                    </article>
                  )
                )}

              </section>
            )}

            <div className="h-8" />

          </div>

        </main>

      </div>

      {/* ==================================================
          CREATE / EDIT MODAL
      ================================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-[#07111f]/70 px-3 py-5 backdrop-blur-sm sm:items-center sm:py-6">

          <div className="my-auto max-h-[calc(100vh-40px)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#dce6f0] px-5 py-4">

              <div>

                <h2 className="text-xl font-bold text-[#142238]">
                  {isEditing
                    ? "Edit Club"
                    : "Create Club"}
                </h2>

                <p className="mt-1 text-sm text-[#72849a]">
                  {isEditing
                    ? "Update club information."
                    : "Add a new college club."}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#72849a] transition hover:bg-[#edf4fa] hover:text-[#142238] disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-5"
            >

              <div className="space-y-5">

                {/* NAME */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-[#344860]">
                    Club Name *
                  </label>

                  <input
                    type="text"
                    value={
                      form.name
                    }
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Coding Club"
                    disabled={
                      saving
                    }
                    className="w-full rounded-lg border border-[#d8e3ed] px-3 py-2.5 text-sm text-[#203149] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:bg-[#f7fafc]"
                  />

                </div>

                {/* CATEGORY + LOGO */}

                <div className="grid gap-4 md:grid-cols-2">

                  <div>

                    <label className="mb-1.5 block text-xs font-semibold text-[#344860]">
                      Category
                    </label>

                    <input
                      type="text"
                      value={
                        form.category
                      }
                      onChange={(event) =>
                        updateForm(
                          "category",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Technology"
                      disabled={
                        saving
                      }
                      className="w-full rounded-lg border border-[#d8e3ed] px-3 py-2.5 text-sm text-[#203149] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:bg-[#f7fafc]"
                    />

                  </div>

                  <div>

                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#344860]">

                      <ImageIcon
                        size={15}
                      />

                      Image URL

                    </label>

                    <input
                      type="url"
                      value={
                        form.logo
                      }
                      onChange={(event) =>
                        updateForm(
                          "logo",
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      disabled={
                        saving
                      }
                      className="w-full rounded-lg border border-[#d8e3ed] px-3 py-2.5 text-sm text-[#203149] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:bg-[#f7fafc]"
                    />

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-[#344860]">
                    Description *
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    rows={6}
                    placeholder="Describe the club..."
                    disabled={
                      saving
                    }
                    className="w-full resize-none rounded-lg border border-[#d8e3ed] px-3 py-2.5 text-sm text-[#203149] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:bg-[#f7fafc]"
                  />

                </div>

                {/* PREVIEW */}

                <div>

                  <p className="mb-2 text-xs font-semibold text-[#344860]">
                    Image Preview
                  </p>

                  <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-[#0b1423]">

                    {form.logo ? (
                      <img
                        src={
                          form.logo
                        }
                        alt="Club preview"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={
                          handleImageError
                        }
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">

                        <div className="text-center text-white/70">

                          <ImageIcon
                            size={36}
                            className="mx-auto text-[#67bfe6]"
                          />

                          <p className="mt-3 text-sm">
                            Club Image Preview
                          </p>

                        </div>

                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-6 flex justify-end gap-2 border-t border-[#edf1f5] pt-4">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-lg border border-[#d8e3ed] bg-white px-4 py-2.5 text-xs font-semibold text-[#344860] transition hover:bg-[#f7fafc] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex min-w-[145px] items-center justify-center gap-2 rounded-lg bg-[#54bce5] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3da8d4] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      {isEditing
                        ? "Saving..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      {isEditing ? (
                        <Check
                          size={16}
                        />
                      ) : (
                        <Plus
                          size={16}
                        />
                      )}

                      {isEditing
                        ? "Save Changes"
                        : "Create Club"}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
          GLOBAL CSS
      ================================================== */}

      <style jsx global>{`
        .club-image-fallback {
          background: #0b1423 !important;
        }

        .club-image-fallback::after {
          content: "";
          position: absolute;
          inset: 0;
          background: #0b1423;
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