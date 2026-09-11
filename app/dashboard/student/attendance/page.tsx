"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bell,
  BookOpen,
  Users,
  ArrowRight,
  ChevronRight,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Clock3,
  BarChart3,
  CalendarCheck2,
  MapPin,
  Trophy,
  UsersRound,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type Subject = {
  id: string;
  name: string;
  semester: number;
};

type Registration = {
  id?: string;
  studentId?: string;
  subjectId: string;
  semester: number;
  section: string;
  subject?: Subject | null;
};

type ClassSession = {
  id: string;
  subjectId: string;
  semester: number;
  section: string;
  sessionDate: string;
};

type ClassAttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  subjectId: string;
  status: string;
  markedAt: string;
  updatedAt: string;

  subject?: Subject | null;

  session?: ClassSession | null;
};

type EventAttendanceRecord = {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  markedAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
    description?: string | null;
    venue?: string | null;
    clubId?: string;
    eventDate: string;
    image?: string | null;
    club?: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type StudentUser = {
  id?: string;
  name?: string;
  email?: string;
  campusUserId?: string;
  profileImage?: string | null;
};

type AttendanceResponse = {
  success?: boolean;
  message?: string;

  student?: StudentUser;

  registeredSubjects?: Subject[];

  registrations?: Registration[];

  classAttendance?: ClassAttendanceRecord[];

  attendance?: ClassAttendanceRecord[];

  subjectStats?: Array<{
    subjectId: string;
    subjectName: string;
    semester: number;
    total: number;
    present: number;
    absent: number;
    percentage: number;
  }>;

  eventAttendance?: EventAttendanceRecord[];

  overall?: {
    present?: number;
    absent?: number;
    total?: number;
    percentage?: number;
    classPresent?: number;
    classAbsent?: number;
    classTotal?: number;
    eventPresent?: number;
    eventAbsent?: number;
    eventTotal?: number;
  };
};

/* ============================================================
   HELPERS
============================================================ */

function safeArray<T>(
  value: unknown
): T[] {
  return Array.isArray(value)
    ? (value as T[])
    : [];
}

/* ============================================================
   DATE
============================================================ */

function getLocalDateKey(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return "—";
  }

  /*
   * Event/class dates are calendar dates.
   * Do not let browser timezone conversion
   * change the actual stored date.
   *
   * Example:
   * 2026-09-12T00:00:00.000Z
   * should always display as:
   * 12 Sep 2026
   */
  const datePart =
    rawValue.includes("T")
      ? rawValue.split("T")[0]
      : rawValue.slice(0, 10);

  const parts = datePart.split("-");

  if (parts.length !== 3) {
    return "—";
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "—";
  }

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

/* ============================================================
   STATUS
============================================================ */

function normalizeStatus(
  status?: string | null
): string {
  return String(
    status || "Absent"
  )
    .trim()
    .toUpperCase();
}

/* ============================================================
   STORED STUDENT
============================================================ */

function getStoredStudent(): StudentUser {
  if (
    typeof window ===
    "undefined"
  ) {
    return {};
  }

  const keys = [
    "user",
    "student",
    "studentUser",
    "currentStudent",
  ];

  for (const key of keys) {
    try {
      const value =
        localStorage.getItem(key);

      if (!value) {
        continue;
      }

      const parsed =
        JSON.parse(value);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        return parsed as StudentUser;
      }
    } catch {
      continue;
    }
  }

  return {};
}

/* ============================================================
   NORMALIZE SUBJECTS
============================================================ */

