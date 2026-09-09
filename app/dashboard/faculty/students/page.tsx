"use client";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
  X,
  BookOpen,
  Mail,
  MapPin,
  Award,
  Trophy,
  Clock3,
  type LucideIcon,
} from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// ============================================================
// TYPES
// ============================================================

type Subject = {
  id: string;
  name: string;
  semester: number;
};

type Registration = {
  id: string;
  semester: number;
  section: string;
  createdAt: string;
  subject: Subject;
};

type ClassAttendance = {
  id: string;
  status: string;
  markedAt: string;
  updatedAt: string;
  subjectId: string;

  subject: Subject;

  session: {
    id: string;
    semester: number;
    section: string;
    sessionDate: string;
    faculty: {
      id: string;
      name: string;
      email: string;
    };
  };
};

type EventAttendance = {
  id: string;
  status: string;
  markedAt: string;
  updatedAt: string;

  event: {
    id: string;
    title: string;
    description: string;
    venue: string;
    eventDate: string;
    image: string | null;

    club: {
      id: string;
      name: string;
    };
  };
};

type Certificate = {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
};

type Membership = {
  id: string;
  joinedAt: string;

  club: {
    id: string;
    name: string;
    description: string;
    category: string | null;
    logo: string | null;
  };
};

type Student = {
  id: string;
  campusUserId: string | null;
  name: string;
  email: string;
  profileImage: string | null;

  role: string;
  approvalStatus: string;

  approvedAt: string | null;
  rejectionReason: string | null;

  createdAt: string;
  updatedAt: string;

  department: string | null;
  designation: string | null;
  phone: string | null;
  qualification: string | null;
  specialization: string | null;
  joiningDate: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  officeRoom: string | null;
  officeHours: string | null;

  studentRegistrations: Registration[];

  classAttendances: ClassAttendance[];

  attendances: EventAttendance[];

  certificates: Certificate[];

  memberships: Membership[];

  statistics: {
    subjectCount: number;

    classAttendanceTotal: number;
    classAttendancePresent: number;
    classAttendanceAbsent: number;
    classAttendancePercentage: number;

    eventAttendanceTotal: number;
    eventAttendancePresent: number;

    certificateCount: number;
    clubCount: number;
  };
};

type Faculty = {
  id: string;
  name: string;
  email: string;
};

// ============================================================
// NAVIGATION
// ============================================================

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

// ============================================================
// SAFE API TYPES
// ============================================================

type StudentsApiResponse = {
  success?: boolean;
  message?: string;
  students?: Student[];
};

type DeleteApiResponse = {
  success?: boolean;
  message?: string;
};

const defaultStatistics: Student["statistics"] = {
  subjectCount: 0,
  classAttendanceTotal: 0,
  classAttendancePresent: 0,
  classAttendanceAbsent: 0,
  classAttendancePercentage: 0,
  eventAttendanceTotal: 0,
  eventAttendancePresent: 0,
  certificateCount: 0,
  clubCount: 0,
};

function normalizeStudent(student: Student): Student {
  const raw = student as Student & Record<string, unknown>;
  const rawRegistrations = Array.isArray(raw.studentRegistrations)
    ? raw.studentRegistrations
    : [];
  const rawClassAttendances = Array.isArray(raw.classAttendances)
    ? raw.classAttendances
    : [];
  const rawEventAttendances = Array.isArray(raw.attendances)
    ? raw.attendances
    : [];
  const rawCertificates = Array.isArray(raw.certificates)
    ? raw.certificates
    : [];
  const rawMemberships = Array.isArray(raw.memberships)
    ? raw.memberships
    : [];

  const registrations = rawRegistrations
    .filter((item): item is Registration => Boolean(item && typeof item === "object"))
    .map((item) => ({
      ...item,
      subject: item.subject ?? {
        id: "unknown-subject",
        name: "Unknown Subject",
        semester: Number(item.semester) || 0,
      },
    }));

  const classAttendances = rawClassAttendances
    .filter((item): item is ClassAttendance => Boolean(item && typeof item === "object"))
    .map((item) => ({
      ...item,
      subject: item.subject ?? {
        id: item.subjectId || "unknown-subject",
        name: "Unknown Subject",
        semester: 0,
      },
      session: item.session ?? {
        id: "unknown-session",
        semester: 0,
        section: "-",
        sessionDate: item.markedAt || "",
        faculty: { id: "", name: "Unknown Faculty", email: "" },
      },
    }));

  const attendances = rawEventAttendances
    .filter((item): item is EventAttendance => Boolean(item && typeof item === "object"))
    .map((item) => ({
      ...item,
      event: item.event ?? {
        id: "unknown-event",
        title: "Unknown Event",
        description: "",
        venue: "Not available",
        eventDate: item.markedAt || "",
        image: null,
        club: { id: "", name: "Unknown Club" },
      },
    }));

  const memberships = rawMemberships
    .filter((item): item is Membership => Boolean(item && typeof item === "object"))
    .map((item) => ({
      ...item,
      club: item.club ?? {
        id: "unknown-club",
        name: "Unknown Club",
        description: "",
        category: null,
        logo: null,
      },
    }));

  return {
    ...student,
    studentRegistrations: registrations,
    classAttendances,
    attendances,
    certificates: rawCertificates as Certificate[],
    memberships,
    statistics: {
      ...defaultStatistics,
      ...(student.statistics ?? {}),
    },
  };
}

