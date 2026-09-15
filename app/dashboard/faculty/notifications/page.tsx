"use client";

import {
  Bell,
  BellRing,
  CheckCircle2,
  GraduationCap,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  facultyId?: string;
  role?: string;
};

type NotificationAudience = "ALL" | "FACULTY" | "STUDENT" | "ADMIN" | "STUDENT_ADMIN";
type NotificationSenderRole = "ADMIN" | "FACULTY" | "SYSTEM";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  senderRole: NotificationSenderRole;
  senderId: string | null;
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

const EMPTY_FORM = {
  title: "",
  message: "",
  audience: "STUDENT_ADMIN" as "STUDENT_ADMIN" | "ADMIN",
};

function getStoredFaculty(): FacultyUser | null {
  if (typeof window === "undefined") return null;

  const keys = [
    "facultyUser",
    "faculty",
    "currentFaculty",
    "user",
  ];

  for (const key of keys) {
    const stored = window.localStorage.getItem(key);
    if (!stored) continue;

    try {
      const parsed = JSON.parse(stored) as FacultyUser & {
        id?: string;
        facultyId?: string;
        role?: string;
      };

      if (
        parsed &&
        parsed.id &&
        String(parsed.role ?? "").toUpperCase() === "FACULTY"
      ) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
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

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function audienceLabel(audience: NotificationAudience) {
  if (audience === "ALL") return "Students + Faculty";
  if (audience === "FACULTY") return "Faculty";
  if (audience === "STUDENT") return "Students";
  if (audience === "STUDENT_ADMIN") return "Admin + Students";
  return "Admin";
}

export default function FacultyNotificationsPage() {
  const router = useRouter();

  const [faculty, setFaculty] = useState<FacultyUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedFaculty = getStoredFaculty();
      setFaculty(storedFaculty);

      if (!storedFaculty?.id) {
        setError("Faculty information was not found. Please login again.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!faculty?.id) {
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch("/api/faculty/notifications", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load faculty notifications.",
          );
        }

        setNotifications(
          Array.isArray(data.notifications) ? data.notifications : [],
        );
      } catch (loadError) {
        console.error("FACULTY NOTIFICATIONS LOAD ERROR:", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [faculty?.id],
  );

  useEffect(() => {
    if (!faculty?.id) return;

    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [faculty?.id, loadNotifications]);

  function handleFormChange(
    field: "title" | "message" | "audience",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSendNotification(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (sending) return;

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title) {
      setError("Notification title is required.");
      return;
    }

    if (!message) {
      setError("Notification message is required.");
      return;
    }

    try {
      setSending(true);

      const response = await fetch("/api/faculty/notifications", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          audience: form.audience,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to send notification.",
        );
      }

      setSuccess(
        form.audience === "STUDENT_ADMIN"
          ? "Notification sent successfully to Students and Admin."
          : "Notification sent successfully to the Admin portal.",
      );

      setForm(EMPTY_FORM);

      if (data.notification) {
        setNotifications((current) => [
          data.notification as NotificationItem,
          ...current,
        ]);
      } else {
        await loadNotifications();
      }
    } catch (sendError) {
      console.error("FACULTY SEND NOTIFICATION ERROR:", sendError);

      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send notification.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteNotification(
    notification: NotificationItem,
  ) {
    if (
      deletingId ||
      !faculty?.id ||
      notification.senderRole !== "FACULTY" ||
      notification.senderId !== faculty.id
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${notification.title}"?\n\nThis notification will be removed from its audience feed.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(notification.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/faculty/notifications?id=${encodeURIComponent(
          notification.id,
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete notification.",
        );
      }

      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );

      setSuccess("Notification deleted successfully.");
    } catch (deleteError) {
      console.error("FACULTY DELETE NOTIFICATION ERROR:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete notification.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredNotifications = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return notifications;

    return notifications.filter((notification) => {
      return (
        notification.title.toLowerCase().includes(value) ||
        notification.message.toLowerCase().includes(value) ||
        notification.senderRole.toLowerCase().includes(value) ||
        audienceLabel(notification.audience)
          .toLowerCase()
          .includes(value)
      );
    });
  }, [notifications, search]);

  const receivedNotifications = useMemo(() => {
    return filteredNotifications
      .filter(
        (notification) =>
          !(
            notification.senderRole === "FACULTY" &&
            notification.senderId === faculty?.id
          ),
      )
      .slice(0, 3);
  }, [filteredNotifications, faculty?.id]);

  const sentNotifications = useMemo(() => {
    return filteredNotifications
      .filter(
        (notification) =>
          notification.senderRole === "FACULTY" &&
          notification.senderId === faculty?.id,
      )
      .slice(0, 3);
  }, [filteredNotifications, faculty?.id]);

  const facultyId = faculty?.facultyId || faculty?.id || "FACULTY";

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#edf4fa] text-[#0d1728]">
      <div className="min-h-screen w-full min-w-0">
        <main className="relative min-h-screen w-full overflow-hidden bg-[#edf4fa] px-4 py-5 sm:px-6 lg:px-7">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.07) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
          </div>

          <div className="relative w-full">
            <section className="relative mb-5 h-[280px] w-full overflow-hidden rounded-[25px] bg-[#101c2e] text-white shadow-[0_20px_60px_rgba(20,45,70,0.14)]">
              <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-[#6fc9ed]/20" />
              <div className="pointer-events-none absolute right-[-30px] top-[55px] h-56 w-56 rounded-full border border-[#6fc9ed]/10" />
              <div className="pointer-events-none absolute bottom-[-110px] left-[40%] h-64 w-64 rounded-full bg-[#54bce5]/5 blur-3xl" />

              <div className="relative flex h-full w-full items-center px-6 sm:px-9 lg:px-10">
                <div className="flex w-full items-center justify-between gap-6">
                  <div className="max-w-[820px]">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#63c9ef]/30 bg-[#17314a] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73d0f3]">
                      <Bell size={13} />
                      Faculty Communication Center
                    </div>

                    <h1 className="font-serif text-[31px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[40px]">
                      Stay informed.
                      <br />
                      <span className="text-[#69c9ed]">
                        Stay connected.
                      </span>
                    </h1>

                    <p className="mt-3 max-w-[730px] text-[11px] leading-5 text-[#a9b9ca] sm:text-[12px]">
                      Receive important campus updates from Admin and Faculty,
                      and communicate directly with Students or the Admin
                      Portal from one secure notification workspace.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#54bce5]/20 bg-[#17314a] px-3 py-1.5 text-[9px] font-bold text-[#80d6f4]">
                        <BellRing size={12} />
                        {notifications.length} Total
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-[#49c997]/20 bg-[#123528] px-3 py-1.5 text-[9px] font-bold text-[#72dcb4]">
                        <CheckCircle2 size={12} />
                        {unreadCount} Unread
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] text-[#b5c4d3]">
                        Faculty ID:{" "}
                        <span className="font-bold text-white">
                          {facultyId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden h-[76px] w-[76px] shrink-0 items-center justify-center rounded-3xl border border-[#61c8ee]/20 bg-[#17324b] text-[#68cbed] lg:flex">
                    <Bell size={34} />
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-[#f2caca] bg-[#fff6f6] px-4 py-3 text-[11px] text-[#b13c3c] shadow-sm">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="shrink-0 rounded-lg p-1 hover:bg-red-100"
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-[#ccebdc] bg-[#f3fbf7] px-4 py-3 text-[11px] text-[#287a58] shadow-sm">
                <span>{success}</span>
                <button
                  type="button"
                  onClick={() => setSuccess("")}
                  className="shrink-0 rounded-lg p-1 hover:bg-green-100"
                  aria-label="Dismiss success"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <section className="mb-5 overflow-hidden rounded-[22px] border border-[#d5e2ec] bg-white shadow-[0_12px_35px_rgba(30,60,90,0.055)]">
              <div className="border-b border-[#e6edf2] px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef7fc] text-[#4a9bc8]">
                    <Megaphone size={19} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3988b8]">
                      New Message
                    </p>
                    <h2 className="mt-1 font-serif text-[21px] font-bold text-[#17283c]">
                      Send a Notification
                    </h2>
                    <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#8194a7]">
                      Send one notification to Students + Admin, or send a direct
                      notification only to the Admin Portal.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSendNotification}
                className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]"
              >
                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#71879b]">
                    Notification Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      handleFormChange("title", event.target.value)
                    }
                    maxLength={150}
                    disabled={sending}
                    placeholder="e.g. Important class update"
                    className="h-12 w-full rounded-xl border border-[#d8e5ee] bg-[#fbfdff] px-4 text-[11px] font-medium text-[#273b50] outline-none transition focus:border-[#72c5e9] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />

                  <div className="mt-2 text-right text-[9px] text-[#9badbc]">
                    {form.title.length}/150
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#71879b]">
                    Send To
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleFormChange("audience", "STUDENT_ADMIN")
                      }
                      disabled={sending}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        form.audience === "STUDENT_ADMIN"
                          ? "border-[#54bce5] bg-[#eefaff] ring-2 ring-[#54bce5]/10"
                          : "border-[#d8e5ee] bg-[#fbfdff] hover:border-[#a6cee3]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            form.audience === "STUDENT_ADMIN"
                              ? "bg-[#54bce5] text-white"
                              : "bg-[#eef5fa] text-[#68849b]"
                          }`}
                        >
                          <Users size={17} />
                        </div>

                        <div>
                          <span className="block text-[11px] font-bold text-[#23374b]">
                            Students
                          </span>
                          <span className="mt-0.5 block text-[9px] text-[#899bac]">
                            Send to Student portal
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleFormChange("audience", "ADMIN")
                      }
                      disabled={sending}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        form.audience === "ADMIN"
                          ? "border-[#7088e8] bg-[#f0f3ff] ring-2 ring-[#7088e8]/10"
                          : "border-[#d8e5ee] bg-[#fbfdff] hover:border-[#b7c2ee]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            form.audience === "ADMIN"
                              ? "bg-[#6078db] text-white"
                              : "bg-[#eef1fb] text-[#7180aa]"
                          }`}
                        >
                          <UserCircle size={17} />
                        </div>

                        <div>
                          <span className="block text-[11px] font-bold text-[#23374b]">
                            Admin
                          </span>
                          <span className="mt-0.5 block text-[9px] text-[#899bac]">
                            Send directly to Admin portal
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#71879b]">
                    Message
                  </label>

                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      handleFormChange("message", event.target.value)
                    }
                    maxLength={2000}
                    rows={5}
                    disabled={sending}
                    placeholder="Write a clear and useful notification message..."
                    className="w-full resize-none rounded-xl border border-[#d8e5ee] bg-[#fbfdff] px-4 py-3 text-[11px] leading-5 text-[#273b50] outline-none transition placeholder:text-[#9badbc] focus:border-[#72c5e9] focus:ring-4 focus:ring-[#54bce5]/10 disabled:opacity-60"
                  />

                  <div className="mt-2 text-right text-[9px] text-[#9badbc]">
                    {form.message.length}/2000
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-[#edf1f5] pt-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8e5ee] bg-[#f8fafc] px-3 py-1.5 text-[9px] font-bold text-[#567087]">
                    <Bell size={12} />
                    Sending to{" "}
                    <span className="text-[#1e5f86]">
                      {form.audience === "STUDENT_ADMIN" ? "Admin + Students" : "Admin"}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111d2e] px-6 text-[10px] font-bold text-white shadow-[0_10px_25px_rgba(17,29,46,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1a2a40] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <div className="space-y-5">
              <section className="overflow-hidden rounded-[22px] border border-[#d5e1eb] bg-white shadow-[0_12px_35px_rgba(30,60,90,0.055)]">
                <div className="flex flex-col gap-3 border-b border-[#e2e9ef] px-5 py-5 sm:px-6">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3988b8]">
                      Notification Feed
                    </p>
                    <h2 className="mt-1 font-serif text-[20px] font-bold text-[#15263a]">
                      Recent Received Notifications
                    </h2>
                    <p className="mt-1 text-[10px] text-[#7b8fa2]">
                      Notifications received from Admin and other Faculty members.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <div className="relative min-w-0 sm:w-[280px]">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8da1b4]"
                      />
                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search notifications..."
                        className="h-10 w-full rounded-xl border border-[#dce7ef] bg-[#fbfdff] pl-10 pr-3 text-[10px] text-[#25384d] outline-none transition focus:border-[#8fc8e6] focus:ring-4 focus:ring-[#54bce5]/10"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void loadNotifications(true)}
                      disabled={refreshing}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d5e2eb] bg-white px-4 text-[10px] font-bold text-[#49657f] shadow-sm transition hover:border-[#9bcce6] hover:text-[#267ba8] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw
                        size={14}
                        className={refreshing ? "animate-spin" : ""}
                      />
                      Refresh
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-[260px] items-center justify-center">
                    <div className="flex items-center gap-3 rounded-xl bg-[#f6f9fc] px-5 py-4 text-[11px] font-semibold text-[#71879b]">
                      <RefreshCw
                        size={18}
                        className="animate-spin text-[#54bce5]"
                      />
                      Loading notifications...
                    </div>
                  </div>
                ) : receivedNotifications.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef6fb] text-[#70a5c2]">
                      <BellRing size={27} />
                    </div>
                    <h3 className="mt-5 font-serif text-[18px] font-bold text-[#24374c]">
                      No received notifications
                    </h3>
                    <p className="mt-2 max-w-md text-[10px] leading-5 text-[#8194a7]">
                      Admin announcements and Faculty messages will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e7edf2]">
                    {receivedNotifications.map((notification) => {
                      const isOwn =
                        notification.senderRole === "FACULTY" &&
                        notification.senderId === faculty?.id;

                      return (
                        <article
                          key={notification.id}
                          className="group p-5 transition hover:bg-[#f8fcff] sm:p-6"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div
                                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                  notification.senderRole === "ADMIN"
                                    ? "bg-[#eef7fc] text-[#4a9bc8]"
                                    : notification.senderRole === "FACULTY"
                                      ? "bg-[#f0f3ff] text-[#6078db]"
                                      : "bg-[#f3fbf7] text-[#31815f]"
                                }`}
                              >
                                <BellRing size={19} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-[14px] font-bold text-[#15263a]">
                                    {notification.title}
                                  </h3>

                                  {!notification.isRead && (
                                    <span className="rounded-full border border-[#bfe6d3] bg-[#f1fbf6] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-[#30805d]">
                                      New
                                    </span>
                                  )}

                                  <span className="rounded-full border border-[#d8e5ee] bg-[#f8fafc] px-2.5 py-1 text-[8px] font-bold uppercase tracking-wide text-[#62798f]">
                                    To: {audienceLabel(notification.audience)}
                                  </span>
                                </div>

                                <p className="mt-2 text-[11px] leading-5 text-[#667d93]">
                                  {notification.message}
                                </p>

                                <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] text-[#94a5b5]">
                                  <span>
                                    From:{" "}
                                    <span className="font-semibold text-[#5d7388]">
                                      {isOwn
                                        ? "You"
                                        : notification.senderRole === "ADMIN"
                                          ? "Admin"
                                          : notification.senderRole === "FACULTY"
                                            ? "Faculty"
                                            : "System"}
                                    </span>
                                  </span>

                                  <span>•</span>

                                  <span>{formatDate(notification.createdAt)}</span>
                                  <span>{formatTime(notification.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-[22px] border border-[#d5e1eb] bg-white shadow-[0_12px_35px_rgba(30,60,90,0.055)]">
                <div className="flex flex-col gap-3 border-b border-[#e2e9ef] px-5 py-5 sm:px-6">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6c7ee4]">
                      Sent History
                    </p>
                    <h2 className="mt-1 font-serif text-[20px] font-bold text-[#15263a]">
                      Recent Sent Notifications
                    </h2>
                    <p className="mt-1 text-[10px] text-[#7b8fa2]">
                      Notifications you have sent to Students + Admin or the Admin portal.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-[220px] items-center justify-center">
                    <div className="flex items-center gap-3 rounded-xl bg-[#f6f9fc] px-5 py-4 text-[11px] font-semibold text-[#71879b]">
                      <RefreshCw
                        size={18}
                        className="animate-spin text-[#6078db]"
                      />
                      Loading sent notifications...
                    </div>
                  </div>
                ) : sentNotifications.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f3ff] text-[#6078db]">
                      <Send size={24} />
                    </div>
                    <h3 className="mt-5 font-serif text-[18px] font-bold text-[#24374c]">
                      No sent notifications
                    </h3>
                    <p className="mt-2 max-w-md text-[10px] leading-5 text-[#8194a7]">
                      Your sent notifications will appear here after you send one.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e7edf2]">
                    {sentNotifications.map((notification) => (
                      <article
                        key={notification.id}
                        className="group p-5 transition hover:bg-[#fbfbff] sm:p-6"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#6078db]">
                              <Send size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-[14px] font-bold text-[#15263a]">
                                  {notification.title}
                                </h3>

                                <span className="rounded-full border border-[#cfd6fb] bg-[#f4f6ff] px-2.5 py-1 text-[8px] font-bold uppercase tracking-wide text-[#6078db]">
                                  To: {audienceLabel(notification.audience)}
                                </span>
                              </div>

                              <p className="mt-2 text-[11px] leading-5 text-[#667d93]">
                                {notification.message}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] text-[#94a5b5]">
                                <span>
                                  From:{" "}
                                  <span className="font-semibold text-[#5d7388]">
                                    You
                                  </span>
                                </span>

                                <span>•</span>
                                <span>{formatDate(notification.createdAt)}</span>
                                <span>{formatTime(notification.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteNotification(notification)
                            }
                            disabled={deletingId === notification.id}
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-[#efcaca] bg-[#fffafa] px-4 text-[10px] font-bold text-[#c34c4c] transition hover:border-[#54bce5] hover:bg-[#eefaff] hover:text-[#167aa9] disabled:cursor-not-allowed disabled:opacity-50 lg:self-center"
                          >
                            {deletingId === notification.id ? (
                              <RefreshCw
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <X size={14} />
                            )}
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <footer className="py-8 text-center text-[10px] text-[#8194a7]">
              © 2026 CampusConnect • Faculty Notifications
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}