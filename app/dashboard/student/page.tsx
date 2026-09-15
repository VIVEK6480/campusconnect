"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import StudentLayout from "@/components/student/StudentLayout";

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bell,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Sparkles,
  Loader2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

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

function getArrayFromResponse<T>(
  data: unknown,
  keys: string[]
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object"
  ) {
    const object = data as Record<string, unknown>;

    for (const key of keys) {
      if (Array.isArray(object[key])) {
        return object[key] as T[];
      }
    }

    if (
      object.data &&
      typeof object.data === "object"
    ) {
      const nested =
        object.data as Record<string, unknown>;

      for (const key of keys) {
        if (Array.isArray(nested[key])) {
          return nested[key] as T[];
        }
      }
    }
  }

  return [];
}

async function safeFetch(
  url: string
): Promise<unknown | null> {
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

function getUserQuery(
  student: StudentUser
): string {
  const params = new URLSearchParams();

  if (student.id !== undefined) {
    params.set(
      "studentId",
      String(student.id)
    );
  }

  if (student.email) {
    params.set(
      "email",
      student.email
    );
  }

  if (student.campusUserId) {
    params.set(
      "campusUserId",
      student.campusUserId
    );
  }

  const value = params.toString();

  return value ? `?${value}` : "";
}

function getEventDate(
  event: EventItem
): Date | null {
  const value =
    event.startDate ||
    event.eventDate ||
    event.date;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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
  event: EventItem
): string {
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

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function isNotificationUnread(
  notification: NotificationItem
): boolean {
  if (
    typeof notification.read === "boolean"
  ) {
    return !notification.read;
  }

  if (
    typeof notification.isRead ===
    "boolean"
  ) {
    return !notification.isRead;
  }

  return true;
}

export default function StudentDashboard() {
  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [data, setData] =
    useState<DashboardData>({
      myClubs: [],
      events: [],
      activities: [],
      notifications: [],
    });

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const storedStudent =
          getStoredStudent();

        const query =
          getUserQuery(
            storedStudent
          );

        const membershipResponses =
          await Promise.all([
            safeFetch(
              `/api/memberships${query}`
            ),
            safeFetch(
              `/api/membership${query}`
            ),
            safeFetch(
              `/api/clubs/memberships${query}`
            ),
          ]);

        let memberships: unknown[] = [];

        for (
          const response of membershipResponses
        ) {
          const values =
            getArrayFromResponse<
              unknown
            >(
              response,
              [
                "memberships",
                "data",
                "results",
              ]
            );

          if (values.length > 0) {
            memberships = values;
            break;
          }
        }

        const clubsResponse =
          await safeFetch(
            `/api/clubs${query}`
          );

        const allClubs =
          getArrayFromResponse<Club>(
            clubsResponse,
            [
              "clubs",
              "data",
              "results",
            ]
          );

        let myClubs: Club[] = [];

        if (memberships.length > 0) {
          myClubs =
            memberships
              .map((membership) => {
                if (
                  !membership ||
                  typeof membership !==
                    "object"
                ) {
                  return null;
                }

                const item =
                  membership as Record<
                    string,
                    unknown
                  >;

                const nestedClub =
                  item.club;

                if (
                  nestedClub &&
                  typeof nestedClub ===
                    "object"
                ) {
                  return nestedClub as Club;
                }

                const clubId =
                  item.clubId ??
                  item.club_id;

                if (
                  clubId !== undefined
                ) {
                  return (
                    allClubs.find(
                      (club) =>
                        String(
                          club.id
                        ) ===
                        String(
                          clubId
                        )
                    ) || null
                  );
                }

                return null;
              })
              .filter(
                (
                  club
                ): club is Club =>
                  club !== null
              );
        }

        const uniqueClubMap =
          new Map<
            string,
            Club
          >();

        for (const club of myClubs) {
          uniqueClubMap.set(
            String(club.id),
            club
          );
        }

        myClubs = Array.from(
          uniqueClubMap.values()
        );

        const eventsResponse =
          await safeFetch(
            "/api/events"
          );

        const allEvents =
          getArrayFromResponse<EventItem>(
            eventsResponse,
            [
              "events",
              "data",
              "results",
            ]
          );

        const now =
          new Date();

        const upcomingEvents =
          allEvents
            .filter((event) => {
              const eventDate =
                getEventDate(event);

              if (!eventDate) {
                return true;
              }

              return (
                eventDate.getTime() >=
                now.getTime()
              );
            })
            .sort((a, b) => {
              const dateA =
                getEventDate(a);

              const dateB =
                getEventDate(b);

              if (!dateA && !dateB) {
                return 0;
              }

              if (!dateA) {
                return 1;
              }

              if (!dateB) {
                return -1;
              }

              return (
                dateA.getTime() -
                dateB.getTime()
              );
            });

        const activityResponses =
          await Promise.all([
            safeFetch(
              `/api/activities${query}`
            ),
            safeFetch(
              `/api/activity${query}`
            ),
          ]);

        let activities: ActivityItemData[] =
          [];

        for (
          const response of activityResponses
        ) {
          const values =
            getArrayFromResponse<ActivityItemData>(
              response,
              [
                "activities",
                "data",
                "results",
              ]
            );

          if (values.length > 0) {
            activities =
              values;
            break;
          }
        }

        const notificationsResponse =
          await safeFetch(
            "/api/notifications"
          );

        const notifications =
          getArrayFromResponse<NotificationItem>(
            notificationsResponse,
            [
              "notifications",
              "data",
              "results",
            ]
          );

        setData({
          myClubs,
          events:
            upcomingEvents,
          activities,
          notifications,
        });
      } catch (err) {
        console.error(
          "DASHBOARD LOAD ERROR:",
          err
        );

        setError(
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadDashboard();
      }, 0);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [loadDashboard]);

  const myClubsCount =
    data.myClubs.length;

  const upcomingEventsCount =
    data.events.length;

  const activitiesCount =
    data.activities.length;

  const unreadNotifications =
    useMemo(() => {
      return data.notifications.filter(
        isNotificationUnread
      ).length;
    }, [data.notifications]);

  const dashboardEvents =
    useMemo(() => {
      return data.events.slice(
        0,
        3
      );
    }, [data.events]);

  const recentActivity =
    useMemo(() => {
      const items: Array<{
        type:
          | "club"
          | "event"
          | "activity"
          | "notification";
        title: string;
        description: string;
        date?: string | null;
      }> = [];

      for (
        const club of data.myClubs.slice(
          0,
          2
        )
      ) {
        items.push({
          type: "club",
          title:
            club.name,
          description:
            "You joined this campus club.",
          date:
            club.createdAt,
        });
      }

      for (
        const event of data.events.slice(
          0,
          2
        )
      ) {
        items.push({
          type: "event",
          title:
            event.title,
          description:
            event.location ||
            event.venue ||
            event.club?.name ||
            "Campus event",
          date:
            event.startDate ||
            event.eventDate ||
            event.date ||
            event.createdAt,
        });
      }

      for (
        const activity of data.activities.slice(
          0,
          2
        )
      ) {
        items.push({
          type: "activity",
          title:
            activity.title ||
            activity.name ||
            "Campus activity",
          description:
            activity.description ||
            activity.status ||
            "Student activity",
          date:
            activity.completedAt ||
            activity.createdAt,
        });
      }

      for (
        const notification of data.notifications.slice(
          0,
          2
        )
      ) {
        items.push({
          type: "notification",
          title:
            notification.title ||
            "Notification",
          description:
            notification.message ||
            notification.description ||
            "Campus update",
          date:
            notification.createdAt,
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

          return (
            new Date(
              b.date
            ).getTime() -
            new Date(
              a.date
            ).getTime()
          );
        })
        .slice(0, 5);
    }, [
      data.myClubs,
      data.events,
      data.activities,
      data.notifications,
    ]);

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f5f8f7] text-slate-900">
        <main className="w-full min-w-0">
          <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">
            {/* =================================================
                HERO
            ================================================== */}

            <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b] p-7 text-white shadow-xl shadow-emerald-900/10 sm:p-9">
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

              <div className="pointer-events-none absolute right-[35%] top-10 h-24 w-24 rounded-full border border-emerald-300/10" />

              <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <Sparkles size={13} />

                    Welcome back
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Your campus.

                    <span className="block text-emerald-300">
                      Your experience.
                    </span>
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                    Discover clubs, explore events,
                    participate in activities and stay
                    connected with everything happening
                    around your campus.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadDashboard(true)}
                  disabled={refreshing}
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={17}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() =>
                    void loadDashboard(
                      true
                    )
                  }
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw
                    size={14}
                  />
                  Retry
                </button>
              </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================== */}

            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                icon={
                  <Building2
                    size={20}
                  />
                }
                title="My Clubs"
                value={
                  loading
                    ? "..."
                    : String(
                        myClubsCount
                      )
                }
                description="Clubs joined"
              />

              <StatCard
                icon={
                  <CalendarDays
                    size={20}
                  />
                }
                title="Upcoming Events"
                value={
                  loading
                    ? "..."
                    : String(
                        upcomingEventsCount
                      )
                }
                description="Events available"
              />

              <StatCard
                icon={
                  <CheckCircle2
                    size={20}
                  />
                }
                title="Activities"
                value={
                  loading
                    ? "..."
                    : String(
                        activitiesCount
                      )
                }
                description="Activities recorded"
              />

              <StatCard
                icon={
                  <Bell
                    size={20}
                  />
                }
                title="Notifications"
                value={
                  loading
                    ? "..."
                    : String(
                        unreadNotifications
                      )
                }
                description="Unread updates"
              />

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

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                <FeatureCard
                  href="/clubs"
                  icon={
                    <Building2
                      size={22}
                    />
                  }
                  title="Clubs"
                  description="Find communities and join clubs that match your interests."
                />

                <FeatureCard
                  href="/events"
                  icon={
                    <CalendarDays
                      size={22}
                    />
                  }
                  title="Events"
                  description="Discover workshops, competitions and campus events."
                />

                <FeatureCard
                  href="/activities"
                  icon={
                    <BookOpen
                      size={22}
                    />
                  }
                  title="Activities"
                  description="Track your participation and campus activities."
                />

                <FeatureCard
                  href="/dashboard/student/attendance"
                  icon={
                    <ClipboardCheck
                      size={22}
                    />
                  }
                  title="Attendance"
                  description="Check your subject-wise academic attendance and attendance history."
                />

                <FeatureCard
                  href="/notifications"
                  icon={
                    <Bell
                      size={22}
                    />
                  }
                  title="Notifications"
                  description="Stay updated with important campus announcements."
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

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

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
                    <ChevronRight
                      size={16}
                    />
                  </Link>

                </div>

                {loading ? (

                  <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">

                    <div className="flex flex-col items-center gap-3 text-slate-400">

                      <Loader2
                        size={30}
                        className="animate-spin text-emerald-500"
                      />

                      <p className="text-sm">
                        Loading events...
                      </p>

                    </div>

                  </div>

                ) : dashboardEvents.length >
                  0 ? (

                  <div className="space-y-3">

                    {dashboardEvents.map(
                      (event) => {
                        const eventDate =
                          getEventDate(
                            event
                          );

                        return (
                          <Link
                            href="/events"
                            key={
                              String(
                                event.id
                              )
                            }
                            className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-emerald-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center"
                          >

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                              <CalendarDays
                                size={21}
                              />
                            </div>

                            <div className="min-w-0 flex-1">

                              <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-emerald-600">
                                {
                                  event.title
                                }
                              </h3>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {event.location ||
                                  event.venue ||
                                  event.club
                                    ?.name ||
                                  "Campus event"}
                              </p>

                            </div>

                            <div className="shrink-0 text-left sm:text-right">

                              <p className="text-xs font-semibold text-emerald-600">
                                {eventDate
                                  ? formatDate(
                                      eventDate.toISOString()
                                    )
                                  : "Upcoming"}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                {formatTime(
                                  event
                                )}
                              </p>

                            </div>

                          </Link>
                        );
                      }
                    )}

                  </div>

                ) : (

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">

                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                      <CalendarDays
                        size={25}
                      />
                    </div>

                    <h3 className="font-semibold text-slate-800">
                      No upcoming events
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                      New campus events will appear here when they are available.
                    </p>

                    <Link
                      href="/events"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      Browse Events
                      <ArrowRight
                        size={16}
                      />
                    </Link>

                  </div>

                )}

              </div>

              {/* =================================================
                  RECENT ACTIVITY
              ================================================== */}

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6">

                  <h2 className="text-lg font-bold text-slate-900">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest campus activity.
                  </p>

                </div>

                {loading ? (

                  <div className="flex min-h-[200px] items-center justify-center">

                    <Loader2
                      size={28}
                      className="animate-spin text-emerald-500"
                    />

                  </div>

                ) : recentActivity.length >
                  0 ? (

                  <div className="space-y-5">

                    {recentActivity.map(
                      (
                        item,
                        index
                      ) => {
                        let icon =
                          <Sparkles
                            size={17}
                          />;

                        if (
                          item.type ===
                          "club"
                        ) {
                          icon = (
                            <Building2
                              size={
                                17
                              }
                            />
                          );
                        }

                        if (
                          item.type ===
                          "event"
                        ) {
                          icon = (
                            <CalendarDays
                              size={
                                17
                              }
                            />
                          );
                        }

                        if (
                          item.type ===
                          "activity"
                        ) {
                          icon = (
                            <BookOpen
                              size={
                                17
                              }
                            />
                          );
                        }

                        if (
                          item.type ===
                          "notification"
                        ) {
                          icon = (
                            <Bell
                              size={
                                17
                              }
                            />
                          );
                        }

                        return (
                          <ActivityItem
                            key={`${item.type}-${index}`}
                            icon={
                              icon
                            }
                            title={
                              item.title
                            }
                            description={
                              item.description
                            }
                            date={
                              item.date
                            }
                          />
                        );
                      }
                    )}

                  </div>

                ) : (

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">

                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                      <Sparkles
                        size={21}
                      />
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      No recent activity
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your latest club, event, activity and notification updates will appear here.
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

                <p>
                  © 2026 CampusConnect. Smart Campus Management.
                </p>

                <p>
                  Student Portal
                </p>

              </div>

            </footer>

          </section>
        </main>
      </div>
    </StudentLayout>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
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

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-white">
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   FEATURE CARD
============================================================ */

function FeatureCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
    >

      <div className="mb-5 flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-white">
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500"
        />

      </div>

      <h3 className="text-base font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </Link>
  );
}

/* ============================================================
   RECENT ACTIVITY ITEM
============================================================ */

function ActivityItem({
  icon,
  title,
  description,
  date,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  date?: string | null;
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          {description}
        </p>

        {date && (
          <p className="mt-1 text-[10px] text-slate-400">
            {formatDate(date)}
          </p>
        )}

      </div>

      <Clock3
        size={14}
        className="mt-1 shrink-0 text-slate-300"
      />

    </div>
  );
}