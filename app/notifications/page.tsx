"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  GraduationCap,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

type ApiResponse = {
  success: boolean;
  count?: number;
  notifications?: Notification[];
  message?: string;
};

export default function NotificationsPage() {
  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState<"all" | "unread">("all");

  const [readNotifications, setReadNotifications] =
    useState<string[]>([]);

  const [refreshing, setRefreshing] =
    useState(false);

  /* =========================================================
     LOAD NOTIFICATIONS
  ========================================================== */

  const loadNotifications = useCallback(
    async () => {
      try {
        setError("");

        const response = await fetch(
          "/api/notifications",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to fetch notifications"
          );
        }

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );
      } catch (err) {
        console.error(
          "LOAD NOTIFICATIONS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load notifications."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =========================================================
     INITIAL LOAD

     Delayed callback avoids the React
     setState-in-effect lint error while
     keeping the same API loading behaviour.
  ========================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadNotifications();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadNotifications]);

  /* =========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = () => {
    setRefreshing(true);
    void loadNotifications();
  };

  /* =========================================================
     MARK AS READ
  ========================================================== */

  const markAsRead = (
    notificationId: string
  ) => {
    setReadNotifications((current) => {
      if (
        current.includes(notificationId)
      ) {
        return current;
      }

      return [
        ...current,
        notificationId,
      ];
    });
  };

  /* =========================================================
     MARK ALL AS READ
  ========================================================== */

  const markAllAsRead = () => {
    setReadNotifications(
      notifications.map(
        (notification) =>
          notification.id
      )
    );
  };

  /* =========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = async () => {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    try {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );
    } catch (error) {
      console.error(
        "Local storage error:",
        error
      );
    }

    window.location.href =
      "/auth/login";
  };

  /* =========================================================
     COUNTS
  ========================================================== */

  const unreadCount =
    useMemo(() => {
      return notifications.filter(
        (notification) =>
          !readNotifications.includes(
            notification.id
          )
      ).length;
    }, [
      notifications,
      readNotifications,
    ]);

  const readCount =
    notifications.length -
    unreadCount;

  /* =========================================================
     FILTER + SEARCH
  ========================================================== */

  const filteredNotifications =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return notifications.filter(
        (notification) => {
          const isUnread =
            !readNotifications.includes(
              notification.id
            );

          const matchesFilter =
            activeFilter === "all" ||
            isUnread;

          if (!matchesFilter) {
            return false;
          }

          if (!searchValue) {
            return true;
          }

          return (
            notification.title
              .toLowerCase()
              .includes(searchValue) ||
            notification.message
              .toLowerCase()
              .includes(searchValue)
          );
        }
      );
    }, [
      notifications,
      readNotifications,
      search,
      activeFilter,
    ]);

  /* =========================================================
     DATE FORMAT
  ========================================================== */

  const formatDate = (
    value: string
  ) => {
    try {
      return new Date(
        value
      ).toLocaleDateString(
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
  };

  const formatTime = (
    value: string
  ) => {
    try {
      return new Date(
        value
      ).toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

      {/* =====================================================
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
              !mobileMenu
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


      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#071c16] text-white shadow-2xl transition-transform duration-300 ${
          mobileMenu
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* =================================================
            LOGO
        ================================================== */}

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


        {/* =================================================
            NAVIGATION
        ================================================== */}

        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Main Menu
          </p>

          <nav className="space-y-1">

            <SidebarItem
              href="/dashboard/student"
              icon={
                <DashboardIcon />
              }
              label="Dashboard"
              onNavigate={() =>
                setMobileMenu(false)
              }
            />

            <SidebarItem
              href="/clubs"
              icon={
                <ClubIcon />
              }
              label="Clubs"
              onNavigate={() =>
                setMobileMenu(false)
              }
            />

            <SidebarItem
              href="/events"
              icon={
                <CalendarIcon />
              }
              label="Events"
              onNavigate={() =>
                setMobileMenu(false)
              }
            />

            <SidebarItem
              href="/activities"
              icon={
                <ActivityIcon />
              }
              label="Activities"
              onNavigate={() =>
                setMobileMenu(false)
              }
            />

            <SidebarItem
              href="/notifications"
              icon={
                <Bell size={18} />
              }
              label="Notifications"
              active
              onNavigate={() =>
                setMobileMenu(false)
              }
            />

          </nav>


          {/* =================================================
              CAMPUS
          ================================================== */}

          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/40">
            Campus
          </p>

          <nav className="space-y-1">

            <SidebarItem
              href="/clubs"
              icon={
                <UsersIcon />
              }
              label="My Clubs"
              onNavigate={() =>
                setMobileMenu(false)
              }
            />

            <SidebarItem
              href="/events"
              icon={
                <CalendarIcon />
              }
              label="My Events"
              onNavigate={() =>
                setMobileMenu(false)
              }
            />

          </nav>

        </div>


        {/* =================================================
            STUDENT PROFILE
        ================================================== */}

        <div className="border-t border-white/10 p-4">

          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 font-bold">
              S
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-semibold text-white">
                Student
              </p>

              <p className="truncate text-xs text-slate-400">
                CampusConnect User
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >

            <LogOut
              size={18}
            />

            Logout

          </button>

        </div>

      </aside>


      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileMenu && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileMenu(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="min-h-screen w-full lg:ml-[270px] lg:w-[calc(100%-270px)]">

        {/* =================================================
            DESKTOP TOPBAR
        ================================================== */}

        <header className="sticky top-0 z-30 hidden h-[82px] items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur lg:flex xl:px-8">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Student Portal
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Stay updated with everything happening around your campus.
            </p>

          </div>

          <div className="flex items-center gap-5">

            <div className="relative">

              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative block rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600"
              >

                <Bell
                  size={19}
                />

                {unreadCount >
                  0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}

              </Link>

            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                S
              </div>

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Student
                </p>

                <p className="text-xs text-slate-500">
                  Campus Member
                </p>

              </div>

            </div>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================== */}

        <section className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-9">

          {/* =================================================
              BACK BUTTON
          ================================================== */}

          <Link
            href="/dashboard/student"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
          >

            <ArrowLeft
              size={16}
            />

            Back to Dashboard

          </Link>


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

                  <BellRing
                    size={13}
                  />

                  Campus Updates

                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">

                  Stay connected.

                  <span className="block text-emerald-300">
                    Stay informed.
                  </span>

                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  View important campus announcements, updates and messages in one place so you never miss something important.
                </p>

              </div>


              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">

                  <Bell
                    size={22}
                  />

                </div>

                <div>

                  <p className="text-2xl font-bold">
                    {notifications.length}
                  </p>

                  <p className="text-xs text-slate-400">
                    Notifications

                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              STATS
          ================================================== */}

          <div className="mb-7 grid gap-4 sm:grid-cols-3">

            <NotificationStat
              icon={
                <Bell
                  size={20}
                />
              }
              title="Total Notifications"
              value={notifications.length.toString()}
              description="All campus updates"
            />

            <NotificationStat
              icon={
                <BellRing
                  size={20}
                />
              }
              title="Unread"
              value={unreadCount.toString()}
              description="Updates waiting for you"
            />

            <NotificationStat
              icon={
                <CheckCheck
                  size={20}
                />
              }
              title="Read"
              value={readCount.toString()}
              description="Notifications already viewed"
            />

          </div>


          {/* =================================================
              SEARCH + FILTER
          ================================================== */}

          <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Notifications
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Your latest updates
                </h2>

              </div>


              <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">

                <div className="relative w-full xl:w-[360px]">

                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search notifications..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />

                </div>


                <button
                  type="button"
                  onClick={
                    handleRefresh
                  }
                  disabled={
                    refreshing
                  }
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <RefreshCw
                    size={17}
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


            <div className="mt-5 flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  setActiveFilter(
                    "all"
                  )
                }
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeFilter ===
                  "all"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
                }`}
              >

                All

                <span className="ml-1.5">
                  {notifications.length}
                </span>

              </button>


              <button
                type="button"
                onClick={() =>
                  setActiveFilter(
                    "unread"
                  )
                }
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeFilter ===
                  "unread"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
                }`}
              >

                Unread

                <span className="ml-1.5">
                  {unreadCount}
                </span>

              </button>


              {unreadCount >
                0 && (
                <button
                  type="button"
                  onClick={
                    markAllAsRead
                  }
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                >

                  <CheckCheck
                    size={15}
                  />

                  Mark all as read

                </button>
              )}

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">

                  <Bell
                    size={18}
                  />

                </div>

                <div>

                  <p className="text-sm font-semibold text-red-700">
                    Unable to load notifications
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-600">
                    {error}
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={
                  handleRefresh
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >

                <RefreshCw
                  size={16}
                />

                Try Again

              </button>

            </div>
          )}


          {/* =================================================
              NOTIFICATION LIST HEADER
          ================================================== */}

          <div className="mb-4 flex items-end justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                Updates
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Campus Notifications
              </h2>

            </div>

            <p className="text-sm text-slate-400">
              {filteredNotifications.length}{" "}
              {filteredNotifications.length ===
              1
                ? "notification"
                : "notifications"}
            </p>

          </div>


          {/* =================================================
              LOADING
          ================================================== */}

          {loading ? (

            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">

                <RefreshCw
                  size={25}
                  className="animate-spin"
                />

              </div>

              <h3 className="font-semibold text-slate-800">
                Loading notifications...
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Please wait while we fetch your latest campus updates.
              </p>

            </div>

          ) : filteredNotifications.length >
            0 ? (

            <div className="space-y-4">

              {filteredNotifications.map(
                (
                  notification
                ) => {

                  const isRead =
                    readNotifications.includes(
                      notification.id
                    );

                  return (
                    <NotificationCard
                      key={
                        notification.id
                      }
                      notification={
                        notification
                      }
                      isRead={
                        isRead
                      }
                      onRead={() =>
                        markAsRead(
                          notification.id
                        )
                      }
                      formatDate={
                        formatDate
                      }
                      formatTime={
                        formatTime
                      }
                    />
                  );
                }
              )}

            </div>

          ) : (

            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">

                <Bell
                  size={25}
                />

              </div>

              <h3 className="font-semibold text-slate-800">
                {notifications.length ===
                0
                  ? "No notifications yet"
                  : activeFilter ===
                      "unread"
                    ? "No unread notifications"
                    : "No notifications found"}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">

                {notifications.length ===
                0
                  ? "New campus announcements and updates will appear here when they are available."
                  : activeFilter ===
                      "unread"
                    ? "You have already checked all your notifications."
                    : "Try searching with a different keyword."}

              </p>


              {notifications.length >
                0 &&
                activeFilter !==
                  "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter(
                        "all"
                      );
                      setSearch(
                        ""
                      );
                    }}
                    className="mt-5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    View All Notifications
                  </button>
                )}

            </div>

          )}


          {/* =================================================
              INFORMATION SECTION
          ================================================== */}

          <div className="mt-7 grid gap-5 lg:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

                  <Sparkles
                    size={21}
                  />

                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Stay informed
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Check your notifications regularly to stay updated with important campus announcements, activities and events.
                  </p>

                </div>

              </div>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

                  <CheckCheck
                    size={21}
                  />

                </div>

                <div>

                  <h3 className="font-bold text-slate-900">
                    Manage your updates
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Mark notifications as read after checking them so you can easily identify new campus updates.
                  </p>

                </div>

              </div>

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
  icon: ReactNode;
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
   NOTIFICATION CARD
