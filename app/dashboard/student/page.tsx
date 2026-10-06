"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useId,
} from "react";
import Link from "next/link";
import StudentLayout from "@/components/student/StudentLayout";

import {
  Building2,
  CalendarDays,
  Bell,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Timer,
  MapPin,
  Flame,
  CalendarClock,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type StudentUser = {
  id?: string | number;
  name?: string;
  email?: string;
  campusUserId?: string;
};

type Club = {
  id: string | number;
  name: string;
  description?: string | null;
  category?: string | null;
  members?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type EventItem = {
  id: string | number;
  title: string;
  description?: string | null;
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  eventDate?: string | null;
  time?: string | null;
  startTime?: string | null;
  location?: string | null;
  venue?: string | null;
  club?: {
    name?: string | null;
  } | null;
  createdAt?: string | null;
};

type ActivityItemData = {
  id: string | number;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  completed?: boolean | null;
  completedAt?: string | null;
  createdAt?: string | null;
};

type NotificationItem = {
  id: string | number;
  title?: string | null;
  message?: string | null;
  description?: string | null;
  read?: boolean | null;
  isRead?: boolean | null;
  createdAt?: string | null;
};

type DashboardData = {
  myClubs: Club[];
  events: EventItem[];
  activities: ActivityItemData[];
  notifications: NotificationItem[];
};

type Segment = {
  label: string;
  value: number;
  color: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const COLORS = {
  emerald: "#10b981",
  teal: "#14b8a6",
  sky: "#0ea5e9",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  slate: "#cbd5e1",
};

const PALETTE = [
  COLORS.emerald,
  COLORS.sky,
  COLORS.amber,
  COLORS.violet,
  COLORS.rose,
  COLORS.teal,
];

const LIVE_REFRESH_MS = 30000;

/* ============================================================
   HELPERS (original logic - unchanged)
============================================================ */

function getArrayFromResponse<T>(
  data: unknown,
  keys: string[]
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const object = data as Record<string, unknown>;

    for (const key of keys) {
      if (Array.isArray(object[key])) {
        return object[key] as T[];
      }
    }

    if (object.data && typeof object.data === "object") {
      const nested = object.data as Record<string, unknown>;

      for (const key of keys) {
        if (Array.isArray(nested[key])) {
          return nested[key] as T[];
        }
      }
    }
  }

  return [];
}

async function safeFetch(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch failed: ${url}`, error);
    return null;
  }
}

function getStoredStudent(): StudentUser {
  if (typeof window === "undefined") {
    return {};
  }

  const possibleKeys = [
    "user",
    "student",
    "studentUser",
    "currentStudent",
  ];

  for (const key of possibleKeys) {
    try {
      const value = localStorage.getItem(key);

      if (!value) {
        continue;
      }

      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object") {
        return parsed as StudentUser;
      }
    } catch {
      continue;
    }
  }

  return {};
}

function getUserQuery(student: StudentUser): string {
  const params = new URLSearchParams();

  if (student.id !== undefined) {
    params.set("studentId", String(student.id));
  }

  if (student.email) {
    params.set("email", student.email);
  }

  if (student.campusUserId) {
    params.set("campusUserId", student.campusUserId);
  }

  const value = params.toString();

  return value ? `?${value}` : "";
}

function getEventDate(event: EventItem): Date | null {
  const value = event.startDate || event.eventDate || event.date;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(event: EventItem): string {
  if (event.startTime) {
    return event.startTime;
  }

  if (event.time) {
    return event.time;
  }

  const date = getEventDate(event);

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isNotificationUnread(notification: NotificationItem): boolean {
  if (typeof notification.read === "boolean") {
    return !notification.read;
  }

  if (typeof notification.isRead === "boolean") {
    return !notification.isRead;
  }

  return true;
}

/* ============================================================
   CHART DATA HELPERS
============================================================ */

function isActivityCompleted(activity: ActivityItemData): boolean {
  if (activity.completed === true) return true;
  if (activity.completedAt) return true;

  const status = (activity.status || "").toLowerCase();

  return ["completed", "complete", "done", "approved", "finished"].includes(
    status
  );
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildLastDays(days = 7): Date[] {
  const result: Date[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(d);
  }

  return result;
}

function buildTrend(
  dates: Array<string | null | undefined>,
  days: Date[]
): number[] {
  return days.map((day) => {
    let count = 0;

    for (const value of dates) {
      if (!value) continue;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) continue;
      if (sameDay(d, day)) count++;
    }

    return count;
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";

  return "Good night";
}

/* ============================================================
   PANEL HELPERS
============================================================ */

type FeedType = "club" | "event" | "activity" | "notification";

const ACTIVITY_META: Record<FeedType, { label: string; color: string }> = {
  club: { label: "Club", color: COLORS.emerald },
  event: { label: "Event", color: COLORS.sky },
  activity: { label: "Activity", color: COLORS.amber },
  notification: { label: "Alert", color: COLORS.violet },
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toTitleCase(value: string): string {
  if (value === value.toUpperCase() && value !== value.toLowerCase()) {
    return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return value;
}

function getRelativeTime(value: string | null | undefined, now: number): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = date.getTime() - now;
  const abs = Math.abs(diff);

  const minute = 60000;
  const hour = 3600000;
  const day = 86400000;

  let label: string;

  if (abs < hour) {
    label = `${Math.max(Math.round(abs / minute), 1)}m`;
  } else if (abs < day) {
    label = `${Math.round(abs / hour)}h`;
  } else if (abs < day * 30) {
    label = `${Math.round(abs / day)}d`;
  } else if (abs < day * 365) {
    label = `${Math.round(abs / (day * 30))}mo`;
  } else {
    label = `${Math.round(abs / (day * 365))}y`;
  }

  return diff > 0 ? `in ${label}` : `${label} ago`;
}

function getDaysUntil(date: Date, now: number): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

/* ============================================================
   HOOKS
============================================================ */

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        previous.current = target;
      }
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function useMounted(delay = 60): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), delay);

    return () => window.clearTimeout(timer);
  }, [delay]);

  return mounted;
}

function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), intervalMs);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}

/* ============================================================
   PAGE
============================================================ */

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const nowMs = useNow(60000);

  const [data, setData] = useState<DashboardData>({
    myClubs: [],
    events: [],
    activities: [],
    notifications: [],
  });

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const storedStudent = getStoredStudent();

      const query = getUserQuery(storedStudent);

      // Membership functionality is intentionally not used in the
      // Student Dashboard. Clubs are loaded directly from the clubs API.
      // No /api/memberships, /api/membership or
      // /api/clubs/memberships requests are made.
      const clubsResponse = await safeFetch(`/api/clubs${query}`);

      const allClubs = getArrayFromResponse<Club>(clubsResponse, [
        "clubs",
        "data",
        "results",
      ]);

      const myClubs: Club[] = allClubs;

      const eventsResponse = await safeFetch("/api/events");

      const allEvents = getArrayFromResponse<EventItem>(eventsResponse, [
        "events",
        "data",
        "results",
      ]);

      const now = new Date();

      const upcomingEvents = allEvents
        .filter((event) => {
          const eventDate = getEventDate(event);

          if (!eventDate) {
            return true;
          }

          return eventDate.getTime() >= now.getTime();
        })
        .sort((a, b) => {
          const dateA = getEventDate(a);
          const dateB = getEventDate(b);

          if (!dateA && !dateB) {
            return 0;
          }

          if (!dateA) {
            return 1;
          }

          if (!dateB) {
            return -1;
          }

          return dateA.getTime() - dateB.getTime();
        });

      // Activity uses the existing working endpoint only.
      // The obsolete singular /api/activity fallback is not requested.
      const activitiesResponse = await safeFetch(`/api/activities${query}`);

      const activities = getArrayFromResponse<ActivityItemData>(
        activitiesResponse,
        ["activities", "data", "results"]
      );

      const notificationsResponse = await safeFetch("/api/notifications");

      const notifications = getArrayFromResponse<NotificationItem>(
        notificationsResponse,
        ["notifications", "data", "results"]
      );

      setData({
        myClubs,
        events: upcomingEvents,
        activities,
        notifications,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("DASHBOARD LOAD ERROR:", err);

      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  /* ---------- LIVE AUTO REFRESH ---------- */

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDashboard(true);
      }
    }, LIVE_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  /* ---------- DERIVED VALUES ---------- */

  const myClubsCount = data.myClubs.length;

  const upcomingEventsCount = data.events.length;

  const activitiesCount = data.activities.length;

  const unreadNotifications = useMemo(() => {
    return data.notifications.filter(isNotificationUnread).length;
  }, [data.notifications]);

  const dashboardEvents = useMemo(() => {
    return data.events.slice(0, 3);
  }, [data.events]);

  const recentActivity = useMemo(() => {
    const items: Array<{
      type: "club" | "event" | "activity" | "notification";
      title: string;
      description: string;
      date?: string | null;
    }> = [];

    for (const club of data.myClubs.slice(0, 2)) {
      items.push({
        type: "club",
        title: club.name,
        description: "You joined this campus club.",
        date: club.createdAt,
      });
    }

    for (const event of data.events.slice(0, 2)) {
      items.push({
        type: "event",
        title: event.title,
        description:
          event.location || event.venue || event.club?.name || "Campus event",
        date:
          event.startDate || event.eventDate || event.date || event.createdAt,
      });
    }

    for (const activity of data.activities.slice(0, 2)) {
      items.push({
        type: "activity",
        title: activity.title || activity.name || "Campus activity",
        description:
          activity.description || activity.status || "Student activity",
        date: activity.completedAt || activity.createdAt,
      });
    }

    for (const notification of data.notifications.slice(0, 2)) {
      items.push({
        type: "notification",
        title: notification.title || "Notification",
        description:
          notification.message ||
          notification.description ||
          "Campus update",
        date: notification.createdAt,
      });
    }

    return items
      .sort((a, b) => {
        if (!a.date && !b.date) {
          return 0;
        }

        if (!a.date) {
          return 1;
        }

        if (!b.date) {
          return -1;
        }

        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 5);
  }, [data.myClubs, data.events, data.activities, data.notifications]);

  /* ---------- CHART DATA ---------- */

  const lastDays = useMemo(() => buildLastDays(7), []);

  const trends = useMemo(() => {
    return {
      clubs: buildTrend(
        data.myClubs.map((c) => c.createdAt),
        lastDays
      ),
      events: buildTrend(
        data.events.map((e) => e.createdAt),
        lastDays
      ),
      activities: buildTrend(
        data.activities.map((a) => a.createdAt),
        lastDays
      ),
      notifications: buildTrend(
        data.notifications.map((n) => n.createdAt),
        lastDays
      ),
    };
  }, [data, lastDays]);

  const overviewSegments: Segment[] = useMemo(
    () => [
      { label: "Clubs", value: myClubsCount, color: COLORS.emerald },
      { label: "Events", value: upcomingEventsCount, color: COLORS.sky },
      { label: "Activities", value: activitiesCount, color: COLORS.amber },
      {
        label: "Unread alerts",
        value: unreadNotifications,
        color: COLORS.violet,
      },
    ],
    [myClubsCount, upcomingEventsCount, activitiesCount, unreadNotifications]
  );

  const clubCategorySegments: Segment[] = useMemo(() => {
    const map = new Map<string, number>();

    for (const club of data.myClubs) {
      const key = (club.category || "General").trim() || "General";
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries()).map(([label, value], index) => ({
      label,
      value,
      color: PALETTE[index % PALETTE.length],
    }));
  }, [data.myClubs]);

  const eventsByMonth = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; value: number }> = [];

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);

      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-IN", { month: "short" }),
        value: 0,
      });
    }

    for (const event of data.events) {
      const d = getEventDate(event);

      if (!d) continue;

      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const target = months.find((m) => m.key === key);

      if (target) target.value++;
    }

    return months;
  }, [data.events]);

  const completedActivities = useMemo(
    () => data.activities.filter(isActivityCompleted).length,
    [data.activities]
  );

  const upcomingActivities = Math.max(
    activitiesCount - completedActivities,
    0
  );

  const readNotifications = data.notifications.length - unreadNotifications;

  const dayLabels = useMemo(
    () =>
      lastDays.map((d) =>
        d.toLocaleDateString("en-IN", { weekday: "short" })
      ),
    [lastDays]
  );

  /* ---------- PANEL DATA ---------- */

  const nextEvent = useMemo(
    () => data.events.find((event) => getEventDate(event) !== null) ?? null,
    [data.events]
  );

  const nextEventDate = useMemo(
    () => (nextEvent ? getEventDate(nextEvent) : null),
    [nextEvent]
  );

  const calendarDays = useMemo(() => {
    const start = nowMs !== null ? new Date(nowMs) : new Date();
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 14 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);

      const count = data.events.filter((event) => {
        const d = getEventDate(event);

        return d ? sameDay(d, day) : false;
      }).length;

      return { date: day, count, isToday: i === 0 };
    });
  }, [data.events, nowMs]);

  const venueBars = useMemo(() => {
    const map = new Map<string, { label: string; value: number }>();

    for (const event of data.events) {
      const raw =
        (
          event.location ||
          event.venue ||
          event.club?.name ||
          "Campus event"
        ).trim() || "Campus event";

      const key = raw.toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.value++;
      } else {
        map.set(key, { label: toTitleCase(raw), value: 1 });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((item, index) => ({
        ...item,
        color: PALETTE[index % PALETTE.length],
      }));
  }, [data.events]);

  const feedMix = useMemo(() => {
    const counts: Record<FeedType, number> = {
      club: 0,
      event: 0,
      activity: 0,
      notification: 0,
    };

    for (const item of recentActivity) {
      counts[item.type]++;
    }

    return (Object.keys(counts) as FeedType[]).map((type) => ({
      label: ACTIVITY_META[type].label,
      value: counts[type],
      color: ACTIVITY_META[type].color,
    }));
  }, [recentActivity]);

  const heatDays = useMemo(() => buildLastDays(30), []);

  const heatValues = useMemo(
    () =>
      buildTrend(
        [
          ...data.myClubs.map((c) => c.createdAt),
          ...data.events.map((e) => e.createdAt),
          ...data.activities.map((a) => a.completedAt || a.createdAt),
          ...data.notifications.map((n) => n.createdAt),
        ],
        heatDays
      ),
    [data, heatDays]
  );

  const featureMax = Math.max(
    myClubsCount,
    upcomingEventsCount,
    activitiesCount,
    unreadNotifications,
    1
  );

  /* ---------- RENDER ---------- */

  return (
    <StudentLayout>
      <DashboardStyles />

      <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
        <main className="w-full min-w-0">
          <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">
            {/* =================================================
                HERO
            ================================================== */}

            <div className="cc-gradient-bg relative mb-7 overflow-hidden rounded-3xl p-7 text-white shadow-xl shadow-emerald-900/10 sm:p-9">
              <div className="cc-float pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

              <div
                className="cc-float pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl"
                style={{ animationDelay: "-3s" }}
              />

              <div className="cc-spin-slow pointer-events-none absolute right-[35%] top-10 h-24 w-24 rounded-full border border-dashed border-emerald-300/20" />

              <div
                className="cc-spin-slow pointer-events-none absolute right-[12%] bottom-6 h-16 w-16 rounded-full border border-emerald-300/15"
                style={{ animationDirection: "reverse" }}
              />

              <div className="cc-grid-overlay pointer-events-none absolute inset-0 opacity-[0.07]" />

              <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                <div className="cc-fade-up">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                      <Sparkles size={13} />

                      {getGreeting()}, welcome back
                    </div>

                    <LiveBadge refreshing={refreshing} />
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Your campus.

                    <span className="cc-shine-text block text-emerald-300">
                      Your experience.
                    </span>
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                    Discover clubs, explore events, participate in activities
                    and stay connected with everything happening around your
                    campus.
                  </p>
                </div>

                <div
                  className="cc-fade-up flex flex-col items-start gap-4 lg:items-end"
                  style={{ animationDelay: "120ms" }}
                >
                  <LiveClock />

                  {lastUpdated && (
                    <p className="text-[11px] text-emerald-200/70">
                      Last synced{" "}
                      {lastUpdated.toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>

              <RefreshProgress refreshKey={lastUpdated?.getTime() ?? 0} />
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="cc-fade-up mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void loadDashboard(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================== */}

            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                index={0}
                icon={<Building2 size={20} />}
                title="My Clubs"
                numericValue={myClubsCount}
                loading={loading}
                description="Clubs joined"
                color={COLORS.emerald}
                trend={trends.clubs}
              />

              <StatCard
                index={1}
                icon={<CalendarDays size={20} />}
                title="Upcoming Events"
                numericValue={upcomingEventsCount}
                loading={loading}
                description="Events available"
                color={COLORS.sky}
                trend={trends.events}
              />

              <StatCard
                index={2}
                icon={<CheckCircle2 size={20} />}
                title="Activities"
                numericValue={activitiesCount}
                loading={loading}
                description="Activities recorded"
                color={COLORS.amber}
                trend={trends.activities}
              />

              <StatCard
                index={3}
                icon={<Bell size={20} />}
                title="Notifications"
                numericValue={unreadNotifications}
                loading={loading}
                description="Unread updates"
                color={COLORS.violet}
                trend={trends.notifications}
              />
            </div>

            {/* =================================================
                ANALYTICS
            ================================================== */}

            <div className="mb-7">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Analytics
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Your Campus Insights
                </h2>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                {/* ---------- OVERVIEW DONUT ---------- */}

                <ChartCard
                  index={0}
                  icon={<PieChartIcon size={18} />}
                  title="Campus Overview"
                  subtitle="Share of your campus engagement"
                >
                  {loading ? (
                    <ChartSkeleton />
                  ) : (
                    <DonutChart
                      segments={overviewSegments}
                      centerValue={
                        myClubsCount +
                        upcomingEventsCount +
                        activitiesCount +
                        unreadNotifications
                      }
                      centerLabel="Total items"
                    />
                  )}
                </ChartCard>

                {/* ---------- CLUB CATEGORY PIE ---------- */}

                <ChartCard
                  index={1}
                  icon={<Building2 size={18} />}
                  title="Clubs by Category"
                  subtitle="Where your interests lie"
                >
                  {loading ? (
                    <ChartSkeleton />
                  ) : clubCategorySegments.length > 0 ? (
                    <DonutChart
                      segments={clubCategorySegments}
                      variant="pie"
                    />
                  ) : (
                    <ChartEmpty text="Join a club to see your category split." />
                  )}
                </ChartCard>

                {/* ---------- RADIAL PROGRESS ---------- */}

                <ChartCard
                  index={2}
                  icon={<Activity size={18} />}
                  title="Activities & Notifications"
                  subtitle="Upcoming activities and your inbox"
                >
                  {loading ? (
                    <ChartSkeleton />
                  ) : (
                    <ActivityAlertsChart
                      upcomingActivities={upcomingActivities}
                      completedActivities={completedActivities}
                      unreadAlerts={unreadNotifications}
                      readAlerts={readNotifications}
                    />
                  )}
                </ChartCard>

                {/* ---------- WEEKLY TREND ---------- */}

                <ChartCard
                  index={3}
                  icon={<TrendingUp size={18} />}
                  title="7-Day Activity Pulse"
                  subtitle="New items added over the last week"
                  className="xl:col-span-2"
                >
                  {loading ? (
                    <ChartSkeleton />
                  ) : (
                    <TrendChart
                      labels={dayLabels}
                      series={[
                        {
                          name: "Clubs",
                          color: COLORS.emerald,
                          values: trends.clubs,
                        },
                        {
                          name: "Events",
                          color: COLORS.sky,
                          values: trends.events,
                        },
                        {
                          name: "Activities",
                          color: COLORS.amber,
                          values: trends.activities,
                        },
                        {
                          name: "Alerts",
                          color: COLORS.violet,
                          values: trends.notifications,
                        },
                      ]}
                    />
                  )}
                </ChartCard>

                {/* ---------- EVENTS BAR ---------- */}

                <ChartCard
                  index={4}
                  icon={<BarChart3 size={18} />}
                  title="Events Timeline"
                  subtitle="Upcoming events, next 6 months"
                >
                  {loading ? (
                    <ChartSkeleton />
                  ) : (
                    <BarChart items={eventsByMonth} color={COLORS.sky} />
                  )}
                </ChartCard>
              </div>
            </div>

            {/* =================================================
                QUICK ACCESS
            ================================================== */}

            <div className="mb-7">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Quick Access
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Explore CampusConnect
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <FeatureCard
                  index={0}
                  href="/clubs"
                  icon={<Building2 size={22} />}
                  title="Clubs"
                  description="Find communities and join clubs that match your interests."
                  stat={{ value: myClubsCount, label: "Clubs joined", color: COLORS.emerald, loading, max: featureMax }}
                />

                <FeatureCard
                  index={1}
                  href="/events"
                  icon={<CalendarDays size={22} />}
                  title="Events"
                  description="Discover workshops, competitions and campus events."
                  stat={{ value: upcomingEventsCount, label: "Upcoming", color: COLORS.sky, loading, max: featureMax }}
                />

                <FeatureCard
                  index={2}
                  href="/activities"
                  icon={<BookOpen size={22} />}
                  title="Activities"
                  description="Track your participation and campus activities."
                  stat={{ value: activitiesCount, label: "Recorded", color: COLORS.amber, loading, max: featureMax }}
                />

                <FeatureCard
                  index={3}
                  href="/dashboard/student/attendance"
                  icon={<ClipboardCheck size={22} />}
                  title="Attendance"
                  description="Check your subject-wise academic attendance and attendance history."
                />

                <FeatureCard
                  index={4}
                  href="/notifications"
                  icon={<Bell size={22} />}
                  title="Notifications"
                  description="Stay updated with important campus announcements."
                  stat={{ value: unreadNotifications, label: "Unread", color: COLORS.violet, loading, max: featureMax }}
                />
              </div>
            </div>

            {/* =================================================
                LOWER SECTION
            ================================================== */}

            <div className="grid gap-6 xl:grid-cols-3">
              {/* =================================================
                  UPCOMING EVENTS
              ================================================== */}

              <div
                className="cc-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
                style={{ animationDelay: "100ms" }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Upcoming Events
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Do not miss what is happening on campus.
                    </p>
                  </div>

                  <Link
                    href="/events"
                    className="flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                  >
                    View all
                    <ChevronRight size={16} />
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="cc-shimmer h-[74px] rounded-2xl"
                      />
                    ))}
                  </div>
                ) : dashboardEvents.length > 0 ? (
                  <div className="space-y-3">
                    {nextEvent && nextEventDate && (
                      <NextEventCountdown
                        event={nextEvent}
                        date={nextEventDate}
                      />
                    )}

                    <EventsMiniCalendar days={calendarDays} />

                    <p className="pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Scheduled events
                    </p>

                    {dashboardEvents.map((event, index) => {
                      const eventDate = getEventDate(event);

                      return (
                        <Link
                          href="/events"
                          key={String(event.id)}
                          className="cc-fade-up group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center"
                          style={{ animationDelay: `${index * 90}ms` }}
                        >
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-white">
                            <CalendarDays size={21} />

                            {index === 0 && (
                              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                <span className="cc-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-600">
                              {event.title}
                            </h3>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {event.location ||
                                event.venue ||
                                event.club?.name ||
                                "Campus event"}
                            </p>
                          </div>

                          <div className="shrink-0 text-left sm:text-right">
                            {eventDate && (
                              <DaysAwayBadge date={eventDate} now={nowMs} />
                            )}

                            <p className="text-xs font-semibold text-emerald-600">
                              {eventDate
                                ? formatDate(eventDate.toISOString())
                                : "Upcoming"}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatTime(event)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  <VenueBars items={venueBars} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
                    <div className="cc-float mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                      <CalendarDays size={25} />
                    </div>

                    <h3 className="font-semibold text-slate-800">
                      No upcoming events
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                      New campus events will appear here when they are
                      available.
                    </p>

                    <Link
                      href="/events"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      Browse Events
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>

              {/* =================================================
                  RECENT ACTIVITY
              ================================================== */}

              <div
                className="cc-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                style={{ animationDelay: "180ms" }}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Recent Activity
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Your latest campus activity.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    <span className="relative flex h-2 w-2">
                      <span className="cc-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="cc-shimmer h-12 rounded-xl" />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-6">
                  <div className="relative space-y-5">
                    <div className="cc-grow-y absolute bottom-3 left-[17px] top-3 w-px bg-gradient-to-b from-emerald-300 via-slate-200 to-transparent" />

                    {recentActivity.map((item, index) => {
                      let icon = <Sparkles size={17} />;

                      if (item.type === "club") {
                        icon = <Building2 size={17} />;
                      }

                      if (item.type === "event") {
                        icon = <CalendarDays size={17} />;
                      }

                      if (item.type === "activity") {
                        icon = <BookOpen size={17} />;
                      }

                      if (item.type === "notification") {
                        icon = <Bell size={17} />;
                      }

                      return (
                        <ActivityItem
                          key={`${item.type}-${index}`}
                          index={index}
                          icon={icon}
                          type={item.type}
                          now={nowMs}
                          title={item.title}
                          description={item.description}
                          date={item.date}
                        />
                      );
                    })}
                  </div>

                    <FeedMixBar items={feedMix} />

                    <HeatStrip days={heatDays} values={heatValues} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
                    <div className="cc-float mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                      <Sparkles size={21} />
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      No recent activity
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your latest club, event, activity and notification
                      updates will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                FOOTER
            ================================================== */}

            <footer className="mt-8 border-t border-slate-200 py-6">
              <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
                <p>© 2026 CampusConnect. Smart Campus Management.</p>

                <p>Student Portal</p>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </StudentLayout>
  );
}

/* ============================================================
   GLOBAL ANIMATION STYLES
============================================================ */

function DashboardStyles() {
  return (
    <style>{`
      @keyframes ccFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes ccFloat {
        0%, 100% { transform: translateY(0) translateX(0) scale(1); }
        50%      { transform: translateY(-14px) translateX(8px) scale(1.05); }
      }

      @keyframes ccSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      @keyframes ccPing {
        0%   { transform: scale(1); opacity: .75; }
        75%, 100% { transform: scale(2.4); opacity: 0; }
      }

      @keyframes ccShimmer {
        0%   { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }

      @keyframes ccGradient {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes ccShine {
        0%   { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      @keyframes ccDraw {
        from { stroke-dashoffset: 1; }
        to   { stroke-dashoffset: 0; }
      }

      @keyframes ccPopIn {
        0%   { opacity: 0; transform: scale(.4); }
        100% { opacity: 1; transform: scale(1); }
      }

      @keyframes ccProgress {
        from { width: 0%; }
        to   { width: 100%; }
      }

      .cc-fade-up {
        opacity: 0;
        animation: ccFadeUp .7s cubic-bezier(.22,1,.36,1) forwards;
      }

      .cc-float {
        animation: ccFloat 9s ease-in-out infinite;
      }

      .cc-spin-slow {
        animation: ccSpin 28s linear infinite;
      }

      .cc-ping {
        animation: ccPing 1.6s cubic-bezier(0,0,.2,1) infinite;
      }

      .cc-shimmer {
        background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
        background-size: 800px 100%;
        animation: ccShimmer 1.4s linear infinite;
      }

      .cc-gradient-bg {
        background: linear-gradient(120deg, #0b2d22, #0e3b2d, #124a3b, #0b3a35, #0b2d22);
        background-size: 300% 300%;
        animation: ccGradient 14s ease infinite;
      }

      .cc-grid-overlay {
        background-image:
          linear-gradient(to right, #fff 1px, transparent 1px),
          linear-gradient(to bottom, #fff 1px, transparent 1px);
        background-size: 36px 36px;
      }

      .cc-shine-text {
        background: linear-gradient(90deg, #6ee7b7 0%, #ffffff 40%, #6ee7b7 80%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: ccShine 5s linear infinite;
      }

      .cc-draw {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        animation: ccDraw 1.6s cubic-bezier(.22,1,.36,1) forwards;
      }

      .cc-pop {
        opacity: 0;
        animation: ccPopIn .5s cubic-bezier(.34,1.56,.64,1) forwards;
      }

      .cc-progress-bar {
        animation: ccProgress ${LIVE_REFRESH_MS}ms linear forwards;
      }

      @keyframes ccSlideIn {
        from { opacity: 0; transform: translateX(-16px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      @keyframes ccTick {
        from { opacity: .35; transform: translateY(-5px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes ccSweep {
        0%   { transform: translateX(-100%); }
        60%, 100% { transform: translateX(100%); }
      }

      @keyframes ccGrowY {
        from { transform: scaleY(0); }
        to   { transform: scaleY(1); }
      }

      .cc-slide-in {
        opacity: 0;
        animation: ccSlideIn .6s cubic-bezier(.22,1,.36,1) forwards;
      }

      .cc-tick {
        display: inline-block;
        animation: ccTick .35s ease-out;
      }

      .cc-bar-shine {
        position: relative;
        overflow: hidden;
      }

      .cc-bar-shine::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent);
        transform: translateX(-100%);
        animation: ccSweep 2.8s ease-in-out infinite;
      }

      .cc-grow-y {
        transform-origin: top;
        animation: ccGrowY 1s cubic-bezier(.22,1,.36,1) both;
      }

      @media (prefers-reduced-motion: reduce) {
        .cc-fade-up,
        .cc-float,
        .cc-spin-slow,
        .cc-ping,
        .cc-shimmer,
        .cc-gradient-bg,
        .cc-shine-text,
        .cc-draw,
        .cc-pop,
        .cc-slide-in,
        .cc-tick,
        .cc-grow-y,
        .cc-progress-bar {
          animation: none !important;
          opacity: 1 !important;
          stroke-dashoffset: 0 !important;
        }

        .cc-bar-shine::after {
          display: none;
        }
      }
    `}</style>
  );
}

/* ============================================================
   LIVE WIDGETS
============================================================ */

function LiveBadge({ refreshing }: { refreshing: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-black/20 px-3 py-1.5 text-xs font-semibold text-emerald-100">
      <span className="relative flex h-2 w-2">
        <span className="cc-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>

      {refreshing ? "Syncing..." : "Live"}
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const first = window.setTimeout(() => setNow(new Date()), 0);
    const interval = window.setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-left backdrop-blur lg:text-right">
      <p className="font-mono text-2xl font-bold tabular-nums tracking-wider text-white">
        {now
          ? now.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
          : "--:--:--"}
      </p>

      <p className="mt-0.5 text-[11px] text-emerald-200/80">
        {now
          ? now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })
          : ""}
      </p>
    </div>
  );
}

function RefreshProgress({ refreshKey }: { refreshKey: number }) {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/5">
      <div
        key={refreshKey}
        className="cc-progress-bar h-full bg-gradient-to-r from-emerald-300 to-teal-300"
      />
    </div>
  );
}

/* ============================================================
   CHARTS
============================================================ */

function ChartCard({
  index,
  icon,
  title,
  subtitle,
  children,
  className = "",
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`cc-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg ${className}`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
          {icon}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>

          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="cc-shimmer h-[200px] rounded-2xl" />;
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
      <div className="cc-float mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
        <PieChartIcon size={20} />
      </div>

      <p className="text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

/* ---------- DONUT / PIE ---------- */

function DonutChart({
  segments,
  variant = "donut",
  centerValue,
  centerLabel,
}: {
  segments: Segment[];
  variant?: "donut" | "pie";
  centerValue?: number;
  centerLabel?: string;
}) {
  const mounted = useMounted();
  const [hovered, setHovered] = useState<number | null>(null);

  const size = 200;
  const stroke = variant === "pie" ? size / 2 : 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visibleCount = segments.filter((s) => s.value > 0).length;
  const gap = variant === "pie" || visibleCount < 2 ? 0 : 5;

  const animatedCenter = useCountUp(centerValue ?? 0, 1400);

  let accumulated = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eef2f1"
            strokeWidth={stroke}
          />

          {total > 0 &&
            segments.map((segment, i) => {
              if (segment.value <= 0) return null;

              const length = (segment.value / total) * circumference;
              const dashLength = Math.max(length - gap, 0);
              const offset = accumulated;

              accumulated += length;

              const isActive = hovered === i;

              return (
                <circle
                  key={segment.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isActive ? stroke + 6 : stroke}
                  strokeDasharray={`${
                    mounted ? dashLength : 0
                  } ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    transition: `stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1) ${
                      i * 120
                    }ms, stroke-width .25s ease, opacity .25s ease`,
                    opacity: hovered === null || isActive ? 1 : 0.45,
                    cursor: "pointer",
                  }}
                />
              );
            })}
        </svg>

        {variant === "donut" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {hovered !== null
                ? segments[hovered].value
                : animatedCenter}
            </p>

            <p className="text-[11px] font-medium text-slate-500">
              {hovered !== null ? segments[hovered].label : centerLabel}
            </p>
          </div>
        )}
      </div>

      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
        {segments.map((segment, i) => {
          const percent =
            total > 0 ? Math.round((segment.value / total) * 100) : 0;

          return (
            <div
              key={segment.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cc-pop flex cursor-default items-center gap-2 rounded-lg px-2 py-1 text-xs transition hover:bg-slate-50"
              style={{ animationDelay: `${300 + i * 80}ms` }}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: segment.color }}
              />

              <span className="min-w-0 flex-1 truncate text-slate-600">
                {segment.label}
              </span>

              <span className="font-semibold tabular-nums text-slate-900">
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- ACTIVITIES & NOTIFICATIONS (GROUPED BARS) ---------- */

function ActivityAlertsChart({
  upcomingActivities,
  completedActivities,
  unreadAlerts,
  readAlerts,
}: {
  upcomingActivities: number;
  completedActivities: number;
  unreadAlerts: number;
  readAlerts: number;
}) {
  const mounted = useMounted(100);
  const [hovered, setHovered] = useState<number | null>(null);

  const alertsTotal = unreadAlerts + readAlerts;

  const upcomingAnimated = useCountUp(upcomingActivities, 1200);
  const alertsAnimated = useCountUp(alertsTotal, 1200);

  const bars = [
    {
      label: "Upcoming",
      value: upcomingActivities,
      color: COLORS.amber,
    },
    {
      label: "Completed",
      value: completedActivities,
      color: COLORS.emerald,
    },
    {
      label: "Unread",
      value: unreadAlerts,
      color: COLORS.violet,
    },
    {
      label: "Read",
      value: readAlerts,
      color: COLORS.sky,
    },
  ];

  const max = Math.max(...bars.map((bar) => bar.value), 1);

  const everything = bars.reduce((sum, bar) => sum + bar.value, 0);

  if (everything === 0) {
    return <ChartEmpty text="No activities or notifications yet." />;
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div
          className="relative overflow-hidden rounded-2xl p-3"
          style={{ background: `${COLORS.amber}14` }}
        >
          <p className="text-[11px] font-semibold text-amber-700">
            Upcoming activities
          </p>

          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {upcomingAnimated}
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl p-3"
          style={{ background: `${COLORS.violet}14` }}
        >
          <p className="text-[11px] font-semibold text-violet-700">
            Notifications
          </p>

          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {alertsAnimated}
          </p>
        </div>
      </div>

      <div className="grid h-[190px] grid-cols-4 gap-3">
        {bars.map((bar, i) => (
          <div
            key={bar.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="flex h-full cursor-default flex-col items-center justify-end gap-1.5"
          >
            <span className="text-xs font-bold tabular-nums text-slate-900">
              {bar.value}
            </span>

            <div className="relative flex w-full flex-1 items-end">
              <div
                className="cc-bar-shine w-full rounded-t-xl"
                style={{
                  height: mounted
                    ? `${Math.max((bar.value / max) * 100, bar.value > 0 ? 8 : 3)}%`
                    : "0%",
                  background:
                    bar.value > 0
                      ? `linear-gradient(180deg, ${bar.color}, ${bar.color}88)`
                      : "#e2e8f0",
                  boxShadow:
                    bar.value > 0 ? `0 6px 16px ${bar.color}33` : "none",
                  opacity: hovered === null || hovered === i ? 1 : 0.45,
                  transition: `height 1s cubic-bezier(.22,1,.36,1) ${
                    i * 100
                  }ms, opacity .25s ease`,
                }}
              />
            </div>

            <span className="text-[11px] font-medium text-slate-500">
              {bar.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-100 pt-2 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Activities
        </span>

        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Notifications
        </span>
      </div>
    </div>
  );
}

/* ---------- BAR CHART ---------- */

function BarChart({
  items,
  color,
}: {
  items: Array<{ label: string; value: number }>;
  color: string;
}) {
  const mounted = useMounted(100);
  const max = Math.max(...items.map((i) => i.value), 1);
  const total = items.reduce((s, i) => s + i.value, 0);

  if (total === 0) {
    return <ChartEmpty text="No dated events in the next 6 months yet." />;
  }

  return (
    <div className="flex h-[220px] items-end gap-3 pt-6">
      {items.map((item, i) => (
        <div
          key={item.label + i}
          className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
        >
          <div className="relative flex w-full flex-1 items-end">
            <div
              className="relative w-full rounded-t-xl"
              style={{
                height: mounted
                  ? `${Math.max((item.value / max) * 100, item.value > 0 ? 6 : 2)}%`
                  : "0%",
                background:
                  item.value > 0
                    ? `linear-gradient(180deg, ${color}, ${color}88)`
                    : "#e2e8f0",
                transition: `height 1s cubic-bezier(.22,1,.36,1) ${i * 90}ms`,
                boxShadow:
                  item.value > 0 ? `0 6px 16px ${color}33` : "none",
              }}
            >
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                {item.value}
              </span>
            </div>
          </div>

          <span className="text-[11px] font-medium text-slate-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- TREND (MULTI-LINE AREA) ---------- */

function TrendChart({
  labels,
  series,
}: {
  labels: string[];
  series: Array<{ name: string; color: string; values: number[] }>;
}) {
  const uid = useId().replace(/:/g, "");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 600;
  const height = 220;
  const padX = 24;
  const padTop = 16;
  const padBottom = 28;

  const maxValue = Math.max(
    ...series.flatMap((s) => s.values),
    1
  );

  const xFor = (i: number) =>
    padX + (i * (width - padX * 2)) / Math.max(labels.length - 1, 1);

  const yFor = (v: number) =>
    padTop + (1 - v / maxValue) * (height - padTop - padBottom);

  const pathFor = (values: number[]) =>
    values
      .map((v, i) => {
        if (i === 0) return `M ${xFor(i)} ${yFor(v)}`;

        const prevX = xFor(i - 1);
        const prevY = yFor(values[i - 1]);
        const x = xFor(i);
        const y = yFor(v);
        const cx = (prevX + x) / 2;

        return `C ${cx} ${prevY}, ${cx} ${y}, ${x} ${y}`;
      })
      .join(" ");

  const areaFor = (values: number[]) =>
    `${pathFor(values)} L ${xFor(values.length - 1)} ${height - padBottom} L ${xFor(0)} ${height - padBottom} Z`;

  const hasData = series.some((s) => s.values.some((v) => v > 0));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />

            <span className="text-slate-600">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient
                key={s.name}
                id={`${uid}-grad-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padTop + t * (height - padTop - padBottom);

            return (
              <line
                key={t}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 6"
              />
            );
          })}

          {hasData &&
            series.map((s, i) => (
              <path
                key={`area-${s.name}`}
                d={areaFor(s.values)}
                fill={`url(#${uid}-grad-${i})`}
                className="cc-fade-up"
                style={{ animationDelay: `${600 + i * 100}ms` }}
              />
            ))}

          {hasData &&
            series.map((s) => (
              <path
                key={`line-${s.name}`}
                d={pathFor(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                pathLength={1}
                className="cc-draw"
              />
            ))}

          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={padTop}
              y2={height - padBottom}
              stroke="#94a3b8"
              strokeDasharray="3 4"
            />
          )}

          {hasData &&
            series.map((s) =>
              s.values.map((v, i) => (
                <circle
                  key={`${s.name}-${i}`}
                  cx={xFor(i)}
                  cy={yFor(v)}
                  r={hoverIndex === i ? 5 : 3}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                  style={{ transition: "r .2s ease" }}
                />
              ))
            )}

          {labels.map((label, i) => (
            <text
              key={label + i}
              x={xFor(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#94a3b8"
            >
              {label}
            </text>
          ))}

          {labels.map((label, i) => (
            <rect
              key={`hit-${label}-${i}`}
              x={xFor(i) - (width - padX * 2) / (labels.length * 2)}
              y={0}
              width={(width - padX * 2) / labels.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}
        </svg>

        {hoverIndex !== null && hasData && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(xFor(hoverIndex) / width) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="mb-1 font-semibold text-slate-800">
              {labels[hoverIndex]}
            </p>

            {series.map((s) => (
              <p key={s.name} className="flex items-center gap-2 text-slate-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                {s.name}:{" "}
                <span className="font-semibold text-slate-900">
                  {s.values[hoverIndex]}
                </span>
              </p>
            ))}
          </div>
        )}

        {!hasData && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-full bg-slate-100 px-4 py-1.5 text-xs text-slate-500">
              No new items in the last 7 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- SPARKLINE ---------- */

function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const uid = useId().replace(/:/g, "");

  const width = 120;
  const height = 36;
  const max = Math.max(...values, 1);

  const points = values.map((v, i) => {
    const x = (i * width) / Math.max(values.length - 1, 1);
    const y = height - 4 - (v / max) * (height - 8);

    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-9 w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${uid}-spark`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${uid}-spark)`} />

      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="cc-draw"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  index,
  icon,
  title,
  numericValue,
  loading,
  description,
  color,
  trend,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  numericValue: number;
  loading: boolean;
  description: string;
  color: string;
  trend: number[];
}) {
  const animated = useCountUp(loading ? 0 : numericValue, 1300);

  return (
    <div
      className="cc-fade-up group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-2xl transition duration-500 group-hover:opacity-30"
        style={{ background: color }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
            {loading ? "..." : animated}
          </p>
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 group-hover:rotate-6 group-hover:scale-110"
          style={{ background: `${color}1f`, color }}
        >
          {icon}
        </div>
      </div>

      <div className="relative mt-3">
        <Sparkline values={trend} color={color} />
      </div>

      <p className="relative mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  index,
  href,
  icon,
  title,
  description,
  stat,
}: {
  index: number;
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  stat?: {
    value: number;
    label: string;
    color: string;
    loading: boolean;
    max: number;
  };
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    element.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMove}
      className="cc-fade-up group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(16,185,129,0.14), transparent 70%)",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-emerald-400 to-teal-400 transition duration-500 group-hover:scale-x-100" />

      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition duration-300 group-hover:rotate-6 group-hover:bg-emerald-500 group-hover:text-white">
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500"
        />
      </div>

      <h3 className="relative text-base font-bold text-slate-900">{title}</h3>

      <p className="relative mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      {stat && <FeatureStat {...stat} />}
    </Link>
  );
}

function FeatureStat({
  value,
  label,
  color,
  loading,
  max,
}: {
  value: number;
  label: string;
  color: string;
  loading: boolean;
  max: number;
}) {
  const animated = useCountUp(loading ? 0 : value, 1200);
  const mounted = useMounted(200);

  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="relative mt-auto pt-4">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-500">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: color }}
          />

          {label}
        </span>

        <span className="font-bold tabular-nums text-slate-900">
          {loading ? "..." : animated}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="cc-bar-shine h-full rounded-full"
          style={{
            width:
              mounted && !loading
                ? `${Math.max(percent, value > 0 ? 8 : 0)}%`
                : "0%",
            background: color,
            transition: "width 1.1s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   UPCOMING EVENTS WIDGETS
============================================================ */

function DaysAwayBadge({ date, now }: { date: Date; now: number | null }) {
  if (now === null) {
    return null;
  }

  const days = getDaysUntil(date, now);

  let label = `In ${days} days`;
  let tone = "bg-emerald-50 text-emerald-600";

  if (days <= 0) {
    label = "Today";
    tone = "bg-amber-100 text-amber-700";
  } else if (days === 1) {
    label = "Tomorrow";
    tone = "bg-amber-50 text-amber-600";
  }

  return (
    <span
      className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}
    >
      {days <= 1 && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="cc-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
      )}

      {label}
    </span>
  );
}

function NextEventCountdown({
  event,
  date,
}: {
  event: EventItem;
  date: Date;
}) {
  const now = useNow(1000);
  const mounted = useMounted(200);

  const remaining = now === null ? null : Math.max(date.getTime() - now, 0);

  const days = remaining === null ? 0 : Math.floor(remaining / 86400000);
  const hours =
    remaining === null ? 0 : Math.floor((remaining % 86400000) / 3600000);
  const minutes =
    remaining === null ? 0 : Math.floor((remaining % 3600000) / 60000);
  const seconds =
    remaining === null ? 0 : Math.floor((remaining % 60000) / 1000);

  const progress =
    remaining === null
      ? 0
      : Math.min(
          Math.max(100 - (remaining / (14 * 86400000)) * 100, 4),
          100
        );

  const units = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b] p-5 text-white shadow-lg shadow-emerald-900/10">
      <div className="cc-float pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />

      <div className="cc-spin-slow pointer-events-none absolute -bottom-8 left-1/3 h-20 w-20 rounded-full border border-dashed border-emerald-300/20" />

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="cc-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </span>

            <Timer size={12} />

            Next up
          </div>

          <h3 className="truncate text-lg font-bold">{event.title}</h3>

          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-emerald-100/80">
            <MapPin size={12} className="shrink-0" />

            <span className="truncate">
              {event.location ||
                event.venue ||
                event.club?.name ||
                "Campus event"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="flex w-14 flex-col items-center rounded-xl border border-white/10 bg-white/10 py-2 backdrop-blur"
            >
              <span
                key={`${unit.label}-${unit.value}`}
                className="cc-tick font-mono text-xl font-bold tabular-nums"
              >
                {remaining === null ? "--" : pad2(unit.value)}
              </span>

              <span className="text-[10px] uppercase tracking-wider text-emerald-200/80">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-emerald-200/70">
          <span>Event approaching</span>

          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="cc-bar-shine h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-300"
            style={{
              width: mounted ? `${progress}%` : "0%",
              transition: "width 1.4s cubic-bezier(.22,1,.36,1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function EventsMiniCalendar({
  days,
}: {
  days: Array<{ date: Date; count: number; isToday: boolean }>;
}) {
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <CalendarClock size={14} className="text-emerald-500" />
          Next 14 days
        </p>

        <p className="text-[11px] text-slate-400">
          {total} {total === 1 ? "event" : "events"} scheduled
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:[grid-template-columns:repeat(14,minmax(0,1fr))]">
        {days.map((day, i) => {
          const tone = day.isToday
            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
            : day.count > 0
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-white text-slate-500 ring-1 ring-slate-100";

          return (
            <div
              key={i}
              title={`${day.date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })} · ${day.count} ${day.count === 1 ? "event" : "events"}`}
              className={`cc-pop flex flex-col items-center rounded-xl py-2 text-center transition hover:-translate-y-0.5 ${tone}`}
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
                {day.date.toLocaleDateString("en-IN", { weekday: "short" })}
              </span>

              <span className="text-sm font-bold tabular-nums">
                {day.date.getDate()}
              </span>

              <span className="mt-1 flex h-1.5 items-center gap-0.5">
                {Array.from({ length: Math.min(day.count, 3) }).map((_, d) => (
                  <span
                    key={d}
                    className={`h-1.5 w-1.5 rounded-full ${
                      day.isToday ? "bg-white" : "bg-emerald-500"
                    }`}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VenueBars({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const mounted = useMounted(150);

  if (items.length === 0) {
    return null;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700">
        <MapPin size={14} className="text-emerald-500" />
        Events by venue
      </p>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate text-slate-600">{item.label}</span>

              <span className="font-semibold tabular-nums text-slate-900">
                {item.value}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="cc-bar-shine h-full rounded-full"
                style={{
                  width: mounted ? `${(item.value / max) * 100}%` : "0%",
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}aa)`,
                  transition: `width 1s cubic-bezier(.22,1,.36,1) ${i * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   RECENT ACTIVITY WIDGETS
============================================================ */

function ActivityItem({
  index,
  icon,
  type,
  now,
  title,
  description,
  date,
}: {
  index: number;
  icon: React.ReactNode;
  type: FeedType;
  now: number | null;
  title: string;
  description: string;
  date?: string | null;
}) {
  const meta = ACTIVITY_META[type];
  const relative = now !== null ? getRelativeTime(date, now) : "";

  return (
    <div
      className="cc-slide-in group relative flex gap-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-white transition duration-300 group-hover:rotate-6 group-hover:scale-110"
        style={{ background: `${meta.color}1f`, color: meta.color }}
      >
        {icon}

        {index === 0 && (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
            <span
              className="cc-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: meta.color }}
            />

            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: meta.color }}
            />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-800">
            {title}
          </p>

          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ background: `${meta.color}1a`, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>

        {date && (
          <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Clock3 size={10} />

            {formatDate(date)}

            {relative && (
              <>
                <span className="text-slate-300">•</span>

                <span>{relative}</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function FeedMixBar({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const mounted = useMounted(150);

  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700">
        <Activity size={14} className="text-emerald-500" />
        Feed mix
      </p>

      <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-slate-200/70">
        {items
          .filter((item) => item.value > 0)
          .map((item, i) => (
            <div
              key={item.label}
              title={`${item.label}: ${item.value}`}
              className="cc-bar-shine h-full rounded-full"
              style={{
                width: mounted ? `${(item.value / total) * 100}%` : "0%",
                background: item.color,
                transition: `width 1s cubic-bezier(.22,1,.36,1) ${i * 120}ms`,
              }}
            />
          ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: item.color }}
            />

            <span className="text-slate-500">{item.label}</span>

            <span className="font-semibold tabular-nums text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatStrip({ days, values }: { days: Date[]; values: number[] }) {
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);

  const opacities = [0, 0.3, 0.5, 0.75, 1];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Flame size={14} className="text-amber-500" />
          30-day pulse
        </p>

        <p className="text-[11px] text-slate-400">{total} updates</p>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
      >
        {values.map((value, i) => {
          const level = value === 0 ? 0 : Math.max(1, Math.ceil((value / max) * 4));

          return (
            <div
              key={i}
              title={`${days[i].toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })} · ${value} ${value === 1 ? "update" : "updates"}`}
              className={`cc-pop aspect-square rounded-md transition hover:scale-125 ${
                i === values.length - 1
                  ? "ring-2 ring-emerald-300 ring-offset-1"
                  : ""
              }`}
              style={{
                background:
                  value === 0
                    ? "#e2e8f0"
                    : `rgba(16, 185, 129, ${opacities[level]})`,
                animationDelay: `${i * 18}ms`,
              }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
        Less

        {opacities.map((opacity, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-sm"
            style={{
              background:
                opacity === 0 ? "#e2e8f0" : `rgba(16, 185, 129, ${opacity})`,
            }}
          />
        ))}

        More
      </div>
    </div>
  );
}