function normalizeRegisteredSubjects(
  data: AttendanceResponse
): Subject[] {
  const result =
    new Map<string, Subject>();

  /*
   * Preferred API field.
   */
  for (const subject of safeArray<Subject>(
    data.registeredSubjects
  )) {
    if (
      subject &&
      subject.id &&
      subject.name
    ) {
      result.set(subject.id, {
        id: subject.id,
        name: subject.name,
        semester: Number(
          subject.semester
        ),
      });
    }
  }

  /*
   * Also support registrations[].subject.
   */
  for (const registration of safeArray<Registration>(
    data.registrations
  )) {
    const subject =
      registration.subject;

    if (
      subject &&
      subject.id &&
      subject.name
    ) {
      result.set(subject.id, {
        id: subject.id,
        name: subject.name,
        semester: Number(
          subject.semester
        ),
      });
    }
  }

  /*
   * Fallback:
   * derive subjects from attendance records.
   */
  const attendanceRecords =
    safeArray<ClassAttendanceRecord>(
      data.classAttendance ||
        data.attendance
    );

  for (const record of attendanceRecords) {
    const subject =
      record.subject;

    if (
      subject &&
      subject.id &&
      subject.name
    ) {
      result.set(subject.id, {
        id: subject.id,
        name: subject.name,
        semester: Number(
          subject.semester
        ),
      });
    }
  }

  return Array.from(
    result.values()
  ).sort((a, b) => {
    if (
      a.semester !==
      b.semester
    ) {
      return (
        a.semester -
        b.semester
      );
    }

    return a.name.localeCompare(
      b.name
    );
  });
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function StudentAttendancePage() {
  /* ==========================================================
     UI STATE
  ========================================================== */

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     STUDENT
  ========================================================== */

  const [student, setStudent] =
    useState<StudentUser>({});

  /* ==========================================================
     ATTENDANCE
  ========================================================== */

  const [
    classAttendance,
    setClassAttendance,
  ] =
    useState<ClassAttendanceRecord[]>(
      []
    );

  const [
    eventAttendance,
    setEventAttendance,
  ] =
    useState<EventAttendanceRecord[]>([]);

  const [selectedEventId, setSelectedEventId] =
    useState<string>("");

  const [
    registeredSubjects,
    setRegisteredSubjects,
  ] =
    useState<Subject[]>([]);

  /* ==========================================================
     SELECTED SUBJECT
  ========================================================== */

  const [
    selectedSubjectId,
    setSelectedSubjectId,
  ] =
    useState<string>("");

  /* ==========================================================
     FILTERS
  ========================================================== */

  const [
    dateFilter,
    setDateFilter,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "ALL" | "PRESENT" | "ABSENT"
    >("ALL");

  const [
    search,
    setSearch,
  ] = useState("");

  /* ==========================================================
     LOAD ATTENDANCE
  ========================================================== */

  const loadAttendance =
    useCallback(
      async (
        showRefresh = false
      ) => {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const storedStudent =
            getStoredStudent();

          /*
           * Local storage is used only for display.
           *
           * Actual attendance API must identify
           * the authenticated student from the
           * authenticated session/token.
           */
          setStudent(
            storedStudent
          );

          const response =
            await fetch(
              "/api/student/attendance",
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

          let data: AttendanceResponse =
            {};

          try {
            data =
              (await response.json()) as AttendanceResponse;
          } catch {
            data = {};
          }

          if (
            !response.ok ||
            data.success === false
          ) {
            throw new Error(
              data.message ||
                "Unable to load student attendance."
            );
          }

          /*
           * Student returned by API.
           */
          if (
            data.student &&
            typeof data.student ===
              "object"
          ) {
            setStudent(
              data.student
            );
          }

          /*
           * Only registered subjects.
           */
          const subjects =
            normalizeRegisteredSubjects(
              data
            );

          const records =
            safeArray<ClassAttendanceRecord>(
              data.classAttendance ||
                data.attendance
            );

          const eventRecords =
            safeArray<EventAttendanceRecord>(
              data.eventAttendance
            );

          setRegisteredSubjects(
            subjects
          );

          setClassAttendance(
            records
          );

          setEventAttendance(
            eventRecords
          );

          setSelectedEventId((current) => {
            if (
              current &&
              eventRecords.some(
                (record) => record.eventId === current
              )
            ) {
              return current;
            }

            return eventRecords[0]?.eventId || "";
          });

          /*
           * Keep currently selected subject
           * if it still exists.
           *
           * Otherwise select nothing.
           */
          setSelectedSubjectId(
            (current) => {
              if (
                current &&
                subjects.some(
                  (subject) =>
                    subject.id ===
                    current
                )
              ) {
                return current;
              }

              return "";
            }
          );
        } catch (err) {
          console.error(
            "STUDENT ATTENDANCE ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load student attendance."
          );

          setClassAttendance(
            []
          );

          setRegisteredSubjects(
            []
          );

          setEventAttendance([]);
          setSelectedEventId("");
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    let cancelled = false;

    const runInitialLoad =
      async () => {
        /*
         * Move the async state updates outside
         * the synchronous effect body.
         */
        await Promise.resolve();

        if (cancelled) {
          return;
        }

        await loadAttendance(
          false
        );
      };

    void runInitialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadAttendance]);

  /* ==========================================================
     OVERALL STATS
     
     ALL SUBJECTS COMBINED
  ========================================================== */

  const overallStats =
    useMemo(() => {
      const classTotal = classAttendance.length;

      const classPresent = classAttendance.filter(
        (record) =>
          normalizeStatus(record.status) === "PRESENT"
      ).length;

      const classAbsent = classAttendance.filter(
        (record) =>
          normalizeStatus(record.status) === "ABSENT"
      ).length;

      const eventTotal = eventAttendance.length;

      const eventPresent = eventAttendance.filter(
        (record) =>
          normalizeStatus(record.status) === "PRESENT"
      ).length;

      const eventAbsent = eventAttendance.filter(
        (record) =>
          normalizeStatus(record.status) === "ABSENT"
      ).length;

      const total = classTotal + eventTotal;
      const present = classPresent + eventPresent;
      const absent = classAbsent + eventAbsent;

      const percentage =
        total > 0
          ? Math.round((present / total) * 100)
          : 0;

      return {
        total,
        present,
        absent,
        percentage,
        classTotal,
        classPresent,
        classAbsent,
        eventTotal,
        eventPresent,
        eventAbsent,
      };
    }, [classAttendance, eventAttendance]);

  /* ==========================================================
     SELECTED EVENT
  ========================================================== */

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) {
      return null;
    }

    return (
      eventAttendance.find(
        (record) => record.eventId === selectedEventId
      ) || null
    );
  }, [eventAttendance, selectedEventId]);

  const eventRecords = useMemo(() => {
    if (!selectedEventId) {
      return [];
    }

    return eventAttendance
      .filter((record) => record.eventId === selectedEventId)
      .sort((a, b) => {
        const aDate = new Date(a.event?.eventDate || a.markedAt).getTime();
        const bDate = new Date(b.event?.eventDate || b.markedAt).getTime();
        return bDate - aDate;
      });
  }, [eventAttendance, selectedEventId]);

  /* ==========================================================
     SELECTED SUBJECT
  ========================================================== */

  const selectedSubject =
    useMemo(() => {
      if (
        !selectedSubjectId
      ) {
        return null;
      }

      return (
        registeredSubjects.find(
          (subject) =>
            subject.id ===
            selectedSubjectId
        ) || null
      );
    }, [
      registeredSubjects,
      selectedSubjectId,
    ]);

  /* ==========================================================
     SUBJECT RECORDS
  ========================================================== */

  const selectedSubjectRecords =
    useMemo(() => {
      if (
        !selectedSubjectId
      ) {
        return [];
      }

      return classAttendance
        .filter(
          (record) =>
            record.subjectId ===
            selectedSubjectId
        )
        .sort(
          (a, b) => {
            const aDate =
              new Date(
                a.session
                  ?.sessionDate ||
                  a.markedAt
              ).getTime();

            const bDate =
              new Date(
                b.session
                  ?.sessionDate ||
                  b.markedAt
              ).getTime();

            return (
              bDate - aDate
            );
          }
        );
    }, [
      classAttendance,
      selectedSubjectId,
    ]);

  /* ==========================================================
     SUBJECT STATS
  ========================================================== */

  const selectedSubjectStats =
    useMemo(() => {
      const records =
        selectedSubjectRecords;

      const total =
        records.length;

      const present =
        records.filter(
          (record) =>
            normalizeStatus(
              record.status
            ) === "PRESENT"
        ).length;

      const absent =
        records.filter(
          (record) =>
            normalizeStatus(
              record.status
            ) === "ABSENT"
        ).length;

      const late =
        records.filter(
          (record) =>
            normalizeStatus(
              record.status
            ) === "LATE"
        ).length;

      const effectivePresent =
        present + late;

      const percentage =
        total > 0
          ? Math.round(
              (effectivePresent /
                total) *
                100
            )
          : 0;

      return {
        total,
        present,
        absent,
        late,
        percentage,
      };
    }, [selectedSubjectRecords]);

  /* ==========================================================
     FILTERED SUBJECT RECORDS
  ========================================================== */

  const filteredSubjectRecords =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return selectedSubjectRecords.filter(
        (record) => {
          const status =
            normalizeStatus(
              record.status
            );

          const recordDate =
            getLocalDateKey(
              record.session
                ?.sessionDate ||
                record.markedAt
            );

          const matchesDate =
            !dateFilter ||
            recordDate ===
              dateFilter;

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            status ===
              statusFilter;

          const subjectName =
            record.subject
              ?.name ||
            selectedSubject
              ?.name ||
            "";

          const sessionDate =
            formatDate(
              record.session
                ?.sessionDate ||
                record.markedAt
            );

          const matchesSearch =
            !searchValue ||
            subjectName
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            status
              .toLowerCase()
              .includes(
                searchValue
              ) ||
            sessionDate
              .toLowerCase()
              .includes(
                searchValue
              );

          return (
            matchesDate &&
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      selectedSubjectRecords,
      selectedSubject,
      dateFilter,
      statusFilter,
      search,
    ]);

  /* ==========================================================
     SELECTED SUBJECT FILTERED STATS
  ========================================================== */

  const filteredStats =
    useMemo(() => {
      const total =
        filteredSubjectRecords.length;

      const present =
        filteredSubjectRecords.filter(
          (record) =>
            normalizeStatus(
              record.status
            ) === "PRESENT"
        ).length;

      const absent =
        filteredSubjectRecords.filter(
          (record) =>
            normalizeStatus(
              record.status
            ) === "ABSENT"
        ).length;

      const late =
        filteredSubjectRecords.filter(
          (record) =>
            normalizeStatus(
              record.status
            ) === "LATE"
        ).length;

      const effectivePresent =
        present + late;

      const percentage =
        total > 0
          ? Math.round(
              (effectivePresent /
                total) *
                100
            )
          : 0;

      return {
        total,
        present,
        absent,
        late,
        percentage,
      };
    }, [
      filteredSubjectRecords,
    ]);

  /* ==========================================================
     CLEAR FILTERS
  ========================================================== */

  function clearFilters() {
    setDateFilter("");
    setStatusFilter("ALL");
    setSearch("");
  }

  /* ==========================================================
     LOGOUT
  ========================================================== */

  async function handleLogout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials:
            "include",
        }
      );
    } catch (logoutError) {
      console.error(
        "Logout error:",
        logoutError
      );
    }

    try {
      localStorage.removeItem(
        "token"
      );
      localStorage.removeItem(
        "user"
      );
      localStorage.removeItem(
        "student"
      );
      localStorage.removeItem(
        "studentUser"
      );
      localStorage.removeItem(
        "currentStudent"
      );
    } catch (storageError) {
      console.error(
        "Storage cleanup error:",
        storageError
      );
    }

    window.location.href =
      "/auth/login";
  }

  /* ==========================================================
     MOBILE MENU
  ========================================================== */

  function closeMobileMenu() {
    setMobileMenu(false);
  }

  /* ==========================================================
     DISPLAY
  ========================================================== */

  const studentName =
    student.name ||
    "Student";

  const studentEmail =
    student.email ||
    "CampusConnect User";

  const initials =
    studentName
      .split(" ")
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "S";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
      {/* ======================================================
          MOBILE HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <GraduationCap
              size={21}
              className="text-white"
            />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              CampusConnect
            </p>

            <p className="text-[11px] text-emerald-600">
              Student Portal
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMobileMenu(
              (value) => !value
            )
          }
          aria-label={
            mobileMenu
              ? "Close menu"
              : "Open menu"
          }
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
        >
          {mobileMenu ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </header>

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#071c16] text-white shadow-2xl transition-transform duration-300 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-[82px] shrink-0 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <GraduationCap
              size={23}
            />
          </div>

          <div>
            <h1 className="text-lg font-bold">
              CampusConnect
            </h1>

            <p className="text-xs text-emerald-300/70">
              Student Portal
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Main Menu
          </p>

          <nav className="space-y-1">
            <SidebarItem
              href="/dashboard/student"
              icon={
                <LayoutDashboard
                  size={18}
                />
              }
              label="Dashboard"
              onNavigate={
                closeMobileMenu
              }
            />

            <SidebarItem
              href="/clubs"
              icon={
                <Building2
                  size={18}
                />
              }
              label="Clubs"
              onNavigate={
                closeMobileMenu
              }
            />

            <SidebarItem
              href="/events"
              icon={
                <CalendarDays
                  size={18}
                />
              }
              label="Events"
              onNavigate={
                closeMobileMenu
              }
            />

            <SidebarItem
              href="/activities"
              icon={
                <BookOpen
                  size={18}
                />
              }
              label="Activities"
              onNavigate={
                closeMobileMenu
              }
            />

            <SidebarItem
              href="/dashboard/student/attendance"
              icon={
                <ClipboardCheck
                  size={18}
                />
              }
              label="Attendance"
              active
              onNavigate={
                closeMobileMenu
              }
            />

            <SidebarItem
              href="/notifications"
              icon={
                <Bell size={18} />
              }
              label="Notifications"
              onNavigate={
                closeMobileMenu
              }
            />
          </nav>

          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Campus
          </p>

          <nav className="space-y-1">
            <SidebarItem
              href="/clubs"
              icon={
                <Users size={18} />
              }
              label="My Clubs"
              onNavigate={
                closeMobileMenu
              }
            />

            <SidebarItem
              href="/events"
              icon={
                <CalendarDays
                  size={18}
                />
              }
              label="My Events"
              onNavigate={
                closeMobileMenu
              }
            />
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 font-bold">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {studentName}
              </p>

              <p className="truncate text-xs text-slate-400">
                {studentEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut
              size={18}
            />

            Logout
          </button>
        </div>
      </aside>

      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={
            closeMobileMenu
          }
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="min-h-screen w-full lg:ml-[270px] lg:w-[calc(100%-270px)]">
        {/* TOPBAR */}

        <header className="sticky top-0 z-30 hidden h-[82px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:flex xl:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Student Portal
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Track your academic
              attendance.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
            >
              <Bell
                size={19}
              />
            </Link>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                {initials}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {studentName}
                </p>

                <p className="text-xs text-slate-500">
                  Campus Member
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE */}

        <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">
          {/* BACK */}

          <Link
            href="/dashboard/student"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowRight
              size={16}
              className="rotate-180"
            />

            Back to Dashboard
          </Link>

          {/* ==================================================
              HERO
          ================================================== */}

          <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b] p-7 text-white shadow-xl shadow-emerald-900/10 sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

            <div className="pointer-events-none absolute right-[35%] top-10 h-24 w-24 rounded-full border border-emerald-300/10" />

            <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <ClipboardCheck
                    size={13}
                  />

                  Academic Records
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  My Attendance

                  <span className="block text-emerald-300">
                    Track your academic
                    progress.
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  View your own
                  subject-wise
                  attendance, present
                  classes, absent
                  classes and complete
                  attendance history.
                </p>
              </div>

              <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-emerald-300/10 bg-emerald-300/10 lg:flex">
                <ClipboardCheck
                  size={46}
                  className="text-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* ==================================================
              OVERALL STATISTICS
          ================================================== */}

          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AttendanceStatCard
              icon={
                <ClipboardCheck
                  size={20}
                />
              }
              title="Overall Attendance"
              value={`${overallStats.percentage}%`}
              description="Classes + events combined"
              type="attendance"
              percentage={
                overallStats.percentage
              }
            />

            <AttendanceStatCard
              icon={
                <CheckCircle2
                  size={20}
                />
              }
              title="Present"
              value={String(
                overallStats.present
              )}
              description="Classes & events attended"
              type="present"
            />

            <AttendanceStatCard
              icon={
                <XCircle
                  size={20}
                />
              }
              title="Absent"
              value={String(
                overallStats.absent
              )}
              description="Classes & events missed"
              type="absent"
            />

            <AttendanceStatCard
              icon={
                <CalendarCheck2
                  size={20}
                />
              }
              title="Total Records"
              value={String(
                overallStats.total
              )}
              description="Classes + event records"
              type="total"
            />
          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {!loading && error && (
            <div className="mb-7 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                <XCircle
                  size={26}
                />
              </div>

              <h2 className="mt-4 text-lg font-bold text-red-800">
                Unable to load
                attendance
              </h2>

              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadAttendance(
                    true
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw
                  size={15}
                />

                Try Again
              </button>
            </div>
          )}

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading && (
            <div className="mb-7 flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2
                  size={32}
                  className="animate-spin text-emerald-500"
                />

                <p className="text-sm">
                  Loading your
                  attendance...
                </p>
              </div>
            </div>
          )}

          {/* ==================================================
              REGISTERED SUBJECTS
          ================================================== */}

          {!loading &&
            !error && (
              <div className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-6 sm:px-7">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                        <BookOpen
                          size={14}
                        />

                        Registered Subjects
                      </div>

                      <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        Subject-wise
                        Attendance
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Only subjects
                        registered by you
                        are shown here.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Registered
                      </p>

                      <p className="mt-1 text-xl font-bold text-emerald-800">
                        {
                          registeredSubjects.length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {registeredSubjects.length ===
                0 ? (
                  <div className="px-6 py-16 text-center sm:px-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                      <BookOpen
                        size={28}
                      />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-slate-800">
                      No registered
                      subjects
                    </h3>

                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                      No subject
                      registration is
                      currently available
                      for your account.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {registeredSubjects.map(
                      (
                        subject
                      ) => {
                        const subjectRecords =
                          classAttendance.filter(
                            (record) =>
                              record.subjectId ===
                              subject.id
                          );

                        const present =
                          subjectRecords.filter(
                            (record) =>
                              normalizeStatus(
                                record.status
                              ) ===
                              "PRESENT"
                          ).length;

                        const absent =
                          subjectRecords.filter(
                            (record) =>
                              normalizeStatus(
                                record.status
                              ) ===
                              "ABSENT"
                          ).length;

                        const total =
                          subjectRecords.length;

                        const percentage =
                          total >
                          0
                            ? Math.round(
                                (present /
                                  total) *
                                  100
                              )
                            : 0;

                        const selected =
                          selectedSubjectId ===
                          subject.id;

                        return (
                          <button
                            key={
                              subject.id
                            }
                            type="button"
                            onClick={() => {
                              setSelectedSubjectId(
                                subject.id
                              );

                              clearFilters();

                              window.setTimeout(
                                () => {
                                  document
                                    .getElementById(
                                      "selected-subject-attendance"
                                    )
                                    ?.scrollIntoView(
                                      {
                                        behavior:
                                          "smooth",
                                        block:
                                          "start",
                                      }
                                    );
                                },
                                50
                              );
                            }}
                            className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-300 ${
                              selected
                                ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-900/10"
                                : "border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                <BookOpen
                                  size={19}
                                />
                              </div>

                              <ChevronRight
                                size={18}
                                className={`transition ${
                                  selected
                                    ? "translate-x-1 text-emerald-600"
                                    : "text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-500"
                                }`}
                              />
                            </div>

                            <p className="mt-5 line-clamp-2 min-h-[48px] text-sm font-bold leading-6 text-slate-900">
                              {
                                subject.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Semester{" "}
                              {
                                subject.semester
                              }
                            </p>

                            <div className="mt-5 flex items-end justify-between">
                              <div>
                                <p className="text-2xl font-bold text-emerald-700">
                                  {
                                    percentage
                                  }
                                  %
                                </p>

                                <p className="text-[11px] text-slate-400">
                                  attendance
                                </p>
                              </div>

                              <div className="text-right text-[11px]">
                                <p className="font-semibold text-emerald-600">
                                  P{" "}
                                  {
                                    present
                                  }
                                </p>

                                <p className="font-semibold text-red-500">
                                  A{" "}
                                  {
                                    absent
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    Math.max(
                                      percentage,
                                      0
                                    ),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}

          {/* ==================================================
              SELECTED SUBJECT
          ================================================== */}

          {!loading &&
            !error &&
            selectedSubject && (
              <section
                id="selected-subject-attendance"
                className="scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                {/* SUBJECT HEADER */}

                <div className="border-b border-slate-100 bg-gradient-to-br from-white to-emerald-50/40 px-6 py-7 sm:px-8">
                  <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <BarChart3
                          size={25}
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                          Selected Subject
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-slate-900">
                          {
                            selectedSubject.name
                          }
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Semester{" "}
                          {
                            selectedSubject.semester
                          }{" "}
                          • Your personal
                          attendance
                          history
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void loadAttendance(
                          true
                        )
                      }
                      disabled={
                        refreshing
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw
                        size={15}
                        className={
                          refreshing
                            ? "animate-spin"
                            : ""
                        }
                      />

                      {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                    </button>
                  </div>

                  {/* SUBJECT STATS */}

                  <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MiniStat
                      label="Attendance"
                      value={`${filteredStats.percentage}%`}
                      icon={
                        <ClipboardCheck
                          size={17}
                        />
                      }
                      tone="green"
                    />

                    <MiniStat
                      label="Present"
                      value={String(
                        filteredStats.present
                      )}
                      icon={
                        <CheckCircle2
                          size={17}
                        />
                      }
                      tone="green"
                    />

                    <MiniStat
                      label="Absent"
                      value={String(
                        filteredStats.absent
                      )}
                      icon={
                        <XCircle
                          size={17}
                        />
                      }
                      tone="red"
                    />

                    <MiniStat
                      label="Total Classes"
                      value={String(
                        filteredStats.total
                      )}
                      icon={
                        <CalendarCheck2
                          size={17}
                        />
                      }
                      tone="blue"
                    />
                  </div>
                </div>

                {/* FILTER BAR */}

                <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                  <div className="mb-4 flex items-center gap-2">
                    <Filter
                      size={16}
                      className="text-emerald-600"
                    />

                    <p className="text-sm font-bold text-slate-800">
                      Attendance History
                    </p>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                      {
                        filteredSubjectRecords.length
                      }{" "}
                      records
                    </span>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_auto]">
                    {/* SEARCH */}

                    <div className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                          setSearch(
                            event.target
                              .value
                          )
                        }
                        placeholder="Search subject, status or date..."
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    {/* DATE */}

                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="date"
                        value={
                          dateFilter
                        }
                        onChange={(
                          event
                        ) =>
                          setDateFilter(
                            event
                              .target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    {/* STATUS */}

                    <div className="relative">
                      <select
                        value={
                          statusFilter
                        }
                        onChange={(
                          event
                        ) =>
                          setStatusFilter(
                            event
                              .target
                              .value as
                              | "ALL"
                              | "PRESENT"
                              | "ABSENT"
                          )
                        }
                        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      >
                        <option value="ALL">
                          All Status
                        </option>

                        <option value="PRESENT">
                          Present
                        </option>

                        <option value="ABSENT">
                          Absent
                        </option>
                      </select>

                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>

                    {/* CLEAR */}

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Clear
                    </button>
                  </div>

                  {/* ACTIVE FILTERS */}

                  {(dateFilter ||
                    statusFilter !==
                      "ALL" ||
                    search) && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        Filters:
                      </span>

                      {dateFilter && (
                        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {formatDate(
                            `${dateFilter}T00:00:00`
                          )}
                        </span>
                      )}

                      {statusFilter !==
                        "ALL" && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {
                            statusFilter
                          }
                        </span>
                      )}

                      {search && (
                        <span className="max-w-[240px] truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          “{search}”
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* RECORDS */}

                <div className="p-5 sm:p-7">
                  {filteredSubjectRecords.length ===
                  0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                        <CalendarDays
                          size={28}
                        />
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-slate-800">
                        No attendance
                        records found
                      </h3>

                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                        {selectedSubjectRecords.length ===
                        0
                          ? "Faculty has not marked attendance for this subject yet."
                          : "No records match the selected date, status or search filter."}
                      </p>

                      {selectedSubjectRecords.length >
                        0 && (
                        <button
                          type="button"
                          onClick={
                            clearFilters
                          }
                          className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Date
                              </th>

                              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Time
                              </th>

                              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Subject
                              </th>

                              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Section
                              </th>

                              <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredSubjectRecords.map(
                              (
                                record
                              ) => {
                                const status =
                                  normalizeStatus(
                                    record.status
                                  );

                                let statusClass =
                                  "border-slate-200 bg-slate-50 text-slate-600";

                                let statusIcon =
                                  <Clock3
                                    size={
                                      14
                                    }
                                  />;

                                if (
                                  status ===
                                  "PRESENT"
                                ) {
                                  statusClass =
                                    "border-emerald-200 bg-emerald-50 text-emerald-700";

                                  statusIcon =
                                    <CheckCircle2
                                      size={
                                        14
                                      }
                                    />;
                                }

                                if (
                                  status ===
                                  "ABSENT"
                                ) {
                                  statusClass =
                                    "border-red-200 bg-red-50 text-red-700";

                                  statusIcon =
                                    <XCircle
                                      size={
                                        14
                                      }
                                    />;
                                }

                                if (
                                  status ===
                                  "LATE"
                                ) {
                                  statusClass =
                                    "border-amber-200 bg-amber-50 text-amber-700";

                                  statusIcon =
                                    <Clock3
                                      size={
                                        14
                                      }
                                    />;
                                }

                                const sessionDate =
                                  record
                                    .session
                                    ?.sessionDate ||
                                  record.markedAt;

                                return (
                                  <tr
                                    key={
                                      record.id
                                    }
                                    className="border-b border-slate-100 transition last:border-0 hover:bg-emerald-50/30"
                                  >
                                    <td className="px-5 py-5">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                          <CalendarDays
                                            size={
                                              17
                                            }
                                          />
                                        </div>

                                        <div>
                                          <p className="text-sm font-semibold text-slate-800">
                                            {formatDate(
                                              sessionDate
                                            )}
                                          </p>

                                          <p className="mt-0.5 text-xs text-slate-400">
                                            Class
                                            session
                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="px-5 py-5">
                                      <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock3
                                          size={
                                            15
                                          }
                                          className="text-slate-400"
                                        />

                                        {formatTime(
                                          record.markedAt
                                        )}
                                      </div>
                                    </td>

                                    <td className="px-5 py-5">
                                      <p className="text-sm font-semibold text-slate-800">
                                        {record
                                          .subject
                                          ?.name ||
                                          selectedSubject.name}
                                      </p>

                                      <p className="mt-0.5 text-xs text-slate-400">
                                        Semester{" "}
                                        {
                                          selectedSubject.semester
                                        }
                                      </p>
                                    </td>

                                    <td className="px-5 py-5">
                                      <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                        {record
                                          .session
                                          ?.section ||
                                          "—"}
                                      </span>
                                    </td>

                                    <td className="px-5 py-5">
                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass}`}
                                      >
                                        {
                                          statusIcon
                                        }

                                        {record.status ||
                                          "Absent"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* ==================================================
              EVENT ATTENDANCE
          ================================================== */}

          {!loading && !error && (
            <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-br from-white to-blue-50/40 px-6 py-7 sm:px-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                      <Trophy size={14} />
                      Campus Events
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      Event Attendance
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      View only your own event attendance records marked by faculty.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      My Events
                    </p>
                    <p className="mt-1 text-xl font-bold text-blue-800">
                      {eventAttendance.length}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MiniStat
                    label="Event Attendance"
                    value={`${eventAttendance.length > 0 ? Math.round((overallStats.eventPresent / overallStats.eventTotal) * 100) : 0}%`}
                    icon={<Trophy size={17} />}
                    tone="blue"
                  />
                  <MiniStat
                    label="Present"
                    value={String(overallStats.eventPresent)}
                    icon={<CheckCircle2 size={17} />}
                    tone="green"
                  />
                  <MiniStat
                    label="Absent"
                    value={String(overallStats.eventAbsent)}
                    icon={<XCircle size={17} />}
                    tone="red"
                  />
                </div>
              </div>

              {eventAttendance.length === 0 ? (
                <div className="px-6 py-16 text-center sm:px-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                    <Trophy size={28} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-800">
                    No event attendance yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                    When faculty marks your attendance for a campus event, it will automatically appear here and will also be included in your overall attendance.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {eventAttendance.map((record) => {
                    const selected = record.eventId === selectedEventId;
                    const present = normalizeStatus(record.status) === "PRESENT";

                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => {
                          setSelectedEventId(record.eventId);
                          window.setTimeout(() => {
                            document
                              .getElementById("selected-event-attendance")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }, 50);
                        }}
                        className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-300 ${
                          selected
                            ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-900/10"
                            : "border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <Trophy size={19} />
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                            present
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}>
                            {present ? "Present" : "Absent"}
                          </span>
                        </div>

                        <p className="mt-5 line-clamp-2 min-h-[48px] text-sm font-bold leading-6 text-slate-900">
                          {record.event?.title || "Campus Event"}
                        </p>

                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={13} />
                          {formatDate(record.event?.eventDate || record.markedAt)}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                          <MapPin size={13} />
                          {record.event?.venue || "Venue not available"}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                          <span className="font-semibold text-blue-600">
                            {record.event?.club?.name || "Campus Event"}
                          </span>
                          <ChevronRight size={16} className={`transition ${selected ? "translate-x-1 text-blue-600" : "text-slate-300 group-hover:translate-x-1 group-hover:text-blue-500"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ==================================================
              SELECTED EVENT
          ================================================== */}

          {!loading && !error && selectedEvent && (
            <section
              id="selected-event-attendance"
              className="mt-7 scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 bg-gradient-to-br from-white to-blue-50/40 px-6 py-7 sm:px-8">
                <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                      <Trophy size={25} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                        Selected Event
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-900">
                        {selectedEvent.event?.title || "Campus Event"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(selectedEvent.event?.eventDate || selectedEvent.markedAt)}
                        {selectedEvent.event?.venue ? ` • ${selectedEvent.event.venue}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <MiniStat
                    label="Status"
                    value={normalizeStatus(selectedEvent.status) === "PRESENT" ? "Present" : "Absent"}
                    icon={normalizeStatus(selectedEvent.status) === "PRESENT" ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                    tone={normalizeStatus(selectedEvent.status) === "PRESENT" ? "green" : "red"}
                  />
                  <MiniStat
                    label="Event Date"
                    value={formatDate(selectedEvent.event?.eventDate || selectedEvent.markedAt)}
                    icon={<CalendarDays size={17} />}
                    tone="blue"
                  />
                  <MiniStat
                    label="Marked At"
                    value={formatTime(selectedEvent.markedAt)}
                    icon={<Clock3 size={17} />}
                    tone="blue"
                  />
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Event</th>
                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Date</th>
                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Venue</th>
                          <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventRecords.map((record) => {
                          const present = normalizeStatus(record.status) === "PRESENT";
                          return (
                            <tr key={record.id} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/30">
                              <td className="px-5 py-5">
                                <p className="text-sm font-semibold text-slate-800">{record.event?.title || "Campus Event"}</p>
                                <p className="mt-0.5 text-xs text-slate-400">{record.event?.club?.name || "Campus Event"}</p>
                              </td>
                              <td className="px-5 py-5 text-sm text-slate-600">{formatDate(record.event?.eventDate || record.markedAt)}</td>
                              <td className="px-5 py-5 text-sm text-slate-600">{record.event?.venue || "—"}</td>
                              <td className="px-5 py-5">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${present ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                                  {present ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                  {present ? "Present" : "Absent"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4">
                  <UsersRound size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <p className="text-xs leading-5 text-blue-800">
                    This event record belongs only to your account. Event attendance is separate from subject attendance, but it is included in the overall attendance shown at the top.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ==================================================
              SECURITY NOTE
          ================================================== */}

          {!loading &&
            !error && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Your attendance is
                      private
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      This page displays only
                      your own registered
                      subjects and your own
                      attendance records.
                      Attendance is marked by
                      faculty and is
                      read-only for students.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* FOOTER */}

          <footer className="mt-8 border-t border-slate-200 py-6">
            <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
              <p>
                © 2026 CampusConnect.
                Smart Campus
                Management.
              </p>

              <p>
                Student Portal
              </p>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   SIDEBAR ITEM
============================================================ */

function SidebarItem({
  href,
  icon,
  label,
  active = false,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-950/30"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <span
        className={`transition ${
          active
            ? "text-white"
            : "text-slate-500 group-hover:text-emerald-300"
        }`}
      >
        {icon}
      </span>

      <span>
        {label}
      </span>

      {active && (
        <ChevronRight
          size={15}
          className="ml-auto text-white/70"
        />
      )}
    </Link>
  );
}

/* ============================================================
   MAIN STAT CARD
============================================================ */

function AttendanceStatCard({
  icon,
  title,
  value,
  description,
  type,
  percentage = 0,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  type:
    | "attendance"
    | "present"
    | "absent"
    | "total";
  percentage?: number;
}) {
  let iconClass =
    "bg-emerald-50 text-emerald-500";

  if (type === "absent") {
    iconClass =
      "bg-red-50 text-red-500";
  }

  if (type === "total") {
    iconClass =
      "bg-blue-50 text-blue-500";
  }

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

      {type ===
        "attendance" && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
            style={{
              width: `${Math.min(
                Math.max(
                  percentage,
                  0
                ),
                100
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MINI SUBJECT STAT
============================================================ */

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone:
    | "green"
    | "red"
    | "blue";
}) {
  let wrapper =
    "border-slate-200 bg-white";

  let iconClass =
    "bg-slate-50 text-slate-500";

  let valueClass =
    "text-slate-900";

  if (tone === "green") {
    wrapper =
      "border-emerald-100 bg-emerald-50/50";

    iconClass =
      "bg-white text-emerald-600";

    valueClass =
      "text-emerald-700";
  }

  if (tone === "red") {
    wrapper =
      "border-red-100 bg-red-50/40";

    iconClass =
      "bg-white text-red-500";

    valueClass =
      "text-red-600";
  }

  if (tone === "blue") {
    wrapper =
      "border-blue-100 bg-blue-50/40";

    iconClass =
      "bg-white text-blue-500";

    valueClass =
      "text-blue-600";
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${wrapper}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p
        className={`mt-3 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}