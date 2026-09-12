"use client";

import {
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  Megaphone,
  UserRound,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  FormEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type NotificationAudience =
  | "ALL"
  | "FACULTY";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  notifications?: NotificationItem[];
  notification?: NotificationItem;
  count?: number;
};

type CursorEffect = {
  id: string;
  x: number;
  y: number;
};

const EMPTY_FORM = {
  title: "",
  message: "",
  audience:
    "ALL" as NotificationAudience,
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ======================================================
     CURSOR EFFECT
  ====================================================== */

  const [cursorEffect, setCursorEffect] =
    useState<CursorEffect | null>(null);

  /* ======================================================
     LOAD NOTIFICATIONS
  ====================================================== */

  const loadNotifications =
    useCallback(async () => {
      try {
        setError("");

        const response = await fetch(
          "/api/admin/notifications",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as ApiResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load notifications.",
          );
        }

        setNotifications(
          Array.isArray(
            data.notifications,
          )
            ? data.notifications
            : [],
        );
      } catch (loadError) {
        console.error(
          "ADMIN NOTIFICATIONS LOAD ERROR:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  /* ======================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadNotifications();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadNotifications]);

  /* ======================================================
     REFRESH
  ====================================================== */

  function handleRefresh() {
    setRefreshing(true);
    void loadNotifications();
  }

  /* ======================================================
     FORM CHANGE
  ====================================================== */

  function handleFormChange(
    field:
      | "title"
      | "message"
      | "audience",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  /* ======================================================
     SEND NOTIFICATION
  ====================================================== */

  async function handleSendNotification(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (sending) {
      return;
    }

    setError("");
    setSuccess("");

    const title =
      form.title.trim();

    const message =
      form.message.trim();

    const audience =
      form.audience;

    if (!title) {
      setError(
        "Notification title is required.",
      );
      return;
    }

    if (!message) {
      setError(
        "Notification message is required.",
      );
      return;
    }

    try {
      setSending(true);

      const response =
        await fetch(
          "/api/admin/notifications",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title,
              message,
              audience,
            }),
          },
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to broadcast notification.",
        );
      }

      setSuccess(
        audience === "FACULTY"
          ? "Notification sent successfully to the Faculty portal only."
          : "Notification sent successfully to both Student and Faculty portals.",
      );

      setForm(EMPTY_FORM);

      if (data.notification) {
        setNotifications(
          (current) => [
            data.notification as NotificationItem,
            ...current,
          ],
        );
      } else {
        await loadNotifications();
      }
    } catch (sendError) {
      console.error(
        "ADMIN SEND NOTIFICATION ERROR:",
        sendError,
      );

      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to broadcast notification.",
      );
    } finally {
      setSending(false);
    }
  }

  /* ======================================================
     DELETE NOTIFICATION
  ====================================================== */

  async function handleDeleteNotification(
    notification: NotificationItem,
  ) {
    if (deletingId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${notification.title}"?\n\nThis notification will be removed from the selected audience feed.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        notification.id,
      );

      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/notifications?id=${encodeURIComponent(
            notification.id,
          )}`,
          {
            method: "DELETE",
            credentials: "include",
          },
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete notification.",
        );
      }

      setNotifications(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              notification.id,
          ),
      );

      setSuccess(
        "Notification deleted successfully.",
      );
    } catch (deleteError) {
      console.error(
        "ADMIN DELETE NOTIFICATION ERROR:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete notification.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* ======================================================
     FILTER
  ====================================================== */

  const filteredNotifications =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return notifications;
      }

      return notifications.filter(
        (notification) =>
          notification.title
            .toLowerCase()
            .includes(value) ||
          notification.message
            .toLowerCase()
            .includes(value),
      );
    }, [notifications, search]);

  /* ======================================================
     DATE
  ====================================================== */

  const formatDate = (
    value: string,
  ) => {
    try {
      return new Date(
        value,
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );
    } catch {
      return value;
    }
  };

  /* ======================================================
     TIME
  ====================================================== */

  const formatTime = (
    value: string,
  ) => {
    try {
      return new Date(
        value,
      ).toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      );
    } catch {
      return "";
    }
  };

  /* ======================================================
     CURSOR POSITION
  ====================================================== */

  function handleCursorMove(
    event: MouseEvent<HTMLElement>,
    id: string,
  ) {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const x =
      ((event.clientX -
        rect.left) /
        rect.width -
        0.5) *
      2;

    const y =
      ((event.clientY -
        rect.top) /
        rect.height -
        0.5) *
      2;

    setCursorEffect({
      id,
      x,
      y,
    });
  }

  /* ======================================================
     SUBTLE CURSOR STYLE
  ====================================================== */

  function getCursorStyle(
    id: string,
  ) {
    const effect =
      cursorEffect?.id === id
        ? cursorEffect
        : null;

    if (!effect) {
      return undefined;
    }

    return {
      transform: `perspective(1100px) translate3d(${effect.x * 0.35}px, ${effect.y * 0.35 - 1}px, 0) rotateX(${effect.y * -0.15}deg) rotateY(${effect.x * 0.15}deg)`,
      boxShadow:
        "0 10px 24px rgba(30,91,128,0.08), 0 0 0 1px rgba(79,70,229,0.04)",
    };
  }

  const totalNotifications =
    notifications.length;

  return (
    <main className="min-h-screen w-full bg-[#f7fafc] px-4 py-6 sm:px-6 lg:px-8">

      <div className="w-full max-w-none">

        {/* ==================================================
            EFFECT STYLES
        ================================================== */}

        <style jsx>{`

          /* ==================================================
             MINI BOX EFFECT
          ================================================== */

          .cc-mini-box {
            position: relative;
            overflow: hidden;
            isolation: isolate;

            transition:
              transform 180ms ease,
              border-color 180ms ease,
              background 180ms ease,
              color 180ms ease,
              box-shadow 180ms ease;
          }

          .cc-mini-box::before {
            content: "";
            position: absolute;
            inset: -45%;
            border-radius: inherit;
            pointer-events: none;
            z-index: -1;

            opacity: 0;

            background:
              radial-gradient(
                circle at 50% 20%,
                rgba(255,255,255,.24) 0%,
                rgba(70,105,226,.20) 30%,
                transparent 68%
              );

            transition:
              opacity 180ms ease;
          }

          .cc-mini-box::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            z-index: -1;

            opacity: 0;

            box-shadow:
              inset 0 0 0 1px
              rgba(255,255,255,.22);

            transition:
              opacity 180ms ease;
          }

          .cc-mini-box:hover,
          .cc-mini-box:focus-within {
            transform:
              translate3d(0, -3px, 0)
              scale(1.035);

            border-color:
              rgba(99,102,241,.72) !important;

            background:
              linear-gradient(
                112deg,
                #202b63 0%,
                #2d4fae 52%,
                #4669e2 100%
              ) !important;

            color: #ffffff !important;

            box-shadow:
              0 8px 18px
                rgba(15,23,42,.12),
              0 0 0 1px
                rgba(79,70,229,.14),
              0 0 16px
                rgba(79,70,229,.24),
              0 0 28px
                rgba(59,130,246,.12);

            z-index: 20;
          }

          .cc-mini-box:hover::before,
          .cc-mini-box:hover::after,
          .cc-mini-box:focus-within::before,
          .cc-mini-box:focus-within::after {
            opacity: 1;
          }

          /* ==================================================
             STATIC CARD
          ================================================== */

          .cc-static-card {
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

          .cc-static-card::before {
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
                rgba(79,70,229,.035) 0%,
                rgba(45,79,174,.065) 52%,
                rgba(70,105,226,.045) 100%
              );

            box-shadow:
              inset 0 0 0 1px
              rgba(79,70,229,.07);

            transition:
              opacity 220ms ease;
          }

          .cc-static-card > * {
            position: relative;
            z-index: 1;
          }

          .cc-static-card:hover,
          .cc-static-card:focus-within {
            transform:
              translate3d(0, -4px, 0)
              scale(1.006);

            border-color:
              rgba(79,70,229,.36) !important;

            background: #fbfcff;

            box-shadow:
              0 14px 30px
                rgba(15,23,42,.09),
              0 0 0 1px
                rgba(79,70,229,.09),
              0 0 24px
                rgba(79,70,229,.18),
              0 0 48px
                rgba(59,130,246,.10);

            z-index: 10;
          }

          .cc-static-card:hover::before,
          .cc-static-card:focus-within::before {
            opacity: 1;
          }

          /* ==================================================
             NOTIFICATION CARD
             THIN LIFT + UI EFFECT
          ================================================== */

          .cc-notification-card {
            position: relative;
            overflow: hidden;

            border: 1px solid #e2e8f0;

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

          .cc-notification-card::before {
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
                rgba(79,70,229,.025) 0%,
                rgba(45,79,174,.045) 52%,
                rgba(70,105,226,.025) 100%
              );

            box-shadow:
              inset 0 0 0 1px
              rgba(79,70,229,.08);

            transition:
              opacity 220ms ease;
          }

          .cc-notification-card::after {
            content: "";
            position: absolute;
            left: 8%;
            right: 8%;
            top: 0;

            height: 1px;

            pointer-events: none;
            z-index: 2;

            opacity: 0;

            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(99,102,241,.55),
                transparent
              );

            transition:
              opacity 220ms ease;
          }

          .cc-notification-card > * {
            position: relative;
            z-index: 1;
          }

          .cc-notification-card:hover,
          .cc-notification-card:focus-within {
            transform:
              translate3d(0, -3px, 0)
              scale(1.002);

            border-color:
              rgba(79,70,229,.28) !important;

            background:
              #fbfcff;

            box-shadow:
              0 10px 24px
                rgba(15,23,42,.07),
              0 0 0 1px
                rgba(79,70,229,.05),
              0 0 18px
                rgba(79,70,229,.08);

            z-index: 5;
          }

          .cc-notification-card:hover::before,
          .cc-notification-card:focus-within::before {
            opacity: 1;
          }

          .cc-notification-card:hover::after,
          .cc-notification-card:focus-within::after {
            opacity: 1;
          }

          /* ==================================================
             SEARCH
          ================================================== */

          .cc-search {
            transition:
              transform 180ms ease,
              border-color 180ms ease,
              box-shadow 180ms ease,
              background 180ms ease;
          }

          .cc-search:focus {
            transform:
              translateY(-1px);

            box-shadow:
              0 8px 20px
                rgba(79,70,229,.08),
              0 0 0 3px
                rgba(79,70,229,.08);
          }

          /* ==================================================
             REDUCE MOTION
          ================================================== */

          @media (prefers-reduced-motion: reduce) {

            .cc-mini-box,
            .cc-static-card,
            .cc-notification-card,
            .cc-search {
              transition: none;
            }

            .cc-mini-box:hover,
            .cc-mini-box:focus-within,
            .cc-static-card:hover,
            .cc-static-card:focus-within,
            .cc-notification-card:hover,
            .cc-notification-card:focus-within,
            .cc-search:focus {
              transform: none !important;
            }
          }

        `}</style>

        {/* ==================================================
            ALERTS
        ================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">

            <CheckCheck
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span className="flex-1">
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="rounded-lg p-1 transition hover:bg-emerald-100"
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            <Bell
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error message"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {/* ==================================================
            HERO
        ================================================== */}

        <section
          className="relative mb-7 w-full overflow-hidden rounded-[26px] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#2563eb] px-7 py-8 shadow-lg sm:px-9 sm:py-9"
          onMouseMove={(event) =>
            handleCursorMove(
              event,
              "notification-hero",
            )
          }
          onMouseLeave={() =>
            setCursorEffect(null)
          }
          style={getCursorStyle(
            "notification-hero",
          )}
        >

          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />

          <div className="absolute right-32 top-10 h-28 w-28 rounded-full border border-white/10" />

          <div className="absolute bottom-[-70px] right-[28%] h-44 w-44 rounded-full bg-blue-400/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 backdrop-blur-sm">

                <Sparkles
                  size={16}
                />

                Campus Communication Center

              </div>

              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">

                Keep everyone

                <br />

                <span className="text-blue-200">
                  connected.
                </span>

              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100/80 sm:text-base">
                Send a notification from the Admin Portal and
                choose whether it should appear only for Faculty
                or for both Student and Faculty portals.
              </p>

            </div>

            {/* ==================================================
                TOTAL NOTIFICATIONS
            ================================================== */}

            <div className="flex items-center gap-4">

              <div className="cc-mini-box rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white backdrop-blur-sm lg:min-w-[250px]">

                <div className="flex items-center gap-4">

                  <div className="cc-mini-box flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white text-blue-700">

                    <Bell
                      size={22}
                    />

                  </div>

                  <div>

                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100/70">
                      Total Notifications
                    </p>

                    <p className="mt-1 text-3xl font-black leading-none text-white">
                      {totalNotifications}
                    </p>

                  </div>

                </div>

                <p className="mt-3 text-xs leading-5 text-blue-100/70">
                  Broadcast messages stored in CampusConnect.
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* ==================================================
            COMPOSER
        ================================================== */}

        <section className="mb-8 grid w-full grid-cols-1 items-start gap-6">

          <div className="cc-static-card w-full self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="mb-6 flex items-center gap-3">

              <div className="cc-mini-box flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">

                <Megaphone
                  size={21}
                />

              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Create Notification
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Broadcast important campus updates to the selected audience.
                </p>

              </div>

            </div>

            <form
              onSubmit={
                handleSendNotification
              }
              className="space-y-5"
            >

              {/* TITLE */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Notification Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    handleFormChange(
                      "title",
                      event.target.value,
                    )
                  }
                  maxLength={150}
                  disabled={sending}
                  placeholder="e.g. Important campus update"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />

                <div className="mt-2 text-right text-[11px] text-slate-400">
                  {form.title.length}/150
                </div>

              </div>

              {/* MESSAGE */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Message
                </label>

                <textarea
                  value={form.message}
                  onChange={(event) =>
                    handleFormChange(
                      "message",
                      event.target.value,
                    )
                  }
                  maxLength={2000}
                  rows={6}
                  disabled={sending}
                  placeholder="Write the notification that should appear in the selected portal..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />

                <div className="mt-2 text-right text-[11px] text-slate-400">
                  {form.message.length}/2000
                </div>

              </div>

              {/* AUDIENCE */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Notification Audience
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  {/* ALL */}

                  <button
                    type="button"
                    onClick={() =>
                      handleFormChange(
                        "audience",
                        "ALL",
                      )
                    }
                    disabled={sending}
                    className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      form.audience ===
                      "ALL"
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-white"
                    }`}
                  >

                    <span
                      className={`cc-mini-box flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                        form.audience ===
                        "ALL"
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >

                      <Users
                        size={18}
                      />

                    </span>

                    <span>

                      <span className="block text-sm font-bold">
                        Students + Faculty
                      </span>

                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        Visible in both portals
                      </span>

                    </span>

                  </button>

                  {/* FACULTY */}

                  <button
                    type="button"
                    onClick={() =>
                      handleFormChange(
                        "audience",
                        "FACULTY",
                      )
                    }
                    disabled={sending}
                    className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      form.audience ===
                      "FACULTY"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-white"
                    }`}
                  >

                    <span
                      className={`cc-mini-box flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                        form.audience ===
                        "FACULTY"
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >

                      <UserRound
                        size={18}
                      />

                    </span>

                    <span>

                      <span className="block text-sm font-bold">
                        Faculty Only
                      </span>

                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        Hidden from Student portal
                      </span>

                    </span>

                  </button>

                </div>

              </div>

              {/* ACTION */}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

                <div
                  className={`cc-mini-box inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                    form.audience ===
                    "FACULTY"
                      ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                      : "border-blue-100 bg-blue-50 text-blue-700"
                  }`}
                >

                  {form.audience ===
                  "FACULTY" ? (
                    <UserRound
                      size={14}
                    />
                  ) : (
                    <Bell
                      size={14}
                    />
                  )}

                  {form.audience ===
                  "FACULTY"
                    ? "Audience: Faculty only"
                    : "Audience: Students + Faculty"}

                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="cc-mini-box inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {sending ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Sending...
                    </>
                  ) : (
                    <>
                      <Send
                        size={17}
                      />

                      Send Notification
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </section>

        {/* ==================================================
            RECENT NOTIFICATIONS
        ================================================== */}

        <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}

          <div className="border-b border-slate-100 p-6 sm:p-7">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Recent Notifications
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage recent broadcasts and review their selected audience.
                </p>

              </div>

              <div className="relative w-full lg:max-w-sm">

                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search notifications..."
                  className="cc-search h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

              </div>

            </div>

          </div>

          {/* BODY */}

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-5 py-4 text-sm font-medium text-slate-500">

                <RefreshCw
                  size={19}
                  className="animate-spin"
                />

                Loading notifications...

              </div>

            </div>
          ) : filteredNotifications.length ===
            0 ? (
            <div className="px-6 py-16 text-center">

              <div className="cc-mini-box mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-500">

                <Bell
                  size={25}
                />

              </div>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No notifications found
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">
                Send your first campus notification from the composer above.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {filteredNotifications.map(
                (notification) => (
                  <article
                    key={
                      notification.id
                    }
                    onMouseMove={(
                      event,
                    ) =>
                      handleCursorMove(
                        event,
                        notification.id,
                      )
                    }
                    onMouseLeave={() =>
                      setCursorEffect(
                        null,
                      )
                    }
                    style={getCursorStyle(
                      notification.id,
                    )}
                    className="cc-notification-card min-h-0 p-5 sm:p-6"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      {/* CONTENT */}

                      <div className="flex min-w-0 flex-1 items-start gap-4">

                        <div className="cc-mini-box mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">

                          <BellRing
                            size={19}
                          />

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-base font-bold text-slate-900">
                              {
                                notification.title
                              }
                            </h3>

                            <span
                              className={`cc-mini-box inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                notification.audience ===
                                "FACULTY"
                                  ? "border-indigo-100 bg-indigo-50 text-indigo-700"
                                  : "border-blue-100 bg-blue-50 text-blue-700"
                              }`}
                            >

                              {notification.audience ===
                              "FACULTY"
                                ? "Faculty Only"
                                : "Students + Faculty"}

                            </span>

                          </div>

                          <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-500">
                            {
                              notification.message
                            }
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">

                            <span className="inline-flex items-center gap-1.5">

                              <Clock3
                                size={14}
                              />

                              {formatDate(
                                notification.createdAt,
                              )}

                            </span>

                            <span>
                              {formatTime(
                                notification.createdAt,
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteNotification(
                            notification,
                          )
                        }
                        disabled={
                          deletingId ===
                          notification.id
                        }
                        className="cc-mini-box inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 lg:self-center"
                      >

                        {deletingId ===
                        notification.id ? (
                          <RefreshCw
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={15}
                          />
                        )}

                        Delete

                      </button>

                    </div>

                  </article>
                ),
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}