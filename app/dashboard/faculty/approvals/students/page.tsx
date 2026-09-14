"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  User,
  UserCircle,
  Users,
  UserX,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Student = {
  id: string;
  campusUserId: string | null;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
  approvalStatus: string;
  createdAt: string;
  approvedAt?: string | null;
  rejectionReason: string | null;
};

type Faculty = {
  id: string;
  name: string;
  email: string;
  facultyId?: string;
  role: string;
};

type FilterType =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

type ApiResponse = {
  success?: boolean;
  message?: string;
  students?: Student[];
  student?: Student;
  emailSent?: boolean;
  emailError?: string;
};

/* =========================================================
   DEFAULT FACULTY
========================================================= */

const defaultFaculty: Faculty = {
  id: "",
  name: "Vivek Kumar",
  email: "faculty@campusconnect.com",
  facultyId: "RNT-9457",
  role: "Faculty Member",
};

/* =========================================================
   NAVIGATION
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

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(status: string | null | undefined) {
  return String(status || "")
    .trim()
    .toUpperCase();
}

function isPending(status: string) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "PENDING" ||
    normalized === "PENDING_APPROVAL" ||
    normalized === "PENDING_FACULTY_APPROVAL"
  );
}

function isApproved(status: string) {
  const normalized = normalizeStatus(status);

  return (
    normalized === "APPROVED" ||
    normalized === "ACTIVE"
  );
}

function isRejected(status: string) {
  const normalized = normalizeStatus(status);

  return normalized === "REJECTED";
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function FacultyStudentApprovalPage() {
  const router = useRouter();

  const [faculty, setFaculty] = useState<Faculty>(
    defaultFaculty
  );

  const [students, setStudents] = useState<Student[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [activeFilter, setActiveFilter] =
    useState<FilterType>("all");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [showRejectModal, setShowRejectModal] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  /* =========================================================
     INITIALS
  ========================================================== */

  const facultyName =
    faculty.name || defaultFaculty.name;

  const facultyEmail =
    faculty.email || defaultFaculty.email;

  const facultyId =
    faculty.facultyId || defaultFaculty.facultyId;

  const facultyRole =
    faculty.role || defaultFaculty.role;

  const initials = facultyName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /* =========================================================
     GET FACULTY FROM LOCAL STORAGE
  ========================================================== */

  const getStoredFaculty =
    useCallback((): Faculty | null => {
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
        const stored =
          window.localStorage.getItem(key);

        if (!stored) {
          continue;
        }

        try {
          const parsed = JSON.parse(stored);

          if (
            parsed &&
            typeof parsed === "object"
          ) {
            const role = String(
              parsed.role || ""
            ).toUpperCase();

            if (
              role === "FACULTY" ||
              role === "FACULTY MEMBER"
            ) {
              return {
                id: String(parsed.id || ""),
                name: String(
                  parsed.name ||
                    defaultFaculty.name
                ),
                email: String(
                  parsed.email ||
                    defaultFaculty.email
                ),
                facultyId: String(
                  parsed.facultyId ||
                    defaultFaculty.facultyId
                ),
                role: String(
                  parsed.role ||
                    defaultFaculty.role
                ),
              };
            }
          }
        } catch {
          continue;
        }
      }

      return null;
    }, []);

  /* =========================================================
     LOAD STUDENTS
  ========================================================== */

  const loadStudents = useCallback(
    async (facultyData: Faculty) => {
      setError("");

      try {
        const response = await fetch(
          "/api/faculty/approvals/students",
          {
            method: "GET",
            headers: {
              "x-faculty-id": facultyData.id,
            },
            credentials: "include",
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load student approvals."
          );
        }

        setStudents(
          Array.isArray(data.students)
            ? data.students
            : []
        );
      } catch (err) {
        console.error(
          "Load student approvals error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load student approval requests."
        );
      }
    },
    []
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setLoading(true);

      const storedFaculty =
        getStoredFaculty();

      if (cancelled) {
        return;
      }

      if (
        !storedFaculty ||
        !storedFaculty.id
      ) {
        /*
         * Keep dashboard usable with existing
         * default faculty information.
         */
        setFaculty(defaultFaculty);

        setError(
          "Faculty information was not found. Please login again."
        );

        setLoading(false);

        return;
      }

      setFaculty(storedFaculty);

      try {
        await loadStudents(
          storedFaculty
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [
    getStoredFaculty,
    loadStudents,
  ]);

  /* =========================================================
     COUNTS
  ========================================================== */

  const counts = useMemo(() => {
    const pending = students.filter(
      (student) =>
        isPending(student.approvalStatus)
    ).length;

    const approved = students.filter(
      (student) =>
        isApproved(student.approvalStatus)
    ).length;

    const rejected = students.filter(
      (student) =>
        isRejected(student.approvalStatus)
    ).length;

    return {
      pending,
      approved,
      rejected,
      total: students.length,
    };
  }, [students]);

  /* =========================================================
     FILTER + SEARCH
  ========================================================== */

  const filteredStudents = useMemo(() => {
    const term =
      searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      let matchesFilter = true;

      if (activeFilter === "pending") {
        matchesFilter = isPending(
          student.approvalStatus
        );
      }

      if (activeFilter === "approved") {
        matchesFilter = isApproved(
          student.approvalStatus
        );
      }

      if (activeFilter === "rejected") {
        matchesFilter = isRejected(
          student.approvalStatus
        );
      }

      if (!matchesFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        student.name
          .toLowerCase()
          .includes(term) ||
        student.email
          .toLowerCase()
          .includes(term) ||
        (student.campusUserId || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [
    students,
    searchTerm,
    activeFilter,
  ]);

  /* =========================================================
     REFRESH
  ========================================================== */

  const refreshStudents = async () => {
    if (!faculty.id) {
      setError(
        "Faculty information was not found."
      );

      return;
    }

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      await loadStudents(faculty);

      setSuccess(
        "Student approval data refreshed successfully."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     APPROVE STUDENT
  ========================================================== */

  const approveStudent = async (
    student: Student
  ) => {
    if (!faculty.id) {
      setError(
        "Faculty information was not found."
      );

      return;
    }

    setActionLoading(student.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/faculty/approvals/students",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            "x-faculty-id": faculty.id,
          },
          credentials: "include",
          body: JSON.stringify({
            studentId: student.id,
            facultyId: faculty.id,
            action: "approve",
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to approve student."
        );
      }

      if (data.student) {
        setStudents((current) =>
          current.map((item) =>
            item.id === data.student!.id
              ? data.student!
              : item
          )
        );
      } else {
        setStudents((current) =>
          current.map((item) =>
            item.id === student.id
              ? {
                  ...item,
                  approvalStatus:
                    "APPROVED",
                }
              : item
          )
        );
      }

      setSelectedStudent(null);

      if (data.emailSent) {
        setSuccess(
          `${student.name} has been approved successfully. Approval email has been sent to ${student.email}.`
        );
      } else {
        setSuccess(
          `${student.name} has been approved successfully.`
        );

        if (data.emailError) {
          console.error(
            "FACULTY APPROVAL EMAIL ERROR:",
            data.emailError
          );
        }
      }
    } catch (err) {
      console.error(
        "Approve student error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve student."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================================
     OPEN REJECT MODAL
  ========================================================== */

  const openRejectModal = (
    student: Student
  ) => {
    setSelectedStudent(student);
    setRejectionReason("");
    setShowRejectModal(true);
    setError("");
    setSuccess("");
  };

  /* =========================================================
     REJECT STUDENT
  ========================================================== */

  const rejectStudent = async () => {
    if (
      !faculty.id ||
      !selectedStudent
    ) {
      return;
    }

    setActionLoading(
      selectedStudent.id
    );

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/faculty/approvals/students",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            "x-faculty-id": faculty.id,
          },
          credentials: "include",
          body: JSON.stringify({
            studentId:
              selectedStudent.id,
            facultyId: faculty.id,
            action: "reject",
            rejectionReason:
              rejectionReason.trim() ||
              "Student registration rejected by faculty.",
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to reject student."
        );
      }

      if (data.student) {
        setStudents((current) =>
          current.map((item) =>
            item.id === data.student!.id
              ? data.student!
              : item
          )
        );
      } else {
        setStudents((current) =>
          current.map((item) =>
            item.id ===
            selectedStudent.id
              ? {
                  ...item,
                  approvalStatus:
                    "REJECTED",
                  rejectionReason:
                    rejectionReason.trim() ||
                    "Student registration rejected by faculty.",
                }
              : item
          )
        );
      }

      const rejectedName =
        selectedStudent.name;

      setSelectedStudent(null);
      setShowRejectModal(false);
      setRejectionReason("");

      setSuccess(
        `${rejectedName} has been rejected successfully.`
      );
    } catch (err) {
      console.error(
        "Reject student error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject student."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* =========================================================
     SIGN OUT
  ========================================================== */

  const handleSignOut = () => {
    try {
      localStorage.removeItem(
        "facultyUser"
      );

      localStorage.removeItem(
        "faculty"
      );

      localStorage.removeItem(
        "currentFaculty"
      );

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "facultyToken"
      );
    } catch {
      // Ignore storage errors.
    }

    router.push("/faculty/login");
  };

  /* =========================================================
     CLOSE MOBILE SIDEBAR
  ========================================================== */

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  /* =========================================================
     RETURN
  ========================================================== */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR CURSOR MINI UI
      ====================================================== */}
      <div
        id="sidebar-cursor-ui"
        className="pointer-events-none fixed left-0 top-0 z-[70] h-3 w-3 rounded-[3px] border border-[#8ee0ff] bg-[#54bce5] shadow-[0_0_16px_rgba(84,188,229,0.85)] opacity-0 transition-opacity duration-150"
      />

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        onMouseMove={(event) => {
          const cursorUI = document.getElementById("sidebar-cursor-ui");
          if (!cursorUI) return;

          cursorUI.style.left = `${event.clientX + 10}px`;
          cursorUI.style.top = `${event.clientY + 10}px`;
          cursorUI.style.opacity = "1";
        }}
        onMouseLeave={() => {
          const cursorUI = document.getElementById("sidebar-cursor-ui");
          if (cursorUI) cursorUI.style.opacity = "0";
        }}
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-[270px] shrink-0
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
                className="text-white"
              />
            </div>

            <div className="min-w-0">
              <h1 className="font-serif text-[19px] font-bold tracking-tight text-white">
                CampusConnect
              </h1>

              <p className="mt-0.5 text-[11px] font-medium text-[#91a4bb]">
                Faculty Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="rounded-lg p-2 text-[#8fa3bb] transition hover:bg-white/10 hover:text-white lg:hidden"
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

              const active =
                (item.title === "Student Approval") ||
                (item.title === "Activities" &&
                  typeof window !== "undefined" &&
                  window.location.pathname.startsWith("/dashboard/faculty/activities")) ||
                (item.title === "Notifications" &&
                  typeof window !== "undefined" &&
                  window.location.pathname.startsWith("/faculty/notifications"));

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={
                    closeMobileSidebar
                  }
                  className={`
                    group relative flex h-11 w-full items-center gap-3
                    rounded-xl px-3.5
                    text-[13px] font-medium
                    transition-all duration-200
                    before:pointer-events-none before:absolute before:left-1 before:top-1
                    before:h-2 before:w-2 before:rounded-[2px]
                    before:bg-[#54bce5] before:opacity-0 before:scale-50
                    before:transition-all before:duration-200
                    group-hover:before:opacity-100 group-hover:before:scale-100
                    group-hover:before:shadow-[0_0_10px_rgba(84,188,229,0.9)]
                    ${
                      active
                        ? "bg-[#17263a] text-[#64c8ee] shadow-[inset_3px_0_0_#54bce5]"
                        : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
                    }
                  `}
                >
                  <span
                    className={`
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                      transition-all duration-200 ease-out
                      ${
                        active
                          ? "bg-[#20344d] shadow-[0_4px_12px_rgba(84,188,229,0.10)]"
                          : "bg-transparent group-hover:bg-[#17304a] group-hover:shadow-[0_4px_14px_rgba(84,188,229,0.12)] group-hover:scale-105"
                      }
                    `}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.8}
                      className={`
                        transition-all duration-200
                        ${
                          active
                            ? "text-[#63c9ef]"
                            : "text-[#8195ad] group-hover:text-[#63c9ef]"
                        }
                      `}
                    />
                  </span>

                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
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
            <Link
              href="/faculty/settings"
              onClick={closeMobileSidebar}
              className="group relative flex h-11 w-full items-center gap-3 before:pointer-events-none before:absolute before:left-1 before:top-1 before:h-2 before:w-2 before:rounded-[2px] before:bg-[#54bce5] before:opacity-0 before:scale-50 before:transition-all before:duration-200 group-hover:before:opacity-100 group-hover:before:scale-100 group-hover:before:shadow-[0_0_10px_rgba(84,188,229,0.9)] rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent transition-all duration-200 ease-out group-hover:scale-105 group-hover:bg-[#17304a] group-hover:shadow-[0_4px_14px_rgba(84,188,229,0.12)]">
                <Settings
                  size={17}
                  strokeWidth={1.8}
                  className="text-[#8195ad] transition-colors duration-200 group-hover:text-[#63c9ef]"
                />
              </span>

              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                Settings
              </span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="group relative flex h-11 w-full items-center gap-3 before:pointer-events-none before:absolute before:left-1 before:top-1 before:h-2 before:w-2 before:rounded-[2px] before:bg-[#54bce5] before:opacity-0 before:scale-50 before:transition-all before:duration-200 group-hover:before:opacity-100 group-hover:before:scale-100 group-hover:before:shadow-[0_0_10px_rgba(84,188,229,0.9)] rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent transition-all duration-200 ease-out group-hover:scale-105 group-hover:bg-[#17304a] group-hover:shadow-[0_4px_14px_rgba(84,188,229,0.12)]">
                <LogOut
                  size={17}
                  strokeWidth={1.8}
                  className="text-[#8195ad] transition-colors duration-200 group-hover:text-[#63c9ef]"
                />
              </span>

              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                Sign Out
              </span>
            </button>
          </nav>
        </div>

        {/* SIDEBAR USER */}

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

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="min-h-screen w-full min-w-0 lg:ml-[270px] lg:w-[calc(100%-270px)]">

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <main className="relative min-h-screen w-full overflow-hidden bg-[#edf4fa] px-5 py-6 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
            className="fixed right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#263a53] shadow-[0_8px_24px_rgba(20,50,80,0.10)] lg:hidden"
          >
            <Menu size={19} />
          </button>

          {/* BACKGROUND GRID */}

          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.08) 1px, transparent 1px)",
                backgroundSize:
                  "42px 42px",
              }}
            />

            <div className="absolute left-[20%] top-[8%] h-[450px] w-[450px] rounded-full bg-[#dceef8] opacity-50 blur-3xl" />

            <div className="absolute right-[5%] top-[30%] h-[350px] w-[350px] rounded-full bg-[#e4f2f9] opacity-60 blur-3xl" />
          </div>

          {/* =================================================
              CENTERED CONTENT WRAPPER
          ================================================= */}

          <div className="relative ml-0 w-full max-w-none">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="relative flex h-[280px] w-full items-center overflow-hidden rounded-[23px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-7 py-7 shadow-[0_18px_45px_rgba(10,27,48,0.18)] sm:px-9 lg:px-10">

              <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#54bce5]/20" />

              <div className="pointer-events-none absolute right-4 top-12 h-40 w-40 rounded-full border border-[#54bce5]/10" />

              <div className="pointer-events-none absolute bottom-[-100px] left-[42%] h-64 w-64 rounded-full bg-[#54bce5]/5 blur-3xl" />

              <div className="pointer-events-none absolute left-[38%] top-[-80px] h-56 w-56 rounded-full bg-[#54bce5]/6 blur-3xl" />

              <div className="relative z-10 max-w-[900px]">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#76d0f1]">
                  <ShieldCheck size={14} />
                  Faculty Verification
                </div>

                <h1 className="font-serif text-[30px] font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-[36px] lg:text-[40px]">
                  Student Registration
                  <br />
                  <span className="text-[#69c9ed]">
                    Approval Center
                  </span>
                </h1>

                <p className="mt-3 max-w-[650px] text-[11px] leading-5 text-[#a7b7c9] sm:text-[12px]">
                  Review new student registrations, verify applicant details, and approve or reject requests from one clear and secure faculty workspace.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#49c997]/30 bg-[#49c997]/10 px-3 py-1.5 text-[10px] font-semibold text-[#72dcb4]">
                    <CheckCircle2 size={14} />
                    {counts.pending} Pending Reviews
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#7890aa]/30 bg-white/[0.04] px-3 py-1.5 text-[10px] text-[#b3c0d0]">
                    <Users size={14} />
                    {counts.total} Total Applications
                  </div>
                </div>
              </div>

            </section>

            {/* =================================================
                FACULTY INFORMATION
            ================================================= */}

            <section className="mt-5 rounded-[20px] border border-[#d8e3ed] bg-white px-5 py-4 shadow-[0_8px_25px_rgba(30,60,90,0.06)] sm:px-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f3fa] text-[12px] font-bold text-[#4b9ac4]">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#17283d]">
                      {facultyName}
                    </p>

                    <p className="truncate text-[11px] text-[#71849a]">
                      {facultyEmail}
                    </p>
                  </div>
                </div>

                <div className="sm:ml-auto">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#bde5d3] bg-[#f0faf5] px-3.5 py-2 text-[11px] font-semibold text-[#318c67]">
                    <ShieldCheck
                      size={14}
                    />
                    Faculty Access
                  </div>
                </div>

              </div>
            </section>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
                <X className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="text-[13px] font-semibold">
                    Something went wrong
                  </p>

                  <p className="mt-1 text-[12px] leading-5">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="text-[13px] font-semibold">
                    Success
                  </p>

                  <p className="mt-1 text-[12px] leading-5">
                    {success}
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                STATS
            ================================================= */}

            <section className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <ApprovalStatCard
                title="Pending"
                value={counts.pending}
                description="Awaiting faculty review"
                icon={Clock3}
                iconClass="bg-[#fff8e9] text-[#e79a00]"
                hoverBoxClass="bg-[#fff8e9] border-[#f3c96b]"
              />

              <ApprovalStatCard
                title="Approved"
                value={counts.approved}
                description="Successfully approved"
                icon={CheckCircle2}
                iconClass="bg-[#edf9f3] text-[#39a675]"
                hoverBoxClass="bg-[#edf9f3] border-[#8ed6b1]"
              />

              <ApprovalStatCard
                title="Rejected"
                value={counts.rejected}
                description="Registration rejected"
                icon={UserX}
                iconClass="bg-[#fff1f1] text-[#df6262]"
                hoverBoxClass="bg-[#fff1f1] border-[#eaa0a0]"
              />

              <ApprovalStatCard
                title="Total Applications"
                value={counts.total}
                description="All registration requests"
                icon={Users}
                iconClass="bg-[#edf7fc] text-[#4e9ed0]"
                hoverBoxClass="bg-[#edf7fc] border-[#9bcbe4]"
              />

            </section>

            {/* =================================================
                APPLICATIONS
            ================================================= */}

            <section className="mt-7 overflow-hidden rounded-[21px] border border-[#d8e3ed] bg-white shadow-[0_8px_25px_rgba(30,60,90,0.055)]">

              {/* SECTION HEADER */}

              <div className="border-b border-[#e7edf3] px-5 py-5 sm:px-6">

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7fc] text-[#4d9dca]">
                      <GraduationCap
                        size={21}
                      />
                    </div>

                    <div>
                      <h2 className="font-serif text-[20px] font-bold text-[#142238]">
                        Registration Applications
                      </h2>

                      <p className="mt-1 text-[11px] text-[#74879c]">
                        Review and manage student registration applications.
                      </p>
                    </div>
                  </div>

                  {/* SEARCH */}

                  <div className="relative w-full lg:w-[330px]">
                    <Search
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a5ba]"
                    />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search by name, email or Campus ID..."
                      className="h-11 w-full rounded-xl border border-[#dbe5ed] bg-[#f8fbfd] pl-10 pr-4 text-[12px] text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#8fc7e3] focus:bg-white focus:ring-2 focus:ring-[#dff1fa]"
                    />
                  </div>

                </div>

                {/* FILTERS */}

                <div className="mt-5 flex flex-wrap gap-2">

                  <FilterButton
                    active={
                      activeFilter ===
                      "all"
                    }
                    onClick={() =>
                      setActiveFilter(
                        "all"
                      )
                    }
                    label="All Applications"
                    count={counts.total}
                  />

                  <FilterButton
                    active={
                      activeFilter ===
                      "pending"
                    }
                    onClick={() =>
                      setActiveFilter(
                        "pending"
                      )
                    }
                    label="Pending"
                    count={counts.pending}
                  />

                  <FilterButton
                    active={
                      activeFilter ===
                      "approved"
                    }
                    onClick={() =>
                      setActiveFilter(
                        "approved"
                      )
                    }
                    label="Approved"
                    count={counts.approved}
                  />

                  <FilterButton
                    active={
                      activeFilter ===
                      "rejected"
                    }
                    onClick={() =>
                      setActiveFilter(
                        "rejected"
                      )
                    }
                    label="Rejected"
                    count={counts.rejected}
                  />

                </div>
              </div>

              {/* APPLICATION LIST */}

              {loading ? (
                <div className="flex min-h-[330px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-[#74879c]">
                    <Loader2
                      size={32}
                      className="animate-spin text-[#54bce5]"
                    />

                    <p className="text-[12px] font-medium">
                      Loading student applications...
                    </p>
                  </div>
                </div>
              ) : filteredStudents.length ===
                0 ? (
                <EmptyState
                  filter={activeFilter}
                  searchTerm={searchTerm}
                />
              ) : (
                <div className="divide-y divide-[#edf1f5]">

                  {filteredStudents.map(
                    (student) => (
                      <StudentApplicationRow
                        key={student.id}
                        student={student}
                        actionLoading={
                          actionLoading
                        }
                        onApprove={
                          approveStudent
                        }
                        onReject={
                          openRejectModal
                        }
                      />
                    )
                  )}

                </div>
              )}
            </section>

            <div className="h-8" />

          </div>
        </main>
      </div>

      {/* =====================================================
          REJECT MODAL
      ====================================================== */}

      {showRejectModal &&
        selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/55 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md overflow-hidden rounded-[22px] border border-[#dbe5ed] bg-white shadow-[0_25px_70px_rgba(5,20,40,0.25)]">

              <div className="flex items-start justify-between border-b border-[#edf1f5] px-6 py-5">

                <div>
                  <h2 className="font-serif text-[21px] font-bold text-[#142238]">
                    Reject Student
                  </h2>

                  <p className="mt-1 text-[12px] leading-5 text-[#71849a]">
                    Rejecting registration for{" "}
                    <span className="font-semibold text-[#263b53]">
                      {selectedStudent.name}
                    </span>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(
                      false
                    );
                    setSelectedStudent(
                      null
                    );
                    setRejectionReason(
                      ""
                    );
                  }}
                  className="rounded-xl p-2 text-[#91a0b0] transition hover:bg-[#f1f5f8] hover:text-[#263b53]"
                >
                  <X size={19} />
                </button>

              </div>

              <div className="px-6 py-5">

                <label className="mb-2 block text-[12px] font-semibold text-[#263b53]">
                  Rejection Reason
                </label>

                <textarea
                  value={
                    rejectionReason
                  }
                  onChange={(event) =>
                    setRejectionReason(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Enter the reason for rejecting this student..."
                  className="w-full resize-none rounded-xl border border-[#dbe5ed] bg-[#f8fbfd] p-3 text-[12px] leading-5 text-[#142238] outline-none transition placeholder:text-[#9aabba] focus:border-[#df9b9b] focus:bg-white focus:ring-2 focus:ring-[#fdecec]"
                />

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(
                        false
                      );
                      setSelectedStudent(
                        null
                      );
                      setRejectionReason(
                        ""
                      );
                    }}
                    className="rounded-xl border border-[#dbe5ed] px-4 py-2.5 text-[12px] font-semibold text-[#51667e] transition hover:bg-[#f7fafc]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      rejectStudent
                    }
                    disabled={
                      actionLoading ===
                      selectedStudent.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#dc5f5f] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#ca4e4e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ===
                    selectedStudent.id ? (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <UserX size={15} />
                    )}

                    Reject Student
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

