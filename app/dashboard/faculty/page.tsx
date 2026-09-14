"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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

import type { ElementType } from "react";
import { useRouter } from "next/navigation";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* =========================================================
   TYPES
========================================================= */

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  facultyId?: string;
  campusUserId?: string | null;
  role?: string;
  approvalStatus?: string;
};

type FacultyStats = {
  students: number;
  pendingApprovals: number;
  attendance: number;
  upcomingEvents: number;
};

type AttendanceSubject = {
  key: string;
  subjectId: string;
  subjectName: string;
  semester: number;
  section: string;
  sessionDate: string | null;
  expectedStudents: number;
  markedStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  completion: number;
  status: "MARKED" | "UNMARKED";
};

type AttendanceOverview = {
  totalSessions: number;
  markedSessions: number;
  unmarkedSessions: number;
  averageCompletion: number;
  subjects: AttendanceSubject[];
};

/* =========================================================
   DEFAULT DATA
========================================================= */

const DEFAULT_USER: FacultyUser = {
  name: "Faculty",
  email: "faculty@campusconnect.com",
  facultyId: "FACULTY",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
};

const DEFAULT_STATS: FacultyStats = {
  students: 0,
  pendingApprovals: 0,
  attendance: 0,
  upcomingEvents: 0,
};

const DEFAULT_OVERVIEW: AttendanceOverview = {
  totalSessions: 0,
  markedSessions: 0,
  unmarkedSessions: 0,
  averageCompletion: 0,
  subjects: [],
};

/* =========================================================
   SIDEBAR NAVIGATION
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

function normalizeSection(
  value: string | null | undefined,
) {
  return String(value ?? "")
    .trim()
    .replace(/^SECTION\s+/i, "")
    .toUpperCase();
}

function formatDate(
  value: string | null,
) {
  if (!value) return "No session";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No session";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatTime(
  value: string | null,
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSessionDateKey(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return getDateKey(date);
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FC"
  );
}

/* =========================================================
   KPI
========================================================= */