// ============================================================
// FACULTY STORAGE
// ============================================================

function getStoredFaculty(): Faculty | null {
  if (typeof window === "undefined") {
    return null;
  }

  const possibleKeys = [
    "facultyUser",
    "faculty",
    "currentFaculty",
    "user",
  ];

  for (const key of possibleKeys) {
    const stored = localStorage.getItem(key);

    if (!stored) {
      continue;
    }

    try {
      const parsed = JSON.parse(stored);

      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.id
      ) {
        const role = String(parsed.role || "")
          .trim()
          .toUpperCase();

        if (role === "FACULTY") {
          return {
            id: String(parsed.id),
            name: String(parsed.name || "Faculty"),
            email: String(parsed.email || ""),
          };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ============================================================
// PAGE
// ============================================================

export default function FacultyStudentsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [faculty, setFaculty] = useState<Faculty | null>(null);

  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [deleteStudent, setDeleteStudent] =
    useState<Student | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  // ==========================================================
  // ACTIVE NAV
  // ==========================================================

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard/faculty") {
        return pathname === href;
      }

      return (
        pathname === href ||
        pathname.startsWith(`${href}/`)
      );
    },
    [pathname]
  );

  // ==========================================================
  // LOAD STUDENTS
  // ==========================================================

  const loadStudents = useCallback(
    async (showRefresh = false) => {
      if (!faculty?.id) {
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      try {
        const response = await fetch(
          `/api/faculty/students${
            search.trim()
              ? `?search=${encodeURIComponent(
                  search.trim()
                )}`
              : ""
          }`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              "x-faculty-id": faculty.id,
            },
          }
        );

        let data: StudentsApiResponse = {};

        try {
          data = (await response.json()) as StudentsApiResponse;
        } catch {
          data = {};
        }

        if (!response.ok || data.success !== true) {
          throw new Error(
            data.message ||
              `Unable to load students (HTTP ${response.status}).`
          );
        }

        const loadedStudents = Array.isArray(data.students)
          ? data.students
          : [];

        setStudents(
          loadedStudents.map(normalizeStudent)
        );
      } catch (err) {
        console.error(
          "Faculty students load error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load students."
        );

        setStudents([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [faculty, search]
  );

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const storedFaculty = getStoredFaculty();

      if (cancelled) {
        return;
      }

      if (!storedFaculty?.id) {
        setError(
          "Faculty information was not found. Please login again."
        );
        setLoading(false);
        return;
      }

      setFaculty(storedFaculty);
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // LOAD AFTER FACULTY IS READY
  // ==========================================================

  useEffect(() => {
    if (!faculty?.id) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [faculty, loadStudents]);

  // ==========================================================
  // DELETE
  // ==========================================================

  const confirmDelete = async () => {
    if (!faculty?.id || !deleteStudent) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/faculty/students",
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-faculty-id": faculty.id,
          },
          body: JSON.stringify({
            studentId: deleteStudent.id,
          }),
        }
      );

      let data: DeleteApiResponse = {};

      try {
        data = (await response.json()) as DeleteApiResponse;
      } catch {
        data = {};
      }

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message ||
            `Unable to delete student (HTTP ${response.status}).`
        );
      }

      setStudents((current) =>
        current.filter(
          (student) =>
            student.id !== deleteStudent.id
        )
      );

      setSelectedStudent(null);

      setSuccess(
        `${deleteStudent.name} has been deleted successfully.`
      );

      setDeleteStudent(null);
    } catch (err) {
      console.error(
        "Faculty student delete error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete student."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // SIGN OUT
  // ==========================================================

  const handleSignOut = () => {
    try {
      localStorage.removeItem("facultyUser");
      localStorage.removeItem("faculty");
      localStorage.removeItem("currentFaculty");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("facultyToken");
    } catch {
      // ignore
    }

    router.push("/faculty/login");
  };

  // ==========================================================
  // FILTERED STUDENTS
  // ==========================================================

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return students;
    }

    return students.filter((student) => {
      const registrations = Array.isArray(
        student.studentRegistrations
      )
        ? student.studentRegistrations
        : [];

      const subjects = registrations
        .map((item) => item.subject?.name ?? "")
        .join(" ");

      const sections = registrations
        .map((item) => item.section ?? "")
        .join(" ");

      return (
        student.name
          .toLowerCase()
          .includes(term) ||
        student.email
          .toLowerCase()
          .includes(term) ||
        (student.campusUserId || "")
          .toLowerCase()
          .includes(term) ||
        subjects
          .toLowerCase()
          .includes(term) ||
        sections
          .toLowerCase()
          .includes(term) ||
        (student.department || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [students, search]);

  // ==========================================================
  // FACULTY DISPLAY
  // ==========================================================

  const facultyName =
    faculty?.name || "Faculty Portal";

  const initials =
    facultyName
      .split(" ")
      .filter(Boolean)
      .map((part) =>
        part.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FC";

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#edf4fa] text-[#102033]">
      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setMobileSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-[#23344d] bg-[#0b1423] text-white shadow-[8px_0_35px_rgba(5,15,30,0.16)] transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* LOGO */}

        <div className="flex h-[86px] shrink-0 items-center justify-between border-b border-[#223149] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#54bce5]">
              <GraduationCap size={24} />
            </div>

            <div>
              <h1 className="font-serif text-[18px] font-bold text-white">
                CampusConnect
              </h1>

              <p className="mt-0.5 text-[10px] text-[#91a4bb]">
                Faculty Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className="rounded-lg p-2 text-[#8fa3bb] hover:bg-white/10 lg:hidden"
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
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(
                item.href
              );

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMobileSidebarOpen(false)
                  }
                  className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium transition ${
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

                  <span>
                    {item.title}
                  </span>

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
            {accountNavigation.map(
              (item) => {
                const Icon = item.icon;
                const active = isActive(
                  item.href
                );

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium transition ${
                      active
                        ? "bg-[#17263a] text-[#64c8ee]"
                        : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                    />

                    <span>
                      {item.title}
                    </span>
                  </Link>
                );
              }
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] hover:bg-[#142135] hover:text-white"
            >
              <LogOut
                size={18}
                strokeWidth={1.8}
              />

              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* FACULTY CARD */}

        <div className="shrink-0 border-t border-[#223149] p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#111e2f] px-3.5 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#54bce5] text-[12px] font-bold">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">
                {facultyName}
              </p>

              <p className="truncate text-[10px] text-[#8296ae]">
                Faculty Portal
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <div className="min-h-screen w-full min-w-0 lg:pl-[270px]">
        {/* HEADER */}

        <header className="sticky top-0 z-30 h-[78px] w-full border-b border-[#dce6f0] bg-white/95 backdrop-blur-xl">
          <div className="flex h-full w-full items-center justify-between px-5 sm:px-7">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(true)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3985b6]">
                  Faculty Portal
                </p>

                <p className="mt-1 text-[11px] text-[#71839a]">
                  Student Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm"
              >
                <Bell size={18} />

                <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#54bce5]" />
              </button>

              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm sm:flex"
              >
                <Settings size={18} />
              </button>

              <div className="hidden h-8 w-px bg-[#dce6f0] sm:block" />

              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#69acd2] text-[12px] font-bold text-white">
                  {initials}
                </div>

                <div>
                  <p className="text-[12px] font-semibold">
                    {facultyName}
                  </p>

                  <p className="text-[10px] text-[#72849a]">
                    Faculty
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <main className="relative min-h-[calc(100vh-78px)] w-full overflow-hidden bg-[#edf4fa] px-4 py-6 sm:px-6 lg:px-7 xl:px-8">
          {/* GRID BACKGROUND */}

          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.065) 1px, transparent 1px)",
                backgroundSize:
                  "42px 42px",
              }}
            />
          </div>

          <div className="relative mx-auto w-full max-w-[1550px]">
            {/* =================================================
                TOP
            ================================================= */}

            <section className="mb-5">
              <div className="mb-4">
                <Link
                  href="/dashboard/faculty"
                  className="inline-flex items-center gap-2 text-[11px] font-medium text-[#4d83aa] hover:text-[#1e648f]"
                >
                  <ArrowLeft size={14} />
                  Back to Faculty Dashboard
                </Link>
              </div>

              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#bcdff3] bg-[#f3faff] px-3 py-1.5 text-[10px] font-semibold text-[#3988b8]">
                    <Users size={13} />
                    Student Management
                  </div>

                  <h1 className="font-serif text-[34px] font-bold tracking-[-0.025em] text-[#102033] sm:text-[40px]">
                    Students
                  </h1>

                  <p className="mt-2 max-w-[720px] text-[12px] leading-5 text-[#6d8197] sm:text-[13px]">
                    View and manage approved students
                    registered in CampusConnect. Open a
                    student profile to view complete
                    academic, registration and attendance
                    information.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-[#d7e3ed] bg-white px-4 py-2.5 shadow-sm">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-[#7b8fa3]">
                      Approved Students
                    </p>

                    <p className="mt-0.5 text-[18px] font-bold text-[#142238]">
                      {students.length}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void loadStudents(true)
                    }
                    disabled={loading || refreshing}
                    className="inline-flex h-[47px] items-center gap-2 rounded-xl border border-[#d7e3ed] bg-white px-4 text-[11px] font-semibold text-[#46637e] shadow-sm transition hover:border-[#9ccbe6] hover:text-[#2479aa] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={15}
                      className={
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    />

                    Refresh
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-[#f2caca] bg-[#fff6f6] px-4 py-3 text-[11px] text-[#b13c3c]">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                  className="rounded-lg p-1 hover:bg-red-100"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-[#ccebdc] bg-[#f3fbf7] px-4 py-3 text-[11px] text-[#287a58]">
                <span>{success}</span>

                <button
                  type="button"
                  onClick={() =>
                    setSuccess("")
                  }
                  className="rounded-lg p-1 hover:bg-green-100"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* =================================================
                SEARCH
            ================================================= */}

            <section className="mb-5 rounded-[18px] border border-[#d7e3ed] bg-white p-3 shadow-[0_7px_25px_rgba(30,60,90,0.045)]">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8da1b4]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search by name, email, Campus User ID, department, subject, section..."
                  className="h-12 w-full rounded-xl border border-[#dce7ef] bg-[#fbfdff] pl-11 pr-4 text-[12px] text-[#25384d] outline-none transition placeholder:text-[#9badbe] focus:border-[#8fc8e6] focus:ring-4 focus:ring-[#54bce5]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8195a9] hover:bg-[#eef5fa]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </section>

            {/* =================================================
                DIRECTORY
            ================================================= */}

            <section className="overflow-hidden rounded-[20px] border border-[#d5e1eb] bg-white shadow-[0_9px_30px_rgba(30,60,90,0.055)]">
              {/* DIRECTORY HEADER */}

              <div className="flex flex-col gap-3 border-b border-[#e2e9ef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-[18px] font-bold text-[#15263a]">
                    Student Directory
                  </h2>

                  <p className="mt-1 text-[10px] text-[#7b8fa2]">
                    {filteredStudents.length} approved{" "}
                    {filteredStudents.length === 1
                      ? "student"
                      : "students"}{" "}
                    found
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ccebdc] bg-[#f3fbf7] px-3 py-1.5 text-[10px] font-semibold text-[#31815f]">
                  <CheckCircle2 size={13} />
                  Approved Accounts Only
                </div>
              </div>

              {/* LOADING */}

              {loading ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center">
                  <Loader2
                    size={30}
                    className="animate-spin text-[#54bce5]"
                  />

                  <p className="mt-4 text-[12px] font-semibold text-[#536b83]">
                    Loading students...
                  </p>

                  <p className="mt-1 text-[10px] text-[#8da0b2]">
                    Fetching complete student records
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                /* EMPTY */

                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef5fa] text-[#88a0b6]">
                    <Users size={28} />
                  </div>

                  <h3 className="mt-5 font-serif text-[17px] font-bold text-[#24374c]">
                    No approved students
                  </h3>

                  <p className="mt-2 max-w-[400px] text-[11px] leading-5 text-[#8194a7]">
                    {search
                      ? "No approved students match your search."
                      : "There are currently no approved student accounts available."}
                  </p>
                </div>
              ) : (
                /* STUDENT LIST */

                <div className="divide-y divide-[#e7edf2]">
                  {filteredStudents.map(
                    (student) => (
                      <StudentRow
                        key={student.id}
                        student={student}
                        onView={() =>
                          setSelectedStudent(
                            student
                          )
                        }
                        onDelete={() =>
                          setDeleteStudent(
                            student
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>

            <footer className="py-8 text-center text-[10px] text-[#8194a7]">
              © 2026 CampusConnect. Smart Campus
              Management.
            </footer>
          </div>
        </main>
      </div>

      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() =>
            setSelectedStudent(null)
          }
          onDelete={() => {
            setDeleteStudent(
              selectedStudent
            );
            setSelectedStudent(null);
          }}
        />
      )}

      {/* ======================================================
          DELETE MODAL
      ====================================================== */}

      {deleteStudent && (
        <DeleteModal
          student={deleteStudent}
          loading={deleting}
          onCancel={() =>
            setDeleteStudent(null)
          }
          onConfirm={() =>
            void confirmDelete()
          }
        />
      )}
    </div>
  );
}

// ============================================================
// STUDENT ROW
// ============================================================

function StudentRow({
  student,
  onView,
  onDelete,
}: {
  student: Student;
  onView: () => void;
  onDelete: () => void;
}) {
  const registrations =
    Array.isArray(student.studentRegistrations)
      ? student.studentRegistrations
      : [];

  const statistics = {
    ...defaultStatistics,
    ...(student.statistics ?? {}),
  };

  const firstRegistration =
    registrations[0];

  const uniqueSubjects =
    Array.from(
      new Map(
        registrations.map(
          (registration) => [
            registration.subject?.id ?? `registration-${registration.id}`,
            registration.subject ?? { id: "unknown-subject", name: "Unknown Subject", semester: registration.semester },
          ]
        )
      ).values()
    );

  const semester =
    firstRegistration?.semester
      ? `Semester ${firstRegistration.semester}`
      : "Not assigned";

  const sections = Array.from(
    new Set(
      registrations.map(
        (registration) =>
          registration.section
      )
    )
  );

  const section =
    sections.length > 0
      ? sections.join(", ")
      : "Not assigned";

  return (
    <div className="group px-4 py-4 transition hover:bg-[#fbfdff] sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        {/* STUDENT */}

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dce9f2] bg-[#eff7fc] text-[#4699c7]">
            {student.profileImage ? (
              <img
                src={student.profileImage}
                alt={student.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle size={21} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[13px] font-bold text-[#17283c]">
                {student.name}
              </h3>

              <span className="inline-flex items-center gap-1 rounded-full border border-[#bfe6d3] bg-[#f1fbf6] px-2 py-0.5 text-[8px] font-bold text-[#30805d]">
                <CheckCircle2 size={9} />
                Approved
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[#75899d]">
              <span className="inline-flex items-center gap-1">
                <Mail size={10} />
                {student.email}
              </span>

              {student.campusUserId && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-[#8ea1b3]">
                    #
                  </span>
                  {student.campusUserId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* INFO */}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[600px]">
          <InfoBox
            label="Semester"
            value={semester}
          />

          <InfoBox
            label="Section"
            value={section}
          />

          <InfoBox
            label="Subjects"
            value={String(
              uniqueSubjects.length
            )}
          />

          <InfoBox
            label="Attendance"
            value={`${statistics.classAttendancePercentage}%`}
          />
        </div>

        {/* ACTIONS */}

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#b9dcf1] bg-[#f7fcff] px-3 text-[10px] font-bold text-[#2d83b4] transition hover:border-[#54bce5] hover:bg-[#edf8fd]"
          >
            <Eye size={14} />
            View Details
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#f2cccc] bg-[#fffafa] px-3 text-[10px] font-bold text-[#c34b4b] transition hover:border-[#e99b9b] hover:bg-[#fff2f2]"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INFO BOX
// ============================================================

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e0e9f0] bg-[#f8fafc] px-3 py-2">
      <p className="text-[8px] text-[#8295a7]">
        {label}
      </p>

      <p className="mt-1 truncate text-[9px] font-bold text-[#273a4f]">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// DETAILS MODAL
// ============================================================

function StudentDetailsModal({
  student,
  onClose,
  onDelete,
}: {
  student: Student;
  onClose: () => void;
  onDelete: () => void;
}) {
  const registrations =
    Array.isArray(student.studentRegistrations)
      ? student.studentRegistrations
      : [];

  const classAttendances =
    Array.isArray(student.classAttendances)
      ? student.classAttendances
      : [];

  const eventAttendances =
    Array.isArray(student.attendances)
      ? student.attendances
      : [];

  const memberships =
    Array.isArray(student.memberships)
      ? student.memberships
      : [];

  const certificates =
    Array.isArray(student.certificates)
      ? student.certificates
      : [];

  const statistics = {
    ...defaultStatistics,
    ...(student.statistics ?? {}),
  };

  const uniqueSubjects =
    Array.from(
      new Map(
        registrations.map(
          (registration) => [
            registration.subject?.id ?? `registration-${registration.id}`,
            registration.subject ?? { id: "unknown-subject", name: "Unknown Subject", semester: registration.semester },
          ]
        )
      ).values()
    );

  const sections = Array.from(
    new Set(
      registrations.map(
        (registration) =>
          registration.section
      )
    )
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/70 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[94vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border border-[#d6e2eb] bg-[#f5f9fc] shadow-[0_30px_100px_rgba(5,20,35,0.28)]">
        {/* HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-[#dce6ee] bg-white px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf7fc] text-[#479ac7]">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle size={22} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-serif text-[19px] font-bold text-[#14263b] sm:text-[22px]">
                  {student.name}
                </h2>

                <span className="rounded-full border border-[#bfe6d3] bg-[#f1fbf6] px-2 py-1 text-[8px] font-bold text-[#30805d]">
                  APPROVED
                </span>
              </div>

              <p className="mt-1 truncate text-[10px] text-[#7b8ea1]">
                {student.email}
                {student.campusUserId
                  ? ` • ${student.campusUserId}`
                  : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dce6ee] bg-white text-[#657a8e] hover:bg-[#f2f6f9]"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          {/* OVERVIEW STATS */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <ModalStat
              label="Subjects"
              value={String(
                uniqueSubjects.length
              )}
              icon={BookOpen}
            />

            <ModalStat
              label="Semester"
              value={
                registrations[0]
                  ? String(
                      registrations[0]
                        .semester
                    )
                  : "-"
              }
              icon={GraduationCap}
            />

            <ModalStat
              label="Section"
              value={
                sections.join(", ") ||
                "-"
              }
              icon={Users}
            />

            <ModalStat
              label="Class Present"
              value={String(
                student.statistics
                  .classAttendancePresent
              )}
              icon={CheckCircle2}
            />

            <ModalStat
              label="Class Absent"
              value={String(
                student.statistics
                  .classAttendanceAbsent
              )}
              icon={ClipboardCheck}
            />

            <ModalStat
              label="Attendance"
              value={`${statistics.classAttendancePercentage}%`}
              icon={Clock3}
            />

            <ModalStat
              label="Events"
              value={String(
                student.statistics
                  .eventAttendancePresent
              )}
              icon={CalendarDays}
            />
          </div>

          {/* PERSONAL INFORMATION */}

          <DetailSection
            title="Personal Information"
            icon={UserCircle}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem
                label="Full Name"
                value={student.name}
              />

              <DetailItem
                label="Email"
                value={student.email}
              />

              <DetailItem
                label="Campus User ID"
                value={
                  student.campusUserId ||
                  "Not assigned"
                }
              />

              <DetailItem
                label="Phone"
                value={
                  student.phone ||
                  "Not provided"
                }
              />

              <DetailItem
                label="Department"
                value={
                  student.department ||
                  "Not provided"
                }
              />

              <DetailItem
                label="Qualification"
                value={
                  student.qualification ||
                  "Not provided"
                }
              />

              <DetailItem
                label="Specialization"
                value={
                  student.specialization ||
                  "Not provided"
                }
              />

              <DetailItem
                label="Account Status"
                value="Approved"
              />

              <DetailItem
                label="Account Created"
                value={formatDate(
                  student.createdAt
                )}
              />
            </div>
          </DetailSection>

          {/* ADDRESS */}

          <DetailSection
            title="Address"
            icon={MapPin}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <DetailItem
                label="Address"
                value={
                  student.address ||
                  "Not provided"
                }
              />

              <DetailItem
                label="City"
                value={
                  student.city ||
                  "Not provided"
                }
              />

              <DetailItem
                label="State"
                value={
                  student.state ||
                  "Not provided"
                }
              />
            </div>
          </DetailSection>

          {/* SUBJECT REGISTRATION */}

          <DetailSection
            title="Registered Subjects"
            icon={BookOpen}
            badge={`${registrations.length}`}
          >
            {registrations.length === 0 ? (
              <EmptyDetail text="No subject registration found." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#dce6ee]">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="bg-[#f6f9fb]">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Subject
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Semester
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Section
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Registered
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e8eef3] bg-white">
                    {registrations.map(
                      (registration) => (
                        <tr
                          key={
                            registration.id
                          }
                        >
                          <td className="px-4 py-3 text-[11px] font-semibold text-[#26394d]">
                            {
                              registration
                                .subject
                                .name
                            }
                          </td>

                          <td className="px-4 py-3 text-[10px] text-[#62788d]">
                            Semester{" "}
                            {
                              registration.semester
                            }
                          </td>

                          <td className="px-4 py-3 text-[10px] text-[#62788d]">
                            {
                              registration.section
                            }
                          </td>

                          <td className="px-4 py-3 text-[10px] text-[#62788d]">
                            {formatDate(
                              registration.createdAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </DetailSection>

          {/* CLASS ATTENDANCE */}

          <DetailSection
            title="Class / Subject Attendance"
            icon={ClipboardCheck}
            badge={`${statistics.classAttendanceTotal} records`}
          >
            {classAttendances.length === 0 ? (
              <EmptyDetail text="No class attendance records found." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#dce6ee]">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-[#f6f9fb]">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Subject
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Semester
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Section
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Date
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Faculty
                      </th>

                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e8eef3] bg-white">
                    {classAttendances.map(
                      (attendance) => {
                        const present =
                          String(
                            attendance.status
                          )
                            .trim()
                            .toUpperCase() ===
                          "PRESENT";

                        return (
                          <tr
                            key={
                              attendance.id
                            }
                          >
                            <td className="px-4 py-3 text-[11px] font-semibold text-[#26394d]">
                              {
                                attendance.subject?.name ?? "Unknown Subject"
                              }
                            </td>

                            <td className="px-4 py-3 text-[10px] text-[#62788d]">
                              Semester{" "}
                              {
                                attendance.session?.semester ?? "-"
                              }
                            </td>

                            <td className="px-4 py-3 text-[10px] text-[#62788d]">
                              {
                                attendance.session?.section ?? "-"
                              }
                            </td>

                            <td className="px-4 py-3 text-[10px] text-[#62788d]">
                              {formatDate(
                                attendance.session?.sessionDate ?? attendance.markedAt
                              )}
                            </td>

                            <td className="px-4 py-3 text-[10px] text-[#62788d]">
                              {
                                attendance.session?.faculty?.name ?? "Unknown Faculty"
                              }
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-bold ${
                                  present
                                    ? "border-[#bfe6d3] bg-[#f1fbf6] text-[#30805d]"
                                    : "border-[#f1cccc] bg-[#fff6f6] text-[#bd4949]"
                                }`}
                              >
                                {present
                                  ? "PRESENT"
                                  : "ABSENT"}
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </DetailSection>

          {/* EVENT ATTENDANCE */}

          <DetailSection
            title="Event Attendance"
            icon={CalendarDays}
            badge={`${statistics.eventAttendanceTotal} records`}
          >
            {eventAttendances.length ===
            0 ? (
              <EmptyDetail text="No event attendance records found." />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {eventAttendances.map(
                  (attendance) => {
                    const present =
                      String(
                        attendance.status
                      )
                        .trim()
                        .toUpperCase() ===
                      "PRESENT";

                    return (
                      <div
                        key={
                          attendance.id
                        }
                        className="rounded-xl border border-[#dce6ee] bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="truncate text-[12px] font-bold text-[#26394d]">
                              {
                                attendance.event?.title ?? "Unknown Event"
                              }
                            </h4>

                            <p className="mt-1 text-[9px] text-[#8194a7]">
                              {
                                attendance.event?.club?.name ?? "Unknown Club"
                              }
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-bold ${
                              present
                                ? "border-[#bfe6d3] bg-[#f1fbf6] text-[#30805d]"
                                : "border-[#f1cccc] bg-[#fff6f6] text-[#bd4949]"
                            }`}
                          >
                            {present
                              ? "PRESENT"
                              : "ABSENT"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <DetailMini
                            label="Venue"
                            value={
                              attendance
                                .event
                                .venue
                            }
                          />

                          <DetailMini
                            label="Date"
                            value={formatDate(
                              attendance
                                .event
                                .eventDate
                            )}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </DetailSection>

          {/* CLUBS */}

          <DetailSection
            title="Club Memberships"
            icon={Trophy}
            badge={`${memberships.length}`}
          >
            {memberships.length ===
            0 ? (
              <EmptyDetail text="No club memberships found." />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {memberships.map(
                  (membership) => (
                    <div
                      key={
                        membership.id
                      }
                      className="rounded-xl border border-[#dce6ee] bg-white p-4"
                    >
                      <h4 className="text-[12px] font-bold text-[#26394d]">
                        {
                          membership.club?.name ?? "Unknown Club"
                        }
                      </h4>

                      <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#8194a7]">
                        {
                          membership.club?.description ?? ""
                        }
                      </p>

                      <p className="mt-3 text-[9px] text-[#72879a]">
                        Joined:{" "}
                        {formatDate(
                          membership.joinedAt
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </DetailSection>

          {/* CERTIFICATES */}

          <DetailSection
            title="Certificates"
            icon={Award}
            badge={`${certificates.length}`}
          >
            {certificates.length ===
            0 ? (
              <EmptyDetail text="No certificates found." />
            ) : (
              <div className="space-y-2">
                {certificates.map(
                  (certificate) => (
                    <div
                      key={
                        certificate.id
                      }
                      className="flex flex-col gap-2 rounded-xl border border-[#dce6ee] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-[11px] font-bold text-[#26394d]">
                          {
                            certificate.title
                          }
                        </p>

                        <p className="mt-1 text-[9px] text-[#8194a7]">
                          Issued{" "}
                          {formatDate(
                            certificate.createdAt
                          )}
                        </p>
                      </div>

                      {certificate.fileUrl && (
                        <a
                          href={
                            certificate.fileUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#c5e0f1] bg-[#f5fbff] px-3 py-1.5 text-[9px] font-bold text-[#3385b2]"
                        >
                          View Certificate
                        </a>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </DetailSection>
        </div>

        {/* FOOTER */}

        <div className="flex shrink-0 items-center justify-between border-t border-[#dce6ee] bg-white px-5 py-4 sm:px-7">
          <p className="hidden text-[9px] text-[#8194a7] sm:block">
            Student ID: {student.id}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#f0caca] bg-[#fffafa] px-3 text-[10px] font-bold text-[#c34c4c] hover:bg-[#fff1f1]"
            >
              <Trash2 size={14} />
              Delete Student
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#132238] px-4 text-[10px] font-bold text-white hover:bg-[#1c304a]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL STAT
// ============================================================

function ModalStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-[#dce6ee] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] text-[#8194a7]">
          {label}
        </p>

        <Icon
          size={13}
          className="text-[#5ba8d1]"
        />
      </div>

      <p className="mt-2 truncate text-[14px] font-bold text-[#24374c]">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// DETAIL SECTION
// ============================================================

function DetailSection({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  icon: LucideIcon;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-[16px] border border-[#dce6ee] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5edf2] bg-[#fbfdff] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf7fc] text-[#4b9dca]">
            <Icon size={16} />
          </div>

          <h3 className="font-serif text-[14px] font-bold text-[#26394d]">
            {title}
          </h3>
        </div>

        {badge && (
          <span className="rounded-full border border-[#d5e5ef] bg-white px-2.5 py-1 text-[8px] font-bold text-[#678097]">
            {badge}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#e1e9ef] bg-[#fafcfe] px-3.5 py-3">
      <p className="text-[8px] font-medium uppercase tracking-wider text-[#8a9cad]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-[10px] font-semibold text-[#2d4054]">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// MINI DETAIL
// ============================================================

function DetailMini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#f7fafc] px-3 py-2">
      <p className="text-[7px] uppercase tracking-wider text-[#8a9cad]">
        {label}
      </p>

      <p className="mt-1 truncate text-[9px] font-semibold text-[#52697e]">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// EMPTY
// ============================================================

function EmptyDetail({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8e3eb] bg-[#fbfdff] px-5 py-8 text-center">
      <p className="text-[10px] text-[#8295a7]">
        {text}
      </p>
    </div>
  );
}

// ============================================================
// DELETE MODAL
// ============================================================

function DeleteModal({
  student,
  loading,
  onCancel,
  onConfirm,
}: {
  student: Student;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07111f]/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[440px] overflow-hidden rounded-[22px] border border-[#e2e8ed] bg-white shadow-[0_30px_90px_rgba(5,20,35,0.25)]">
        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f0] text-[#d14f4f]">
            <Trash2 size={22} />
          </div>

          <h3 className="mt-5 font-serif text-[20px] font-bold text-[#17283c]">
            Delete Student?
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-[#71869a]">
            You are about to delete{" "}
            <span className="font-bold text-[#2b3f53]">
              {student.name}
            </span>
            . This will remove the student account
            and its related registration, attendance,
            membership and certificate records according
            to the database cascade rules.
          </p>

          <div className="mt-4 rounded-xl border border-[#f0d0d0] bg-[#fff8f8] px-4 py-3">
            <p className="text-[9px] text-[#a35b5b]">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e5ebef] bg-[#fbfdff] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-9 rounded-lg border border-[#d7e2ea] bg-white px-4 text-[10px] font-bold text-[#60768a] hover:bg-[#f5f8fa] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#c94e4e] px-4 text-[10px] font-bold text-white hover:bg-[#b84242] disabled:opacity-60"
          >
            {loading ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={14} />
            )}

            Delete Student
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleDateString(
      "en-IN",
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