/* =========================================================
   APPROVAL STAT CARD
========================================================= */

type ApprovalStatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
  hoverBoxClass: string;
};

function ApprovalStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  hoverBoxClass,
}: ApprovalStatCardProps) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[19px] border border-[#d8e3ed] bg-white p-4 shadow-[0_7px_22px_rgba(30,60,90,0.055)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b9d8e9] hover:shadow-[0_12px_28px_rgba(30,70,100,0.09)]">

      <div
        className={`pointer-events-none absolute inset-2.5 rounded-[15px] border opacity-0 scale-[0.97] transition-all duration-250 ease-out group-hover:scale-100 group-hover:opacity-100 ${hoverBoxClass}`}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#687c93]">
            {title}
          </p>

          <p className="mt-2 font-serif text-[28px] font-bold leading-none text-[#0b1728]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon
            size={18}
            strokeWidth={1.8}
          />
        </div>

      </div>

      <p className="relative z-10 mt-4 text-[10px] leading-5 text-[#7890a8]">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

type FilterButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
};

function FilterButton({
  active,
  onClick,
  label,
  count,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-full
        px-3.5 py-2
        text-[11px] font-semibold
        transition-all duration-200
        ${
          active
            ? "bg-[#17263a] text-white shadow-sm"
            : "border border-[#dce6ee] bg-[#f8fbfd] text-[#667b91] hover:border-[#b8d5e6] hover:bg-white hover:text-[#3989b7]"
        }
      `}
    >
      {label}

      <span
        className={`
          rounded-full px-1.5 py-0.5 text-[9px]
          ${
            active
              ? "bg-white/15 text-white"
              : "bg-white text-[#8194a8]"
          }
        `}
      >
        {count}
      </span>
    </button>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

type EmptyStateProps = {
  filter: FilterType;
  searchTerm: string;
};

function EmptyState({
  filter,
  searchTerm,
}: EmptyStateProps) {
  const hasSearch =
    searchTerm.trim().length > 0;

  let title =
    "No applications found";

  let description =
    "There are no student applications to display.";

  if (hasSearch) {
    title = "No matching applications";

    description =
      "Try searching with a different name, email or Campus ID.";
  } else if (filter === "pending") {
    title =
      "No pending applications";

    description =
      "There are currently no student registrations waiting for faculty approval.";
  } else if (filter === "approved") {
    title =
      "No approved applications";

    description =
      "No student registrations have been approved yet.";
  } else if (filter === "rejected") {
    title =
      "No rejected applications";

    description =
      "No student registrations have been rejected.";
  }

  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">

      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf7fc] text-[#54a8d5]">
        <GraduationCap
          size={30}
          strokeWidth={1.6}
        />
      </div>

      <h3 className="font-serif text-[18px] font-bold text-[#142238]">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-[12px] leading-5 text-[#7a8da1]">
        {description}
      </p>

      {!hasSearch &&
        filter === "all" && (
          <p className="mt-1 text-[11px] text-[#9aaaba]">
            New applications will appear here.
          </p>
        )}

    </div>
  );
}

/* =========================================================
   STUDENT APPLICATION ROW
========================================================= */

type StudentApplicationRowProps = {
  student: Student;
  actionLoading: string | null;
  onApprove: (
    student: Student
  ) => void;
  onReject: (
    student: Student
  ) => void;
};

function StudentApplicationRow({
  student,
  actionLoading,
  onApprove,
  onReject,
}: StudentApplicationRowProps) {
  const pending = isPending(
    student.approvalStatus
  );

  const approved = isApproved(
    student.approvalStatus
  );

  const rejected = isRejected(
    student.approvalStatus
  );

  return (
    <div className="group relative p-5 transition-all duration-200 hover:bg-[#f9fbfd] sm:px-6">

      {/* Premium hover accent — appears only when cursor enters this application */}
      <span
        className="pointer-events-none absolute left-2 top-2 h-2 w-2 scale-50 rounded-[3px] bg-[#54bce5] opacity-0 shadow-[0_0_12px_rgba(84,188,229,0.75)] transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* STUDENT INFO */}

        <div className="flex min-w-0 items-start gap-4">

          <div
            className="
              flex h-12 w-12 shrink-0 items-center justify-center
              overflow-hidden rounded-xl bg-[#e9f5fb] text-[#4c9ec9]
              transition-all duration-200 ease-out
              group-hover:scale-[1.04]
              group-hover:bg-[#69c9ed]
              group-hover:text-white
              group-hover:shadow-[0_8px_20px_rgba(84,188,229,0.24)]
            "
          >

            {student.profileImage ? (
              <img
                src={
                  student.profileImage
                }
                alt={student.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User
                size={21}
              />
            )}

          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="truncate text-[14px] font-bold text-[#142238]">
                {student.name}
              </h3>

              {pending && (
                <StatusBadge
                  label="Pending"
                  className="bg-[#fff7e8] text-[#c98700]"
                  icon={
                    <Clock3 size={11} />
                  }
                />
              )}

              {approved && (
                <StatusBadge
                  label="Approved"
                  className="bg-[#edf9f3] text-[#32946b]"
                  icon={
                    <CheckCircle2
                      size={11}
                    />
                  }
                />
              )}

              {rejected && (
                <StatusBadge
                  label="Rejected"
                  className="bg-[#fff0f0] text-[#d55b5b]"
                  icon={
                    <UserX size={11} />
                  }
                />
              )}

            </div>

            <div className="mt-2 flex flex-col gap-1.5 text-[11px] text-[#71849a] sm:flex-row sm:flex-wrap sm:gap-x-5">

              <span className="inline-flex items-center gap-2 transition-colors duration-200 group-hover:text-[#4f93b9]">
                <Mail
                  size={14}
                  className="transition-colors duration-200 group-hover:text-[#54bce5]"
                />
                {student.email}
              </span>

              {student.campusUserId && (
                <span className="inline-flex items-center gap-2 transition-colors duration-200 group-hover:text-[#4f93b9]">
                  <GraduationCap
                    size={14}
                    className="transition-colors duration-200 group-hover:text-[#54bce5]"
                  />
                  {student.campusUserId}
                </span>
              )}

            </div>

            <p className="mt-2 text-[10px] text-[#9aaaba]">
              Registration submitted on{" "}
              {formatDate(
                student.createdAt
              )}
            </p>

            {student.rejectionReason &&
              rejected && (
                <p className="mt-2 max-w-[650px] rounded-lg bg-[#fff7f7] px-3 py-2 text-[10px] leading-5 text-[#a76565]">
                  <span className="font-semibold">
                    Reason:
                  </span>{" "}
                  {
                    student.rejectionReason
                  }
                </p>
              )}

          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">

          {pending && (
            <>
              <button
                type="button"
                onClick={() =>
                  onApprove(student)
                }
                disabled={
                  actionLoading ===
                  student.id
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3da678] px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#329267] hover:shadow-[0_6px_16px_rgba(61,166,120,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ===
                student.id ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={14} />
                )}

                Approve
              </button>

              <button
                type="button"
                onClick={() =>
                  onReject(student)
                }
                disabled={
                  actionLoading ===
                  student.id
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#efcaca] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#d25e5e] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff5f5] hover:shadow-[0_6px_16px_rgba(210,94,94,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserX
                  size={14}
                />

                Reject
              </button>
            </>
          )}

          {approved && (
            <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ccebdc] bg-[#f3fbf7] px-4 py-2.5 text-[11px] font-semibold text-[#35956c]">
              <CheckCircle2
                size={14}
              />
              Approved
            </div>
          )}

          {rejected && (
            <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f0d0d0] bg-[#fff7f7] px-4 py-2.5 text-[11px] font-semibold text-[#d05f5f]">
              <UserX
                size={14}
              />
              Rejected
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

type StatusBadgeProps = {
  label: string;
  className: string;
  icon: React.ReactNode;
};

function StatusBadge({
  label,
  className,
  icon,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}