============================================================ */

function NotificationCard({
  notification,
  isRead,
  onRead,
  formatDate,
  formatTime,
}: {
  notification: Notification;
  isRead: boolean;
  onRead: () => void;
  formatDate: (
    value: string
  ) => string;
  formatTime: (
    value: string
  ) => string;
}) {
  return (
    <div
      className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        isRead
          ? "border-slate-200"
          : "border-emerald-200 shadow-emerald-500/5"
      }`}
    >

      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start">

        {/* ICON */}

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            isRead
              ? "bg-slate-100 text-slate-500"
              : "bg-emerald-50 text-emerald-500"
          }`}
        >

          {isRead ? (
            <Bell
              size={21}
            />
          ) : (
            <BellRing
              size={21}
            />
          )}

        </div>


        {/* CONTENT */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="text-base font-bold text-slate-900">
                {notification.title}
              </h3>

              {!isRead && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  New

                </span>
              )}

            </div>

          </div>


          <p className="mt-3 text-sm leading-6 text-slate-500">
            {notification.message}
          </p>


          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">

            <span className="inline-flex items-center gap-1.5">

              <Clock3
                size={14}
              />

              {formatDate(
                notification.createdAt
              )}

            </span>

            <span>
              {formatTime(
                notification.createdAt
              )}
            </span>

          </div>

        </div>


        {/* ACTION */}

        <div className="shrink-0 lg:pt-1">

          {!isRead ? (

            <button
              type="button"
              onClick={onRead}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 sm:w-auto"
            >

              <Check
                size={15}
              />

              Mark as read

            </button>

          ) : (

            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-400">

              <CheckCheck
                size={15}
              />

              Read

            </div>

          )}

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   NOTIFICATION STAT
============================================================ */

function NotificationStat({
  icon,
  title,
  value,
  description,
}: {
  icon: ReactNode;
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
   ICON HELPERS
============================================================ */

function DashboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
    </svg>
  );
}


function ClubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-5h6v5" />
      <path d="M9 9h.01" />
      <path d="M12 9h.01" />
      <path d="M15 9h.01" />
    </svg>
  );
}


function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
      />

      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}


function ActivityIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4" />
      <path d="M12 16V8" />
      <path d="M16 16v-6" />
    </svg>
  );
}


function UsersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />

      <circle
        cx="9"
        cy="7"
        r="4"
      />

      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />

      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}