function Kpi({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ElementType;
  tone:
    | "blue"
    | "green"
    | "purple"
    | "orange";
}) {
  const tones = {
    blue: {
      icon: "bg-[#54bce5]",
      accent: "text-[#298bb8]",
    },
    green: {
      icon: "bg-[#38a978]",
      accent: "text-[#278f66]",
    },
    purple: {
      icon: "bg-[#7564c5]",
      accent: "text-[#6757ae]",
    },
    orange: {
      icon: "bg-[#dda044]",
      accent: "text-[#c4862d]",
    },
  };

  const colors = tones[tone];

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#dbe6ef] bg-white px-5 py-4 shadow-[0_7px_25px_rgba(23,55,80,0.045)]">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${colors.icon}`}
        >
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-bold uppercase tracking-[0.17em] text-[#7d90a1]">
            {label}
          </p>

          <p className="mt-1 font-serif text-[28px] font-bold leading-none text-[#172b40]">
            {value}
          </p>
        </div>

        <ArrowUpRight
          size={14}
          className={`ml-auto shrink-0 ${colors.accent}`}
        />
      </div>

      <p className="mt-3 truncate text-[8px] text-[#8395a7]">
        {caption}
      </p>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function FacultyDashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<FacultyUser>(
      DEFAULT_USER,
    );

  const [stats, setStats] =
    useState<FacultyStats>(
      DEFAULT_STATS,
    );

  const [overview, setOverview] =
    useState<AttendanceOverview>(
      DEFAULT_OVERVIEW,
    );

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [overviewLoading, setOverviewLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const [semesterFilter, setSemesterFilter] =
    useState("ALL");

  const [sectionFilter, setSectionFilter] =
    useState("ALL");

  const [subjectFilter, setSubjectFilter] =
    useState("ALL");

  /* =========================================================
     LOAD FACULTY
========================================================= */

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

          for (const key of keys) {
            const raw =
              localStorage.getItem(
                key,
              );

            if (!raw) continue;

            try {
              const parsed =
                JSON.parse(
                  raw,
                ) as FacultyUser;

              if (
                parsed &&
                typeof parsed ===
                  "object" &&
                parsed.email
              ) {
                setUser({
                  ...DEFAULT_USER,
                  ...parsed,
                  facultyId:
                    parsed.facultyId ??
                    parsed.campusUserId ??
                    DEFAULT_USER.facultyId,
                });

                break;
              }
            } catch {
              continue;
            }
          }
        } catch {
          // Ignore storage errors.
        }
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, []);

  /* =========================================================
     STATS API
========================================================= */

  const loadStats =
    useCallback(async () => {
      try {
        setStatsLoading(true);

        const response =
          await fetch(
            "/api/faculty/dashboard/stats",
            {
              method: "GET",
              credentials:
                "include",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load faculty stats.",
          );
        }

        setStats({
          students: Number(
            data.stats?.students ??
              0,
          ),
          pendingApprovals:
            Number(
              data.stats
                ?.pendingApprovals ??
                0,
            ),
          attendance: Number(
            data.stats
              ?.attendance ?? 0,
          ),
          upcomingEvents:
            Number(
              data.stats
                ?.upcomingEvents ??
                0,
            ),
        });
      } catch (error) {
        console.error(
          "Faculty stats error:",
          error,
        );

        setStats(
          DEFAULT_STATS,
        );
      } finally {
        setStatsLoading(false);
      }
    }, []);

  /* =========================================================
     OVERVIEW API
========================================================= */

  const loadOverview =
    useCallback(
      async (refresh = false) => {
        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setOverviewLoading(
              true,
            );
          }

          const response =
            await fetch(
              "/api/faculty/dashboard/overview",
              {
                method: "GET",
                credentials:
                  "include",
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                },
              },
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load attendance overview.",
            );
          }

          setOverview(
            data.attendanceOverview ??
              DEFAULT_OVERVIEW,
          );
        } catch (error) {
          console.error(
            "Faculty overview error:",
            error,
          );

          setOverview(
            DEFAULT_OVERVIEW,
          );
        } finally {
          setOverviewLoading(
            false,
          );
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadStats();
        void loadOverview();
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [
    loadStats,
    loadOverview,
  ]);

  /* =========================================================
     FILTER OPTIONS
========================================================= */

  const semesters = useMemo(() => {
    return Array.from(
      new Set(
        overview.subjects
          .map(
            (item) =>
              item.semester,
          )
          .filter(
            Number.isFinite,
          ),
      ),
    ).sort(
      (a, b) => a - b,
    );
  }, [
    overview.subjects,
  ]);

  const sections = useMemo(() => {
    return Array.from(
      new Set(
        overview.subjects
          .filter(
            (item) =>
              semesterFilter ===
                "ALL" ||
              String(
                item.semester,
              ) ===
                semesterFilter,
          )
          .map((item) =>
            normalizeSection(
              item.section,
            ),
          )
          .filter(Boolean),
      ),
    ).sort();
  }, [
    overview.subjects,
    semesterFilter,
  ]);

  const subjects = useMemo(() => {
    return Array.from(
      new Map(
        overview.subjects
          .filter(
            (item) =>
              semesterFilter ===
                "ALL" ||
              String(
                item.semester,
              ) ===
                semesterFilter,
          )
          .filter(
            (item) =>
              sectionFilter ===
                "ALL" ||
              normalizeSection(
                item.section,
              ) ===
                sectionFilter,
          )
          .map((item) => [
            item.subjectId,
            {
              id: item.subjectId,
              name:
                item.subjectName,
            },
          ]),
      ).values(),
    ).sort((a, b) =>
      a.name.localeCompare(
        b.name,
      ),
    );
  }, [
    overview.subjects,
    semesterFilter,
    sectionFilter,
  ]);

  /* =========================================================
     FILTERED ATTENDANCE
========================================================= */

  const filteredSubjects =
    useMemo(() => {
      return overview.subjects.filter(
        (item) => {
          const semesterMatch =
            semesterFilter ===
              "ALL" ||
            String(
              item.semester,
            ) ===
              semesterFilter;

          const sectionMatch =
            sectionFilter ===
              "ALL" ||
            normalizeSection(
              item.section,
            ) ===
              sectionFilter;

          const subjectMatch =
            subjectFilter ===
              "ALL" ||
            item.subjectId ===
              subjectFilter;

          return (
            semesterMatch &&
            sectionMatch &&
            subjectMatch
          );
        },
      );
    }, [
      overview.subjects,
      semesterFilter,
      sectionFilter,
      subjectFilter,
    ]);

  /* =========================================================
     ATTENDANCE ANALYTICS
========================================================= */

  const todaySubjects = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayKey = `${year}-${month}-${day}`;

    return filteredSubjects
      .filter((item) => {
        if (!item.sessionDate) return false;
        const date = new Date(item.sessionDate);
        if (Number.isNaN(date.getTime())) return false;
        const itemKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        return itemKey === todayKey;
      })
      .sort(
        (a, b) =>
          new Date(a.sessionDate ?? 0).getTime() -
          new Date(b.sessionDate ?? 0).getTime(),
      );
  }, [filteredSubjects]);

  /* =========================================================
     ATTENDANCE ANALYTICS
  ========================================================= */

  const analytics =
    useMemo(() => {
      return filteredSubjects.reduce(
        (acc, item) => {
          acc.present += item.present;
          acc.absent += item.absent;
          acc.late += item.late;
          acc.excused += item.excused;

          acc.expected +=
            item.expectedStudents;

          acc.marked +=
            item.markedStudents;

          if (
            item.status ===
            "MARKED"
          ) {
            acc.markedGroups += 1;
          }

          if (
            item.status ===
            "UNMARKED"
          ) {
            acc.unmarkedGroups += 1;
          }

          return acc;
        },
        {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          expected: 0,
          marked: 0,
          markedGroups: 0,
          unmarkedGroups: 0,
        },
      );
    }, [
      filteredSubjects,
    ]);

  const attendanceHealth =
    analytics.marked > 0
      ? Math.round(
          ((analytics.present +
            analytics.late +
            analytics.excused) /
            analytics.marked) *
            100,
        )
      : 0;

  const markingCoverage =
    analytics.expected > 0
      ? Math.round(
          (analytics.marked /
            analytics.expected) *
            100,
        )
      : filteredSubjects.length
        ? Math.round(
            filteredSubjects.reduce(
              (
                sum,
                item,
              ) =>
                sum +
                item.completion,
              0,
            ) /
              filteredSubjects.length,
          )
        : 0;

  const pieData = [
    {
      name: "Present",
      value: analytics.present,
    },
    {
      name: "Absent",
      value: analytics.absent,
    },
    {
      name: "Late",
      value: analytics.late,
    },
    {
      name: "Excused",
      value: analytics.excused,
    },
  ].filter(
    (item) =>
      item.value > 0,
  );

  const subjectChartData =
    filteredSubjects
      .slice(0, 8)
      .map((item) => ({
        name:
          item.subjectName.length >
          11
            ? `${item.subjectName.slice(
                0,
                11,
              )}…`
            : item.subjectName,
        coverage:
          item.completion,
        status:
          item.status,
      }));

  const recentSessions = [
    ...filteredSubjects,
  ]
    .sort(
      (a, b) =>
        new Date(
          b.sessionDate ??
            0,
        ).getTime() -
        new Date(
          a.sessionDate ??
            0,
        ).getTime(),
    )
    .slice(0, 5);

  /* =========================================================
     CONTEXT
========================================================= */

  const analyticsContext =
    useMemo(() => {
      if (
        filteredSubjects.length ===
        1
      ) {
        const row =
          filteredSubjects[0];

        return `Semester ${row.semester} • Section ${normalizeSection(
          row.section,
        )} • ${row.subjectName}`;
      }

      if (
        semesterFilter !==
          "ALL" &&
        sectionFilter !==
          "ALL"
      ) {
        return `Semester ${semesterFilter} • Section ${sectionFilter}`;
      }

      if (
        semesterFilter !==
        "ALL"
      ) {
        return `Semester ${semesterFilter}`;
      }

      return "All faculty academic activity";
    }, [
      filteredSubjects,
      semesterFilter,
      sectionFilter,
    ]);

  /* =========================================================
     SIGN OUT
========================================================= */

  async function handleSignOut() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials:
            "include",
          cache: "no-store",
        },
      );
    } catch {
      // Ignore logout API error.
    }

    try {
      [
        "facultyUser",
        "faculty",
        "currentFaculty",
        "user",
        "token",
        "facultyToken",
      ].forEach((key) =>
        localStorage.removeItem(
          key,
        ),
      );
    } catch {
      // Ignore storage error.
    }

    router.replace(
      "/faculty/login",
    );
  }

  const facultyName =
    user.name || "Faculty";

  const facultyEmail =
    user.email ||
    "faculty@campusconnect.com";

  const facultyId =
    user.facultyId ||
    "FACULTY";

  const facultyRole =
    user.role ||
    "Faculty Member";

  /* =========================================================
     RENDER
========================================================= */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#edf4fa] text-[#0d1727]">
      {/* MOBILE OVERLAY */}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setMobileSidebarOpen(
              false,
            )
          }
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-[#24374e] bg-[#0b1423] text-white shadow-[10px_0_38px_rgba(5,15,30,0.15)] transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-[#223149] px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#54bce5]">
              <GraduationCap
                size={23}
              />
            </div>

            <div className="min-w-0">
              <p className="font-serif text-[18px] font-bold text-white">
                CampusConnect
              </p>

              <p className="text-[10px] text-[#8fa4bc]">
                Faculty Command Center
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileSidebarOpen(
                false,
              )
            }
            className="rounded-lg p-2 text-[#91a5ba] hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#60758d]">
            Faculty Workspace
          </p>

          <nav className="space-y-1.5">
            {navigation.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  item.href ===
                  "/dashboard/faculty";

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
                        false,
                      )
                    }
                    className={`group flex h-11 items-center gap-3 rounded-xl px-3.5 text-[12px] font-medium transition ${
                      active
                        ? "bg-[#17273b] text-[#66caf0] shadow-[inset_3px_0_0_#54bce5]"
                        : "text-[#9aacbf] hover:bg-[#142135] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={18}
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
                        size={15}
                        className="ml-auto text-[#63c9ef]"
                      />
                    )}
                  </Link>
                );
              },
            )}
          </nav>

          <div className="mt-7 border-t border-[#223149] pt-5">
            <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#60758d]">
              Account
            </p>

            <Link
              href="/faculty/security"
              className="flex h-11 items-center gap-3 rounded-xl px-3.5 text-[12px] font-medium text-[#9aacbf] transition hover:bg-[#142135] hover:text-white"
            >
              <Settings
                size={18}
                className="text-[#8195ad]"
              />

              Settings
            </Link>

            <button
              type="button"
              onClick={
                handleSignOut
              }
              className="mt-1.5 flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[12px] font-medium text-[#9aacbf] transition hover:bg-[#142135] hover:text-white"
            >
              <LogOut
                size={18}
                className="text-[#8195ad]"
              />

              Sign Out
            </button>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#223149] p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#111e2f] px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#54bce5] text-[12px] font-bold">
              {getInitials(
                facultyName,
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-white">
                {facultyName}
              </p>

              <p className="truncate text-[10px] text-[#8296ae]">
                {facultyRole}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="min-h-screen w-full min-w-0 lg:pl-[270px]">
        <main className="relative min-h-screen overflow-hidden bg-[#edf4fa] px-4 py-5 sm:px-6 lg:px-7">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.04) 1px, transparent 1px)",
                backgroundSize:
                  "44px 44px",
              }}
            />

            <div className="absolute left-[20%] top-[5%] h-[420px] w-[420px] rounded-full bg-[#def1f9] blur-3xl" />

            <div className="absolute right-[5%] top-[35%] h-[300px] w-[300px] rounded-full bg-[#e8f5fa] blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1760px]">
            {/* MOBILE HEADER */}

            <div className="mb-4 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(
                    true,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7e3ed] bg-white text-[#38546b]"
              >
              </button>

              <p className="text-[12px] font-bold text-[#203b52]">
                Faculty Command Center
              </p>

              <Link
                href="/dashboard/faculty/notifications"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7e3ed] bg-white text-[#38546b]"
              >
                <Bell size={17} />
              </Link>
            </div>

            {/* =================================================
                HERO
            ================================================== */}

            <section className="relative overflow-hidden rounded-[28px] border border-[#253d56] bg-gradient-to-br from-[#0b1627] via-[#101e32] to-[#142a40] px-6 py-7 shadow-[0_25px_55px_rgba(7,27,48,0.14)] sm:px-8 lg:px-9">
              <div className="pointer-events-none absolute -right-28 -top-32 h-[350px] w-[350px] rounded-full border border-[#54bce5]/15" />

              <div className="pointer-events-none absolute right-10 top-16 h-[145px] w-[145px] rounded-full border border-[#54bce5]/10" />

              <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.17em] text-[#7fd4f1]">
                    <Sparkles
                      size={12}
                    />
                    Faculty Command Center
                  </div>

                  <h1 className="font-serif text-[31px] font-bold leading-tight text-white sm:text-[42px] lg:text-[47px]">
                    Welcome back,{" "}
                    <span className="text-[#69caed]">
                      {facultyName}
                    </span>
                  </h1>

                  <p className="mt-3 max-w-3xl text-[11px] leading-5 text-[#a6b8ca]">
                    One executive workspace for students, approvals,
                    attendance, campus events, activities and clubs.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#48cb96]/30 bg-[#48cb96]/10 px-3 py-1.5 text-[9px] font-bold text-[#6ddbb5]">
                      <CheckCircle2
                        size={12}
                      />
                      Account Approved
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] text-[#b8c6d4]">
                      <UserCircle
                        size={12}
                      />
                      {facultyId}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] text-[#b8c6d4]">
                      <ShieldCheck
                        size={12}
                      />
                      {facultyRole}
                    </span>
                  </div>
                </div>

                <div className="rounded-[21px] border border-white/10 bg-white/[0.055] p-4 xl:w-[340px]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#7890a9]">
                        Workspace Status
                      </p>

                      <p className="mt-1 text-[14px] font-bold text-white">
                        All systems active
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ba87a]/15 text-[#67d6ad]">
                      <Activity
                        size={18}
                      />
                    </div>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[94%] rounded-full bg-[#54bce5]" />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[8px] text-[#90a7bc]">
                    <span>
                      Faculty portal
                    </span>

                    <span>
                      Operational
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                KPI STRIP
            ================================================== */}

            <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi
                label="Students"
                value={
                  statsLoading
                    ? "..."
                    : String(
                        stats.students,
                      )
                }
                caption="Approved student records"
                icon={Users}
                tone="blue"
              />

              <Kpi
                label="Approvals"
                value={
                  statsLoading
                    ? "..."
                    : String(
                        stats.pendingApprovals,
                      )
                }
                caption="Requests awaiting review"
                icon={CheckCircle2}
                tone="purple"
              />

              <Kpi
                label="Attendance"
                value={
                  statsLoading
                    ? "..."
                    : String(
                        stats.attendance,
                      )
                }
                caption="Stored attendance records"
                icon={ClipboardCheck}
                tone="green"
              />

              <Kpi
                label="Events"
                value={
                  statsLoading
                    ? "..."
                    : String(
                        stats.upcomingEvents,
                      )
                }
                caption="Upcoming campus events"
                icon={CalendarDays}
                tone="orange"
              />
            </section>

            {/* =================================================
                EXECUTIVE OVERVIEW
            ================================================== */}

            <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_0.75fr]">
              <div className="rounded-[24px] border border-[#d7e3ed] bg-white p-5 shadow-[0_10px_30px_rgba(30,60,90,0.045)] sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#438bb8]">
                      Executive Overview
                    </p>

                    <h2 className="mt-1 font-serif text-[25px] font-bold text-[#102136]">
                      Faculty performance snapshot
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf8fd] text-[#4b9fc9]">
                    <TrendingUp
                      size={18}
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <ExecutiveMetric
                    label="Attendance Health"
                    value={`${attendanceHealth}%`}
                    caption={analyticsContext}
                    tone="green"
                    icon={ClipboardCheck}
                  />

                  <ExecutiveMetric
                    label="Marking Coverage"
                    value={`${markingCoverage}%`}
                    caption="Students with attendance status"
                    tone="blue"
                    icon={BarChart3}
                  />

                  <ExecutiveMetric
                    label="Pending Work"
                    value={String(
                      stats.pendingApprovals +
                        overview.unmarkedSessions,
                    )}
                    caption="Approvals + attendance attention"
                    tone="red"
                    icon={AlertCircle}
                  />
                </div>

                <div className="mt-5 border-t border-[#edf2f5] pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#304a61]">
                        Faculty operational health
                      </p>

                      <p className="mt-1 text-[9px] text-[#8294a5]">
                        Based on active workflow signals
                      </p>
                    </div>

                    <span className="text-[10px] font-bold text-[#2c9369]">
                      {overview.unmarkedSessions ===
                        0 &&
                      stats.pendingApprovals ===
                        0
                        ? "Healthy"
                        : "Attention Required"}
                    </span>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf2f5]">
                    <div
                      className={`h-full rounded-full ${
                        overview.unmarkedSessions ===
                          0 &&
                        stats.pendingApprovals ===
                          0
                          ? "bg-[#39ad7b]"
                          : "bg-[#e2a13d]"
                      }`}
                      style={{
                        width: `${
                          overview.unmarkedSessions ===
                            0 &&
                          stats.pendingApprovals ===
                            0
                            ? 92
                            : 68
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* PRIORITY PANEL */}

              <div className="rounded-[24px] border border-[#d7e3ed] bg-white p-5 shadow-[0_10px_30px_rgba(30,60,90,0.045)] sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#438bb8]">
                  Today&apos;s Priority
                </p>

                <h2 className="mt-1 font-serif text-[23px] font-bold text-[#102136]">
                  What needs attention?
                </h2>

                <div className="mt-5 space-y-3">
                  <PriorityRow
                    title="Student approvals"
                    value={String(
                      stats.pendingApprovals,
                    )}
                    subtitle="Requests pending"
                    href="/dashboard/faculty/approvals/students"
                    tone={
                      stats.pendingApprovals >
                      0
                        ? "warning"
                        : "success"
                    }
                  />

                  <PriorityRow
                    title="Attendance"
                    value={String(
                      overview.unmarkedSessions,
                    )}
                    subtitle="Unmarked sessions"
                    href="/dashboard/faculty/attendance"
                    tone={
                      overview.unmarkedSessions >
                      0
                        ? "danger"
                        : "success"
                    }
                  />

                  <PriorityRow
                    title="Events"
                    value={
                      statsLoading
                        ? "..."
                        : String(
                            stats.upcomingEvents,
                          )
                    }
                    subtitle="Upcoming events"
                    href="/dashboard/faculty/events"
                    tone="info"
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                ATTENDANCE FILTER + CHART
            ================================================== */}

            <section className="mt-5 overflow-hidden rounded-[25px] border border-[#d7e3ed] bg-white shadow-[0_10px_30px_rgba(30,60,90,0.05)]">
              <div className="border-b border-[#e8eef3] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#438bb8]">
                      Academic Intelligence
                    </p>

                    <h2 className="mt-1 font-serif text-[25px] font-bold text-[#102136]">
                      Attendance analytics
                    </h2>

                    <p className="mt-1 text-[10px] text-[#7b8fa1]">
                      Exactly filtered by Semester, Section and Subject.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void loadOverview(
                        true,
                      )
                    }
                    disabled={refreshing}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d7e3ed] bg-[#fbfdff] px-3 text-[9px] font-bold text-[#557087] transition hover:border-[#9bcde4] hover:text-[#2d83ae] disabled:opacity-50"
                  >
                    <RefreshCw
                      size={13}
                      className={
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    />
                    Refresh
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <FilterBox
                    label="Semester"
                    value={
                      semesterFilter
                    }
                    onChange={(
                      value,
                    ) => {
                      setSemesterFilter(
                        value,
                      );
                      setSectionFilter(
                        "ALL",
                      );
                      setSubjectFilter(
                        "ALL",
                      );
                    }}
                    options={[
                      {
                        value:
                          "ALL",
                        label:
                          "All Semesters",
                      },
                      ...semesters.map(
                        (
                          semester,
                        ) => ({
                          value:
                            String(
                              semester,
                            ),
                          label: `Semester ${semester}`,
                        }),
                      ),
                    ]}
                  />

                  <FilterBox
                    label="Section"
                    value={
                      sectionFilter
                    }
                    onChange={(
                      value,
                    ) => {
                      setSectionFilter(
                        value,
                      );
                      setSubjectFilter(
                        "ALL",
                      );
                    }}
                    options={[
                      {
                        value:
                          "ALL",
                        label:
                          "All Sections",
                      },
                      ...sections.map(
                        (
                          section,
                        ) => ({
                          value:
                            section,
                          label: `Section ${section}`,
                        }),
                      ),
                    ]}
                  />

                  <FilterBox
                    label="Subject"
                    value={
                      subjectFilter
                    }
                    onChange={
                      setSubjectFilter
                    }
                    options={[
                      {
                        value:
                          "ALL",
                        label:
                          "All Subjects",
                      },
                      ...subjects.map(
                        (
                          subject,
                        ) => ({
                          value:
                            subject.id,
                          label:
                            subject.name,
                        }),
                      ),
                    ]}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#edf8fd] px-3 py-1.5 text-[8px] font-bold text-[#3986ab]">
                    Current scope:
                  </span>

                  <span className="text-[9px] font-bold text-[#486177]">
                    {analyticsContext}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] items-stretch">
                {/* BAR */}

                <div className="border-b border-[#e8eef3] p-5 xl:border-b-0 xl:border-r sm:p-6">
                  <div className="mb-3">
                    <h3 className="text-[12px] font-bold text-[#304a61]">
                      Subject marking coverage
                    </h3>

                    <p className="mt-1 text-[9px] text-[#8395a7]">
                      Green indicates marked sessions. Red indicates
                      unmarked sessions.
                    </p>
                  </div>

                  <div className="h-[310px]">
                    {overviewLoading ? (
                      <LoadingState />
                    ) : subjectChartData.length >
                      0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={
                            subjectChartData
                          }
                          margin={{
                            top: 12,
                            right: 8,
                            bottom: 4,
                            left: -18,
                          }}
                        >
                          <CartesianGrid
                            stroke="#edf2f5"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="name"
                            tick={{
                              fontSize: 8,
                              fill: "#7b8fa1",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />

                          <YAxis
                            domain={[
                              0,
                              100,
                            ]}
                            tick={{
                              fontSize: 8,
                              fill: "#8395a7",
                            }}
                            axisLine={false}
                            tickLine={false}
                          />

                          <Tooltip
                            cursor={{
                              fill: "#f5f9fb",
                            }}
                            contentStyle={{
                              borderRadius: 12,
                              border:
                                "1px solid #dce7ee",
                              fontSize: 10,
                            }}
                            formatter={(
                              value,
                            ) => [
                              `${value}%`,
                              "Coverage",
                            ]}
                          />

                          <Bar
                            dataKey="coverage"
                            radius={[
                              8,
                              8,
                              0,
                              0,
                            ]}
                          >
                            {subjectChartData.map(
                              (
                                item,
                                index,
                              ) => (
                                <Cell
                                  key={`${item.name}-${index}`}
                                  fill={
                                    item.status ===
                                    "MARKED"
                                      ? "#39ad7b"
                                      : "#d85b5b"
                                  }
                                />
                              ),
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No attendance data available." />
                    )}
                  </div>
                </div>

                {/* DONUT */}

                <div className="h-full border-t border-[#e8eef3] p-5 sm:p-6 xl:border-t-0">
                  <h3 className="text-[12px] font-bold text-[#304a61]">
                    Attendance distribution
                  </h3>

                  <p className="mt-1 text-[9px] text-[#8395a7]">
                    Current selected academic scope
                  </p>

                  <div className="relative mt-3 h-[220px]">
                    {pieData.length >
                    0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={
                              pieData
                            }
                            dataKey="value"
                            nameKey="name"
                            innerRadius={
                              61
                            }
                            outerRadius={
                              88
                            }
                            paddingAngle={
                              4
                            }
                            stroke="#fff"
                            strokeWidth={
                              3
                            }
                          >
                            <Cell fill="#39ad7b" />
                            <Cell fill="#d85b5b" />
                            <Cell fill="#e0a13d" />
                            <Cell fill="#8094a9" />
                          </Pie>

                          <Tooltip
                            contentStyle={{
                              borderRadius: 12,
                              border:
                                "1px solid #dce7ee",
                              fontSize: 10,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No attendance records." />
                    )}

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-serif text-[29px] font-bold text-[#182d42]">
                          {
                            attendanceHealth
                          }
                          %
                        </p>

                        <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#8294a5]">
                          Health
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <LegendRow
                      label="Present"
                      value={
                        analytics.present
                      }
                      color="bg-[#39ad7b]"
                    />

                    <LegendRow
                      label="Absent"
                      value={
                        analytics.absent
                      }
                      color="bg-[#d85b5b]"
                    />

                    <LegendRow
                      label="Late"
                      value={
                        analytics.late
                      }
                      color="bg-[#e0a13d]"
                    />

                    <LegendRow
                      label="Excused"
                      value={
                        analytics.excused
                      }
                      color="bg-[#8094a9]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                TODAY'S SUBJECT STATUS
            ================================================== */}

            <section className="mt-5 overflow-hidden rounded-[25px] border border-[#d7e3ed] bg-white shadow-[0_10px_30px_rgba(30,60,90,0.05)]">
              <div className="border-b border-[#e8eef3] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#438bb8]">
                      Live Academic Board
                    </p>
                    <h2 className="mt-1 font-serif text-[24px] font-bold text-[#102136]">
                      Today&apos;s subject status
                    </h2>
                    <p className="mt-1 text-[10px] text-[#7c90a1]">
                      Only today&apos;s classes are shown. Marked subjects stay green; unmarked subjects stay red.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c7ead9] bg-[#f0fbf5] px-3 py-1.5 text-[8px] font-bold text-[#2b9368]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#39ad7b]" />
                      MARKED
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0caca] bg-[#fff5f5] px-3 py-1.5 text-[8px] font-bold text-[#c94e4e]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#d85b5b]" />
                      NOT MARKED
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {overviewLoading ? (
                  <LoadingState />
                ) : todaySubjects.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-[#d9e5ec] bg-[#fbfdff] px-6 py-12 text-center">
                    <CalendarDays size={24} className="mx-auto text-[#8ea7ba]" />
                    <p className="mt-3 text-[11px] font-bold text-[#415970]">
                      No classes scheduled for today in the selected scope.
                    </p>
                    <p className="mt-1 text-[9px] text-[#8a9bab]">
                      Change Semester, Section or Subject to inspect another academic scope.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {todaySubjects.map((item) => {
                      const marked = item.status === "MARKED";
                      return (
                        <div
                          key={`today-${item.key}`}
                          className={`group relative overflow-hidden rounded-[20px] border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(30,60,90,0.09)] ${
                            marked
                              ? "border-[#cce9db] bg-gradient-to-br from-[#f7fffb] via-white to-[#edf9f4]"
                              : "border-[#f0cccc] bg-gradient-to-br from-[#fff9f9] via-white to-[#fff1f1]"
                          }`}
                        >
                          <div
                            className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl ${
                              marked ? "bg-[#53c594]/15" : "bg-[#df6666]/15"
                            }`}
                          />

                          <div className="relative flex items-start gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                marked
                                  ? "bg-[#e4f7ed] text-[#2c986d]"
                                  : "bg-[#ffe9e9] text-[#d45757]"
                              }`}
                            >
                              {marked ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-[12px] font-bold text-[#233b52]">
                                    {item.subjectName}
                                  </p>
                                  <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-[#8093a4]">
                                    Semester {item.semester} • Section {normalizeSection(item.section)}
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[7px] font-extrabold tracking-[0.08em] ${
                                    marked
                                      ? "bg-[#def4e8] text-[#278f66]"
                                      : "bg-[#ffe2e2] text-[#c94e4e]"
                                  }`}
                                >
                                  {marked ? "MARKED" : "NOT MARKED"}
                                </span>
                              </div>

                              <div className="mt-4 flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8a9aaa]">
                                    Today&apos;s session
                                  </p>
                                  <p className="mt-1 text-[10px] font-bold text-[#40586f]">
                                    {formatTime(item.sessionDate) || formatDate(item.sessionDate)}
                                  </p>
                                </div>
                                <div className="w-[96px]">
                                  <div className="mb-1 flex items-center justify-between text-[7px] font-bold text-[#899aaa]">
                                    <span>Coverage</span>
                                    <span className={marked ? "text-[#2b9368]" : "text-[#c94e4e]"}>
                                      {item.completion}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eef2]">
                                    <div
                                      className={`h-full rounded-full ${marked ? "bg-[#39ad7b]" : "bg-[#d85b5b]"}`}
                                      style={{ width: `${Math.max(4, Math.min(100, item.completion))}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                ACTIVITY STREAM
            ================================================== */}

            <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              {/* RECENT ACTIVITY */}

              <div className="rounded-[25px] border border-[#d7e3ed] bg-white p-5 shadow-[0_10px_30px_rgba(30,60,90,0.05)] sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#438bb8]">
                      Activity Stream
                    </p>

                    <h2 className="mt-1 font-serif text-[23px] font-bold text-[#102136]">
                      Recent academic activity
                    </h2>
                  </div>

                  <Link
                    href="/dashboard/faculty/attendance"
                    className="text-[9px] font-bold text-[#398bb4]"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5 space-y-2.5">
                  {recentSessions.length >
                  0 ? (
                    recentSessions.map(
                      (item) => (
                        <div
                          key={`${item.key}-stream`}
                          className="flex items-center gap-3 rounded-2xl border border-[#e5edf2] bg-[#fbfdff] p-3.5"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              item.status ===
                              "MARKED"
                                ? "bg-[#e9f8f0] text-[#2d996c]"
                                : "bg-[#fff0f0] text-[#d85b5b]"
                            }`}
                          >
                            {item.status ===
                            "MARKED" ? (
                              <CheckCircle2
                                size={
                                  15
                                }
                              />
                            ) : (
                              <AlertCircle
                                size={
                                  15
                                }
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] font-bold text-[#294157]">
                              {
                                item.subjectName
                              }
                            </p>

                            <p className="mt-1 text-[8px] text-[#7d90a2]">
                              Semester{" "}
                              {
                                item.semester
                              }
                              {" • "}
                              Section{" "}
                              {normalizeSection(
                                item.section,
                              )}
                              {" • "}
                              {formatDate(
                                item.sessionDate,
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-bold text-[#304b62]">
                              {
                                item.completion
                              }
                              %
                            </p>

                            <p
                              className={`mt-1 text-[7px] font-bold ${
                                item.status ===
                                "MARKED"
                                  ? "text-[#2e996d]"
                                  : "text-[#d95757]"
                              }`}
                            >
                              {item.status ===
                              "MARKED"
                                ? "MARKED"
                                : "NOT MARKED"}
                            </p>
                          </div>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#dbe5ec] px-5 py-10 text-center text-[10px] text-[#8497a7]">
                      No recent academic activity.
                    </div>
                  )}
                </div>
              </div>

              {/* FACULTY PROFILE */}

              <div className="rounded-[25px] border border-[#d7e3ed] bg-white p-5 shadow-[0_10px_30px_rgba(30,60,90,0.05)] sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf8fd] text-[#4da4d1]">
                    <UserCircle
                      size={22}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#438bb8]">
                      Faculty Identity
                    </p>

                    <h2 className="mt-1 truncate font-serif text-[22px] font-bold text-[#102136]">
                      {facultyName}
                    </h2>

                    <p className="mt-1 truncate text-[10px] text-[#8295a6]">
                      {facultyEmail}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3 xl:grid-cols-1">
                  <ProfileItem
                    label="Faculty ID"
                    value={
                      facultyId
                    }
                  />

                  <ProfileItem
                    label="Role"
                    value={
                      facultyRole
                    }
                  />

                  <ProfileItem
                    label="Account Status"
                    value="Approved & Active"
                    positive
                  />
                </div>

                <div className="mt-5 flex gap-2.5">
                  <Link
                    href="/faculty/profile"
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-[#d7e3ed] text-[9px] font-bold text-[#557087] transition hover:border-[#9fcfe4] hover:text-[#2f84ae]"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/faculty/security"
                    className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[#0e1b2b] text-[9px] font-bold text-white transition hover:bg-[#14273d]"
                  >
                    Security
                  </Link>
                </div>
              </div>
            </section>

            {/* =================================================
                EVENTS + CLUBS
            ================================================== */}

            <section className="mt-5 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
              <section className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-[25px] border border-[#203c54] bg-gradient-to-br from-[#0a1727] via-[#0e2033] to-[#12314a] p-5 text-white shadow-[0_18px_45px_rgba(7,27,48,0.12)] sm:p-6">
                <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full border border-[#54bce5]/15" />
                <div className="pointer-events-none absolute right-7 top-8 h-16 w-16 rounded-full bg-[#54bce5]/10 blur-xl" />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#6dc9ec]">
                      Campus Events
                    </p>
                    <h2 className="mt-1 font-serif text-[24px] font-bold">
                      Event control panel
                    </h2>
                    <p className="mt-2 max-w-xl text-[9px] leading-5 text-[#9eb5c9]">
                      Upcoming campus events, faculty coordination and event operations in one place.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#54bce5]/10 text-[#6dc9ec] ring-1 ring-[#54bce5]/15 transition duration-300 group-hover:scale-105">
                    <CalendarDays size={20} />
                  </div>
                </div>

                <div className="relative mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-[#75d6f4]">
                    <Activity size={15} />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7892a8]">
                      Upcoming schedule
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-white">
                      {statsLoading ? "Loading events..." : `${stats.upcomingEvents} upcoming event${stats.upcomingEvents === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <Link
                    href="/dashboard/faculty/events"
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-[8px] font-bold text-[#9bdff4] transition hover:bg-white/10"
                  >
                    Manage
                    <ArrowUpRight size={12} />
                  </Link>
                </div>

                <div className="relative mt-4 flex items-end gap-1.5">
                  {[42, 68, 52, 84, 61, 92, 72].map((height, index) => (
                    <div key={`event-signal-${index}`} className="flex-1 rounded-t-md bg-[#54bce5]/20 transition duration-500 group-hover:bg-[#54bce5]/35" style={{ height: `${height}px` }}>
                      <div className="h-full origin-bottom rounded-t-md bg-[#54bce5]/60 transition duration-700 group-hover:scale-y-100" style={{ transform: `scaleY(${0.35 + index * 0.07})` }} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-[25px] border border-[#d7e3ed] bg-white p-5 shadow-[0_10px_30px_rgba(30,60,90,0.05)] sm:p-6">
                <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[#e9f7fd] blur-3xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#438bb8]">
                      Club Network
                    </p>
                    <h2 className="mt-1 font-serif text-[24px] font-bold text-[#102136]">
                      Club operations
                    </h2>
                    <p className="mt-2 max-w-xl text-[9px] leading-5 text-[#7f92a3]">
                      Faculty club workspace for coordination, activities, memberships and campus engagement.
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf8fd] text-[#438fb8] ring-1 ring-[#d8edf6] transition duration-300 group-hover:scale-105">
                    <Users size={20} />
                  </div>
                </div>

                <div className="relative mt-6 grid grid-cols-3 gap-2.5">
                  {[
                    { label: "CLUBS", value: "Manage", href: "/dashboard/faculty/clubs" },
                    { label: "ACTIVITY", value: "Coordinate", href: "/dashboard/faculty/activities" },
                    { label: "MEMBERS", value: "Review", href: "/dashboard/faculty/clubs" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="rounded-2xl border border-[#e2ebf1] bg-[#fbfdff] p-3 transition duration-300 hover:-translate-y-1 hover:border-[#a9d3e6] hover:shadow-[0_12px_25px_rgba(30,60,90,0.06)]"
                    >
                      <p className="text-[7px] font-extrabold tracking-[0.14em] text-[#8b9cab]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-[10px] font-bold text-[#304a61]">
                        {item.value}
                      </p>
                    </Link>
                  ))}
                </div>

                <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-[#e4edf2] bg-[#f8fbfd] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f7fb] text-[#3f94bc]">
                      <span className="absolute h-2 w-2 animate-ping rounded-full bg-[#54bce5]/45" />
                      <span className="relative h-2 w-2 rounded-full bg-[#54bce5]" />
                    </span>
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7d90a1]">
                        Workspace
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-[#2e465c]">
                        Club module ready
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/faculty/clubs"
                    className="inline-flex items-center gap-1 text-[8px] font-bold text-[#378ab3]"
                  >
                    Open clubs
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </section>
            </section>

            {/* =================================================
                SIMPLE MODULE FOOTER
                NO QUICK-ACCESS BOXES
            ================================================== */}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#d6e2ea] pt-5">
              <span className="mr-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#8396a7]">
                Faculty modules
              </span>

              {[
                ["Students", "/dashboard/faculty/students"],
                ["Approval", "/dashboard/faculty/approvals/students"],
                ["Attendance", "/dashboard/faculty/attendance"],
                ["Events", "/dashboard/faculty/events"],
                ["Activities", "/dashboard/faculty/activities"],
                ["Clubs", "/dashboard/faculty/clubs"],
                ["Notifications", "/dashboard/faculty/notifications"],
              ].map(
                ([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-[8px] font-semibold text-[#698196] transition hover:text-[#2d82aa]"
                  >
                    {label}
                  </Link>
                ),
              )}
            </div>

            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function ExecutiveMetric({
  label,
  value,
  caption,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  caption: string;
  tone:
    | "blue"
    | "green"
    | "red";
  icon: ElementType;
}) {
  const colors = {
    blue: {
      bg: "bg-[#edf8fd]",
      text: "text-[#2d8ab5]",
    },
    green: {
      bg: "bg-[#eefaf5]",
      text: "text-[#2b9569]",
    },
    red: {
      bg: "bg-[#fff2f2]",
      text: "text-[#d15555]",
    },
  }[tone];

  return (
    <div className="rounded-[19px] border border-[#e2eaf0] bg-[#fbfdff] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#7c90a2]">
          {label}
        </p>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}
        >
          <Icon size={14} />
        </div>
      </div>

      <p className="mt-2 font-serif text-[26px] font-bold text-[#1d3449]">
        {value}
      </p>

      <p className="mt-1 truncate text-[8px] text-[#8496a7]">
        {caption}
      </p>
    </div>
  );
}

function PriorityRow({
  title,
  value,
  subtitle,
  href,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  href: string;
  tone:
    | "danger"
    | "warning"
    | "success"
    | "info";
}) {
  const colors = {
    danger:
      "bg-[#fff0f0] text-[#d95757]",
    warning:
      "bg-[#fff7e8] text-[#d39434]",
    success:
      "bg-[#eefaf5] text-[#2d986c]",
    info:
      "bg-[#edf8fd] text-[#3b92bb]",
  }[tone];

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-[#e3ebf0] bg-[#fbfdff] p-3.5 transition hover:-translate-y-0.5 hover:border-[#a8d3e6]"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors}`}
      >
        <Activity size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-[#30485e]">
          {title}
        </p>

        <p className="mt-1 text-[8px] text-[#8295a7]">
          {subtitle}
        </p>
      </div>

      <p className="font-serif text-[21px] font-bold text-[#22394e]">
        {value}
      </p>
    </Link>
  );
}

function FilterBox({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-[#768a9d]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="h-11 w-full rounded-xl border border-[#d7e3ed] bg-[#fbfdff] px-3 text-[10px] font-semibold text-[#304b62] outline-none transition focus:border-[#54bce5] focus:ring-2 focus:ring-[#54bce5]/10"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          ),
        )}
      </select>
    </label>
  );
}

function LegendRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#edf1f4] bg-[#fbfdff] px-3 py-2.5">
      <span className="flex items-center gap-2 text-[8px] font-semibold text-[#75899b]">
        <span
          className={`h-2 w-2 rounded-full ${color}`}
        />
        {label}
      </span>

      <span className="text-[9px] font-bold text-[#2b4359]">
        {value}
      </span>
    </div>
  );
}

function ProfileItem({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#edf2f5] bg-[#fbfdff] px-3.5 py-2.5">
      <span className="text-[8px] text-[#7c90a1]">
        {label}
      </span>

      <span
        className={`text-[8px] font-bold ${
          positive
            ? "text-[#2d986c]"
            : "text-[#304a61]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[230px] items-center justify-center text-[10px] font-semibold text-[#7c90a1]">
      <RefreshCw
        size={17}
        className="mr-2 animate-spin text-[#54bce5]"
      />
      Loading live data...
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[230px] items-center justify-center px-5 text-center text-[10px] text-[#8295a7]">
      {message}
    </div>
  );
}

/* =========================================================
   END
========================================================= */
