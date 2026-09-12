"use client";

import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardData = {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalClubs: number;
  totalEvents: number;
  totalActivities: number;
  totalAnnouncements: number;
  totalCertificates: number;
  totalNotifications: number;
  unreadNotifications: number;
  eventAttendanceTotal: number;
  eventAttendancePresent: number;
  registrationTrend: {
    key: string;
    month: string;
    users: number;
    events: number;
  }[];
  roleDistribution: {
    name: string;
    value: number;
  }[];
  eventStatus: {
    name: string;
    value: number;
  }[];
  eventAttendanceBreakdown: {
    name: string;
    value: number;
  }[];
  upcomingEvents: {
    id: string;
    title: string;
    venue: string;
    eventDate: string;
    image: string | null;
    club: {
      id: string;
      name: string;
    };
  }[];
  recentActivities: {
    id: string;
    title: string;
    description: string;
    venue: string;
    activityDate: string;
  }[];
  topClubs: {
    id: string;
    name: string;
    category: string | null;
    logo: string | null;
    _count: {
      events: number;
      announcements: number;
    };
  }[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: DashboardData;
};

const INITIAL_DATA: DashboardData = {
  totalUsers: 0,
  totalStudents: 0,
  totalFaculty: 0,
  totalAdmins: 0,
  totalClubs: 0,
  totalEvents: 0,
  totalActivities: 0,
  totalAnnouncements: 0,
  totalCertificates: 0,
  totalNotifications: 0,
  unreadNotifications: 0,
  eventAttendanceTotal: 0,
  eventAttendancePresent: 0,
  registrationTrend: [],
  roleDistribution: [],
  eventStatus: [],
  eventAttendanceBreakdown: [],
  upcomingEvents: [],
  recentActivities: [],
  topClubs: [],
};

const PIE_COLORS = ["#2563eb", "#7c3aed", "#0f172a"];
const ATTENDANCE_COLORS = ["#10b981", "#e2e8f0"];
const EVENT_COLORS = ["#3b82f6", "#cbd5e1"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function SectionTitle({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
        {icon}
      </div>
    </div>
  );
}

function QuickAccessCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        event.currentTarget.style.setProperty("--film-x", `${x}%`);
        event.currentTarget.style.setProperty("--film-y", `${y}%`);
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.setProperty("--film-x", "50%");
        event.currentTarget.style.setProperty("--film-y", "50%");
      }}
      className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-[#fbfcff] hover:shadow-[0_16px_34px_rgba(79,70,229,0.11)] focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
      style={{
        ["--film-x" as string]: "50%",
        ["--film-y" as string]: "50%",
      }}
    >
      {/* Same thin transparent film used on the Activities cards, but the glow point follows the cursor. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(190px circle at var(--film-x) var(--film-y), rgba(79,70,229,.105), transparent 68%), linear-gradient(135deg, rgba(79,70,229,.035) 0%, rgba(45,79,174,.065) 52%, rgba(70,105,226,.045) 100%)",
          boxShadow: "inset 0 0 0 1px rgba(79,70,229,.08)",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 origin-left scale-x-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 transition duration-500 group-hover:scale-x-100" />

      <div className="relative z-30 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50/80 text-indigo-600 shadow-sm backdrop-blur-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:rotate-3 group-hover:border-indigo-200 group-hover:bg-white/80 group-hover:text-indigo-700 group-hover:shadow-[0_10px_24px_rgba(79,70,229,0.15)]">
          {icon}
        </div>
        <ChevronRight
          size={18}
          className="text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-indigo-600"
        />
      </div>

      <div className="relative z-30">
        <h3 className="mt-5 text-base font-extrabold text-slate-950 transition-colors duration-300 group-hover:text-[#202b63]">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    try {
      setError("");

      const response = await fetch("/api/dashboard/admin", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal,
        headers: {
          Accept: "application/json",
        },
      });

      const responseText = await response.text();
      let result: ApiResponse = {};

      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText) as ApiResponse;
        } catch {
          throw new Error(
            `Server returned an invalid dashboard response (${response.status}).`,
          );
        }
      }

      if (!response.ok || result.success === false || !result.data) {
        throw new Error(
          result.message ||
            `Dashboard request failed with status ${response.status}.`,
        );
      }

      const nextData: DashboardData = {
        ...INITIAL_DATA,
        ...result.data,
        registrationTrend: Array.isArray(result.data.registrationTrend)
          ? result.data.registrationTrend
          : [],
        roleDistribution: Array.isArray(result.data.roleDistribution)
          ? result.data.roleDistribution
          : [],
        eventStatus: Array.isArray(result.data.eventStatus)
          ? result.data.eventStatus
          : [],
        eventAttendanceBreakdown: Array.isArray(
          result.data.eventAttendanceBreakdown,
        )
          ? result.data.eventAttendanceBreakdown
          : [],
        upcomingEvents: Array.isArray(result.data.upcomingEvents)
          ? result.data.upcomingEvents
          : [],
        recentActivities: Array.isArray(result.data.recentActivities)
          ? result.data.recentActivities
          : [],
        topClubs: Array.isArray(result.data.topClubs)
          ? result.data.topClubs
          : [],
      };

      setData(nextData);
      setLastUpdated(new Date());
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") {
        return;
      }

      console.error("ADMIN DASHBOARD LOAD ERROR:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the admin dashboard.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      void loadDashboard(controller.signal);
    }, 0);

    const handleFocus = () => {
      void loadDashboard();
    };

    const interval = window.setInterval(() => {
      void loadDashboard();
    }, 30000);

    window.addEventListener("focus", handleFocus);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadDashboard]);

  const attendanceRate = useMemo(() => {
    if (!data.eventAttendanceTotal) return 0;
    return Math.round(
      (data.eventAttendancePresent / data.eventAttendanceTotal) * 100,
    );
  }, [data.eventAttendancePresent, data.eventAttendanceTotal]);

  const upcomingCount =
    data.eventStatus?.find((item) => item.name === "Upcoming")?.value ?? 0;
  const completedCount =
    data.eventStatus?.find((item) => item.name === "Completed")?.value ?? 0;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f4f7fb] px-4 py-5 md:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* HERO */}
        <section className="group relative min-h-[280px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#07132f] via-[#102a62] to-[#1d4ed8] px-6 py-8 text-white shadow-[0_24px_60px_rgba(30,64,175,0.18)] sm:px-9 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full border border-white/10 transition duration-700 group-hover:scale-110" />
          <div className="pointer-events-none absolute right-16 top-14 h-24 w-24 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 left-[42%] h-80 w-80 rounded-full bg-blue-300/10 blur-3xl transition duration-700 group-hover:translate-x-6" />
          <div className="pointer-events-none absolute bottom-8 left-10 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-bold text-blue-100 backdrop-blur-xl">
                <Sparkles size={14} />
                Campus Command Center
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-[50px] lg:leading-[1.03]">
                Run the campus.
                <br />
                <span className="text-blue-200">See everything at a glance.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100/80 sm:text-[15px]">
                A live administrative view of people, events, clubs, activities,
                communication and campus engagement across CampusConnect.
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[460px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.15]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Users</p>
                <p className="mt-2 text-2xl font-black">{formatNumber(data.totalUsers)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.15]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Clubs</p>
                <p className="mt-2 text-2xl font-black">{formatNumber(data.totalClubs)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.15]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Events</p>
                <p className="mt-2 text-2xl font-black">{formatNumber(data.totalEvents)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.15]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Status</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-black">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                  Operational
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <CircleAlert size={17} />
              {error}
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* MAIN ANALYTICS */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-7">
            <SectionTitle
              eyebrow="Campus Growth"
              title="People & events momentum"
              description="Six-month movement across new user registrations and event creation."
              icon={<TrendingUp size={19} />}
            />

            <div className="mt-7 h-[310px] w-full">
              {loading && !data.registrationTrend.length ? (
                <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">
                  Loading analytics...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="eventsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Area type="monotone" dataKey="users" name="New users" stroke="#2563eb" strokeWidth={3} fill="url(#usersFill)" />
                    <Area type="monotone" dataKey="events" name="Events created" stroke="#7c3aed" strokeWidth={3} fill="url(#eventsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-7">
            <SectionTitle
              eyebrow="User Mix"
              title="Who is on the platform"
              description="Current registered account distribution by role."
              icon={<Users size={19} />}
            />

            <div className="relative mt-5 h-[245px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {data.roleDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-slate-950">{formatNumber(data.totalUsers)}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Accounts</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.roleDistribution.map((role, index) => {
                const percent = data.totalUsers
                  ? Math.round((role.value / data.totalUsers) * 100)
                  : 0;

                return (
                  <div key={role.name} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="truncate text-sm font-semibold text-slate-600">{role.name}</span>
                    </div>
                    <span className="shrink-0 text-sm font-black text-slate-900">
                      {formatNumber(role.value)} <span className="font-medium text-slate-400">({percent}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECOND ANALYTICS ROW */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <SectionTitle
              eyebrow="Event Pulse"
              title="Event pipeline"
              description="Upcoming vs completed events in the active dashboard view."
              icon={<CalendarDays size={19} />}
            />

            <div className="mt-7 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.eventStatus} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data.eventStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={EVENT_COLORS[index % EVENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-600">Upcoming</p>
                <p className="mt-1 text-2xl font-black text-blue-950">{formatNumber(upcomingCount)}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-bold text-slate-500">Completed</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(completedCount)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <SectionTitle
              eyebrow="Attendance"
              title="Event participation"
              description="Attendance outcome across recorded campus events."
              icon={<CheckCircle2 size={19} />}
            />

            <div className="relative mt-5 h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.eventAttendanceBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={84}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {data.eventAttendanceBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-slate-950">{attendanceRate}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Presence</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-700">Present</p>
                <p className="mt-1 text-2xl font-black text-emerald-950">{formatNumber(data.eventAttendancePresent)}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-bold text-slate-500">Total marks</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(data.eventAttendanceTotal)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <SectionTitle
              eyebrow="Communication"
              title="System pulse"
              description="The live communication and recognition footprint."
              icon={<Bell size={19} />}
            />

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-blue-950">Notifications</p>
                    <p className="text-xs text-blue-600">Unread communication</p>
                  </div>
                </div>
                <p className="text-xl font-black text-blue-950">{formatNumber(data.unreadNotifications)}</p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-violet-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Megaphone size={18} className="text-violet-600" />
                  <div>
                    <p className="text-sm font-bold text-violet-950">Announcements</p>
                    <p className="text-xs text-violet-600">Published campus updates</p>
                  </div>
                </div>
                <p className="text-xl font-black text-violet-950">{formatNumber(data.totalAnnouncements)}</p>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-950">Activities</p>
                    <p className="text-xs text-amber-600">Campus activities recorded</p>
                  </div>
                </div>
                <p className="text-xl font-black text-amber-950">{formatNumber(data.totalActivities)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={15} />
              Core dashboard services are responding normally.
            </div>
          </div>
        </section>

        {/* EVENTS + CLUBS */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(350px,0.7fr)]">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
              <SectionTitle
                eyebrow="Next Up"
                title="Upcoming campus events"
                description="The next events your administration should know about."
                icon={<CalendarDays size={19} />}
              />
              <Link
                href="/admin/events"
                className="hidden shrink-0 items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-800 sm:flex"
              >
                Open events <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {data.upcomingEvents.length ? (
                data.upcomingEvents.map((event) => (
                  <div key={event.id} className="group flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:px-7">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-sm font-black text-blue-700">
                      {event.image ? (
                        <img src={event.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <CalendarDays size={20} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-extrabold text-slate-900">{event.title}</h3>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">
                          {event.club?.name || "Campus"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{event.venue || "Campus venue"}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                      <Clock3 size={14} className="text-blue-600" />
                      {formatDateTime(event.eventDate)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-7 py-12 text-center text-sm text-slate-400">
                  No upcoming events available.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-7">
            <SectionTitle
              eyebrow="Club Spotlight"
              title="Most active clubs"
              description="Ranked by event activity, using live club data."
              icon={<Building2 size={19} />}
            />

            <div className="mt-6 space-y-3">
              {data.topClubs.length ? (
                data.topClubs.map((club, index) => {
                  const maxEvents = Math.max(
                    ...data.topClubs.map((item) => item._count.events),
                    1,
                  );
                  const width = Math.max(
                    10,
                    Math.round((club._count.events / maxEvents) * 100),
                  );

                  return (
                    <Link
                      href="/admin/clubs"
                      key={club.id}
                      className="group block rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-xs font-black text-blue-700 shadow-sm">
                          {club.logo ? (
                            <img src={club.logo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            getInitials(club.name)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-bold text-slate-900">{club.name}</p>
                            <span className="shrink-0 text-[11px] font-bold text-slate-500">
                              {club._count.events} events
                            </span>
                          </div>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                  No club activity found yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITIES + QUICK ACCESS */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
              <SectionTitle
                eyebrow="Administration Feed"
                title="Recent campus activities"
                description="Latest operational activity recorded by CampusConnect."
                icon={<Activity size={19} />}
              />
              <Link
                href="/admin/activities"
                className="hidden shrink-0 items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-800 sm:flex"
              >
                View all <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {data.recentActivities.length ? (
                data.recentActivities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4 px-6 py-5 transition hover:bg-slate-50 sm:px-7">
                    <div className="relative flex w-8 shrink-0 justify-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Activity size={15} />
                      </div>
                      {index !== data.recentActivities.length - 1 ? (
                        <div className="absolute left-1/2 top-9 h-full w-px -translate-x-1/2 bg-slate-200" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{activity.description}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {formatDate(activity.activityDate)}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-blue-600">{activity.venue}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-7 py-12 text-center text-sm text-slate-400">
                  No recent activities available.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Quick Access</p>
              <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-950">Command shortcuts</h2>
              <p className="mt-1 text-sm text-slate-500">Jump directly into high-value admin areas.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <QuickAccessCard
                href="/admin/users"
                title="Users"
                description="Manage students, faculty and administrators."
                icon={<Users size={20} />}
              />
              <QuickAccessCard
                href="/admin/clubs"
                title="Clubs"
                description="Manage clubs, categories and campus activity."
                icon={<Building2 size={20} />}
              />
              <QuickAccessCard
                href="/admin/events"
                title="Events"
                description="Plan, edit and monitor campus events."
                icon={<CalendarDays size={20} />}
              />
              <QuickAccessCard
                href="/admin/activities"
                title="Activities"
                description="Review the latest administration activity feed."
                icon={<Activity size={20} />}
              />
            </div>
          </div>
        </section>

        {/* FOOTER STATUS */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={21} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-950">CampusConnect Command Center</p>
                <p className="mt-1 text-xs text-slate-500">
                  Live administrative data with automatic dashboard refresh every 30 seconds.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {lastUpdated ? (
                <span className="text-[11px] font-semibold text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <RefreshCw size={14} />
                Refresh dashboard
              </button>
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
        </section>
      </div>
    </main>
  );
}
