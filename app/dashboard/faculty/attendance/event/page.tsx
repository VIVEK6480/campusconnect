"use client";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  X,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  Save,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { useRouter } from "next/navigation";

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

type Student = {
  id: string;
  campusUserId?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  approvalStatus?: string | null;
  profileImage?: string | null;
};

type Club = {
  id: string;
  name: string;
};

type EventItem = {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  eventDate?: string;
  club?: Club | null;
};


type AttendanceRecord = {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  markedAt: string;
  updatedAt?: string;
  user?: Student | null;
  event?: EventItem | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  attendance?: AttendanceRecord[];
  students?: Student[];
  users?: Student[];
  events?: EventItem[];
  count?: number;
};

/* =========================================================
   DEFAULT FACULTY
========================================================= */

const defaultFaculty: FacultyUser = {
  id: "",
  name: "Faculty Member",
  email: "faculty@campusconnect.com",
  facultyId: "RNT-9457",
  role: "Faculty Member",
  approvalStatus: "APPROVED",
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
    href: "/students",
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

const semesterOptions = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
];

const sectionOptions = ["Section A", "Section B", "Section C", "Section D"];


/* =========================================================
   MAIN PAGE
========================================================= */

export default function FacultyEventAttendancePage() {
  const router = useRouter();

  /* =======================================================
     FACULTY
  ======================================================== */

  const [user, setUser] =
    useState<FacultyUser>(defaultFaculty);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [attendanceMenuOpen, setAttendanceMenuOpen] =
    useState(true);

  /* =======================================================
     DATA
  ======================================================== */

  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [events, setEvents] =
    useState<EventItem[]>([]);


  /* =======================================================
     LOADING / ERROR
  ======================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     SEARCH
  ======================================================== */

  const [search, setSearch] =
    useState("");

  /* =======================================================
     FILTER
  ======================================================== */

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [eventFilter, setEventFilter] =
    useState("ALL");

  // Attendance Records date filter
  const [dateFilter, setDateFilter] =
    useState("");

  /* =======================================================
     MARK ATTENDANCE
  ======================================================== */

  const [selectedStudents, setSelectedStudents] =
    useState<string[]>([]);

  const [selectedSemester, setSelectedSemester] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState("");

  const [selectedEvent, setSelectedEvent] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("Present");

  const [saving, setSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [saveError, setSaveError] =
    useState("");

  /* =======================================================
     EDIT
  ======================================================== */

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingStatus, setEditingStatus] =
    useState("Present");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  /* =======================================================
     FACULTY USER
     
     IMPORTANT:
     We intentionally start with the same default user on
     server and client. localStorage is read only after mount.
     This prevents hydration mismatch.
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadFacultyFromStorage = async () => {
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      try {
        const possibleKeys = [
          "facultyUser",
          "faculty",
          "currentFaculty",
          "user",
        ];

        let parsed: FacultyUser | null = null;

        for (const key of possibleKeys) {
          const stored =
            window.localStorage.getItem(key);

          if (!stored) {
            continue;
          }

          try {
            const candidate =
              JSON.parse(stored);

            if (
              candidate &&
              typeof candidate === "object" &&
              candidate.email
            ) {
              parsed = candidate;
              break;
            }
          } catch {
            continue;
          }
        }

        if (!parsed || cancelled) {
          return;
        }

        setUser({
          id: parsed.id || "",
          name:
            parsed.name ||
            defaultFaculty.name,
          email:
            parsed.email ||
            defaultFaculty.email,
          facultyId:
            parsed.facultyId ||
            parsed.campusUserId ||
            defaultFaculty.facultyId,
          campusUserId:
            parsed.campusUserId ||
            null,
          role:
            parsed.role ||
            defaultFaculty.role,
          approvalStatus:
            parsed.approvalStatus ||
            defaultFaculty.approvalStatus,
        });
      } catch (storageError) {
        console.error(
          "FACULTY USER LOAD ERROR:",
          storageError
        );
      }
    };

    void loadFacultyFromStorage();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     FACULTY DISPLAY DATA
  ======================================================== */

  const facultyName =
    user.name || "Faculty Member";

  const facultyEmail =
    user.email ||
    "faculty@campusconnect.com";

  const facultyId =
    user.facultyId || "RNT-9457";

  const facultyRole =
    user.role || "Faculty Member";

  const initials = facultyName
    .split(" ")
    .filter(Boolean)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FM";

  /* =======================================================
     LOAD ATTENDANCE + EVENTS
     
     NO /api/users HERE.
     
     Faculty API:
       /api/faculty/attendance/event
  ======================================================== */

  async function loadData(
    showRefresh = false
  ) {

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const facultyToken =
        localStorage.getItem(
          "facultyToken"
        );

      const token =
        facultyToken ||
        localStorage.getItem("token");

      const headers: HeadersInit = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const params = new URLSearchParams();

      if (selectedSemester) {
        params.set("semester", selectedSemester);
      }

      if (selectedSection) {
        params.set("section", selectedSection);
      }

      const query = params.toString();

      const attendanceResponse = await fetch(
        query
          ? `/api/faculty/attendance/event?${query}`
          : "/api/faculty/attendance/event",
        {
          method: "GET",
          headers,
          credentials: "include",
          cache: "no-store",
        }
      );

      let attendanceData: ApiResponse = {};

      try {
        attendanceData =
          (await attendanceResponse.json()) as ApiResponse;
      } catch {
        attendanceData = {};
      }

      if (
        !attendanceResponse.ok ||
        !attendanceData.success
      ) {
        throw new Error(
          attendanceData.message ||
            "Unable to load event attendance data."
        );
      }

      const loadedAttendance =
        Array.isArray(attendanceData.attendance)
          ? attendanceData.attendance
          : [];

      const loadedEvents =
        Array.isArray(attendanceData.events)
          ? attendanceData.events
          : [];

      const loadedStudents =
        Array.isArray(attendanceData.students)
          ? attendanceData.students
          : [];

      /* ===================================================
          UPDATE STATE AFTER ASYNC WORK
      =================================================== */

      setAttendance(loadedAttendance);
      setEvents(loadedEvents);

      // Privacy rule: students are rendered only after both
      // semester and section have been selected.
      const groupSelected =
        Boolean(selectedSemester && selectedSection);

      setStudents(groupSelected ? loadedStudents : []);

    } catch (loadError) {
      console.error(
        "FACULTY ATTENDANCE LOAD ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load attendance data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
     
     async function runs after mount.
  ======================================================== */

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      await loadData(false);
    };

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     LOAD STUDENTS FOR SELECTED EVENT GROUP

     Students are fetched only when semester and section are
     selected. This keeps the list strictly tied to
     StudentRegistration.
  ======================================================== */

  useEffect(() => {
    const refreshSelectedClass = async () => {
      await Promise.resolve();
      await loadData(true);
    };

    if (
      !selectedSemester ||
      !selectedSection
    ) {
      return;
    }

    void refreshSelectedClass();
  }, [
    selectedSemester,
    selectedSection,
  ]);

  /* =======================================================
     MERGE EVENTS INTO ATTENDANCE
     
     Useful when API returns event ID but relation is absent.
  ======================================================== */

  const attendanceWithEvents =
    useMemo(() => {
      return attendance.map(
        (record) => {
          if (record.event) {
            return record;
          }

          const matchingEvent =
            events.find(
              (event) =>
                event.id ===
                record.eventId
            );

          return {
            ...record,
            event:
              matchingEvent || null,
          };
        }
      );
    }, [attendance, events]);

  /* =======================================================
     DERIVE STUDENTS FROM ATTENDANCE AGAIN
     
     Keeps UI consistent even if records update.
  ======================================================== */

  const allStudents =
    useMemo(() => {
      /*
       * IMPORTANT:
       * Never show students in the class-attendance list until
       * semester, section and subject are all selected.
       *
       * Attendance records are intentionally NOT merged here.
       * They are only used by the Records section below.
       */
      if (
        !selectedSemester ||
        !selectedSection
      ) {
        return [];
      }

      return students;
    }, [
      students,
      selectedSemester,
      selectedSection,
    ]);

  /* =======================================================
     ATTENDANCE RECORD VIEW

     Records are shown only after a date and event are
     selected. Search and status then narrow the results.
  ======================================================== */

  const recordsViewEnabled =
    Boolean(
      dateFilter &&
      eventFilter !== "ALL"
    );

  /* =======================================================
     FILTERED ATTENDANCE
  ======================================================== */

  const filteredAttendance =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return attendanceWithEvents.filter(
        (record) => {
          const studentName =
            record.user?.name ||
            "";

          const studentEmail =
            record.user?.email ||
            "";

          const campusId =
            record.user?.campusUserId ||
            "";

          const eventTitle =
            record.event?.title ||
            "";

          const matchesSearch =
            !value ||
            studentName
              .toLowerCase()
              .includes(value) ||
            studentEmail
              .toLowerCase()
              .includes(value) ||
            campusId
              .toLowerCase()
              .includes(value) ||
            eventTitle
              .toLowerCase()
              .includes(value);

          const matchesStatus =
            statusFilter === "ALL" ||
            record.status
              .toUpperCase() ===
              statusFilter;

          const matchesEvent =
            eventFilter === "ALL" ||
            record.eventId ===
              eventFilter;

          // Compare the selected date with the attendance marked date.
          // Using the local date keeps the filter consistent with the date
          // shown in the Attendance Records table.
          const recordDate = record.markedAt
            ? new Date(record.markedAt)
                .toLocaleDateString("en-CA")
            : "";

          const matchesDate =
            !dateFilter ||
            recordDate === dateFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesEvent &&
            matchesDate
          );
        }
      );
    }, [
      attendanceWithEvents,
      search,
      statusFilter,
      eventFilter,
      dateFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================== */

  const totalRecords =
    attendance.length;

  const presentCount =
    attendance.filter(
      (item) =>
        item.status
          .toLowerCase() ===
        "present"
    ).length;

  const absentCount =
    attendance.filter(
      (item) =>
        item.status
          .toLowerCase() ===
        "absent"
    ).length;

  const uniqueStudentCount =
    allStudents.length;

  /* =======================================================
     TODAY
     
     No new Date() directly in render.
     This prevents hydration mismatch.
  ======================================================== */

  const [todayText, setTodayText] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const setToday = async () => {
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      setTodayText(
        new Intl.DateTimeFormat(
          undefined,
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ).format(new Date())
      );
    };

    void setToday();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     BULK / EVENT ATTENDANCE

     Selected students become PRESENT.
     Every other student becomes ABSENT for the selected event.
  ======================================================== */
  async function handleBulkMarkAttendance() {
    setSaveMessage("");
    setSaveError("");

    if (!selectedSemester || !selectedSection) {
      setSaveError("Please select semester and section.");
      return;
    }

    if (!selectedEvent) {
      setSaveError("Please select an event.");
      return;
    }

    setSaving(true);

    try {
      const facultyToken = localStorage.getItem("facultyToken");
      const token = facultyToken || localStorage.getItem("token");

      const response = await fetch("/api/faculty/attendance/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          bulk: true,
          eventId: selectedEvent,
          presentUserIds: selectedStudents,
          status: selectedStatus,
          semester: selectedSemester,
          section: selectedSection,
        }),
      });

      let data: ApiResponse = {};
      try {
        data = (await response.json()) as ApiResponse;
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to mark event attendance.");
      }

      setSaveMessage(
        `Event attendance marked successfully. ${selectedStudents.length} student(s) present and ${Math.max(
          students.length - selectedStudents.length,
          0
        )} student(s) absent.`
      );

      setSelectedStudents([]);
      setSelectedEvent("");
      setSelectedSemester("");
      setSelectedSection("");
      setSelectedStatus("Present");

      await loadData(true);
    } catch (saveErr) {
      console.error("BULK ATTENDANCE ERROR:", saveErr);
      setSaveError(
        saveErr instanceof Error
          ? saveErr.message
          : "Unable to mark event attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     UPDATE ATTENDANCE
  ======================================================== */

  async function handleUpdateAttendance(
    id: string
  ) {
    setSaveError("");
    setSaveMessage("");

    try {
      const response =
        await fetch(
          "/api/faculty/attendance/event",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({
              id,
              status: editingStatus,
            }),
          }
        );

      let data: ApiResponse = {};

      try {
        data =
          (await response.json()) as ApiResponse;
      } catch {
        data = {};
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update attendance."
        );
      }

      setEditingId(null);
      setEditingStatus("Present");

      setSaveMessage(
        "Attendance updated successfully."
      );

      await loadData(true);
    } catch (updateError) {
      console.error(
        "UPDATE ATTENDANCE ERROR:",
        updateError
      );

      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update attendance."
      );
    }
  }

  /* =======================================================
     DELETE ATTENDANCE
  ======================================================== */

  async function handleDeleteAttendance(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this attendance record?"
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setSaveError("");
    setSaveMessage("");

    try {
      const response =
        await fetch(
          "/api/faculty/attendance/event",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({ id }),
          }
        );

      let data: ApiResponse = {};

      try {
        data =
          (await response.json()) as ApiResponse;
      } catch {
        data = {};
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to delete attendance."
        );
      }

      setSaveMessage(
        "Attendance deleted successfully."
      );

      await loadData(true);
    } catch (deleteError) {
      console.error(
        "DELETE ATTENDANCE ERROR:",
        deleteError
      );

      setSaveError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete attendance."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =======================================================
     SIGN OUT
  ======================================================== */

  async function handleSignOut() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        }
      );
    } catch (logoutError) {
      console.error(
        "FACULTY LOGOUT ERROR:",
        logoutError
      );
    }

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
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem(
        "facultyToken"
      );
    } catch (storageError) {
      console.error(
        "FACULTY STORAGE CLEANUP ERROR:",
        storageError
      );
    }

    router.replace(
      "/faculty/login"
    );
  }

  /* =======================================================
     RENDER
  ======================================================== */

  const handleRecordsRefresh =
    async () => {
      // Clear the record filters and return to the
      // date + event selection state.
      setSearch("");
      setDateFilter("");
      setStatusFilter("ALL");
      setEventFilter("ALL");

      await loadData(true);
    };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">

      {/* ===================================================
          MOBILE OVERLAY
      =================================================== */}

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

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
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
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            aria-label="Close sidebar"
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

              if (item.title === "Attendance") {
                return (
                  <div key={item.title} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setAttendanceMenuOpen(
                          (open) => !open
                        )
                      }
                      className="
                        group flex h-11 w-full items-center gap-3
                        rounded-xl px-3.5 text-left
                        text-[13px] font-medium
                        text-[#64c8ee]
                        bg-[#17263a]
                        shadow-[inset_3px_0_0_#54bce5]
                        transition-all duration-200
                      "
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        className="text-[#63c9ef]"
                      />

                      <span className="flex-1">
                        Attendance
                      </span>

                      <ChevronRight
                        size={16}
                        className={`
                          text-[#63c9ef] transition-transform duration-200
                          ${attendanceMenuOpen ? "rotate-90" : ""}
                        `}
                      />
                    </button>

                    {attendanceMenuOpen && (
                      <div className="ml-4 space-y-1 border-l border-[#263952] pl-3">
                        <Link
                          href="/dashboard/faculty/attendance/class"
                          onClick={() =>
                            setMobileSidebarOpen(false)
                          }
                          className="
                            group flex min-h-10 w-full items-center
                            rounded-lg px-3 py-2 text-[12px]
                            font-medium text-white bg-[#142135]
                            transition hover:bg-[#1a2c43]
                          "
                        >
                          <span className="truncate">
                            Mark Class Attendance
                          </span>
                        </Link>

                        <Link
                         href="/dashboard/faculty/attendance/event"
                          onClick={() =>
                            setMobileSidebarOpen(false)
                          }
                          className="
                            group flex min-h-10 w-full items-center
                            rounded-lg px-3 py-2 text-[12px]
                            font-medium text-[#9aabc0]
                            transition hover:bg-[#142135]
                            hover:text-white
                          "
                        >
                          <span className="truncate">
                            Mark Event Attendance
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              const active =
                item.href ===
                "/dashboard/faculty/attendance/event";

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() =>
                    setMobileSidebarOpen(false)
                  }
                  className={`
                    group flex h-11 w-full items-center gap-3
                    rounded-xl px-3.5
                    text-[13px] font-medium
                    transition-all duration-200
                    ${
                      active
                        ? "bg-[#17263a] text-[#64c8ee] shadow-[inset_3px_0_0_#54bce5]"
                        : "text-[#9aabc0] hover:bg-[#142135] hover:text-white"
                    }
                  `}
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
                const Icon =
                  item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() =>
                      setMobileSidebarOpen(
                        false
                      )
                    }
                    className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
                  >

                    <Icon
                      size={18}
                      strokeWidth={1.8}
                      className="text-[#8195ad] group-hover:text-[#63c9ef]"
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
              onClick={
                handleSignOut
              }
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-[13px] font-medium text-[#9aabc0] transition-all duration-200 hover:bg-[#142135] hover:text-white"
            >

              <LogOut
                size={18}
                strokeWidth={1.8}
                className="text-[#8195ad] group-hover:text-[#63c9ef]"
              />

              <span>
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

      {/* ===================================================
          MAIN AREA
      =================================================== */}

      <div className="min-h-screen w-full min-w-0 lg:pl-[270px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 h-[86px] w-full border-b border-[#dce6f0] bg-white/95 backdrop-blur-xl">

          <div className="flex h-full w-full items-center justify-between px-5 sm:px-6">

            <div className="flex items-center gap-4">

              <button
                type="button"
                onClick={() =>
                  setMobileSidebarOpen(
                    true
                  )
                }
                aria-label="Open sidebar"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#263a53] shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>

                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3985b6]">
                  Faculty Portal
                </p>

                <p className="mt-1 hidden text-[11px] text-[#71839a] sm:block">
                  Attendance management workspace
                </p>

              </div>

            </div>

            <div className="flex items-center gap-2 sm:gap-3">

              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe]"
              >

                <Bell
                  size={18}
                  strokeWidth={1.8}
                />

                <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-[#54bce5]" />

              </button>

              <button
                type="button"
                aria-label="Settings"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[#dce6f0] bg-white text-[#4f6680] shadow-sm transition hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#398fbe] sm:flex"
              >

                <Settings
                  size={18}
                  strokeWidth={1.8}
                />

              </button>

              <div className="mx-1 hidden h-8 w-px bg-[#dce6f0] sm:block" />

              <div className="hidden items-center gap-2.5 sm:flex">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#69acd2] text-[12px] font-bold text-white">
                  {initials}
                </div>

                <div>

                  <p className="text-[12px] font-semibold text-[#18283d]">
                    {facultyName}
                  </p>

                  <p className="text-[10px] text-[#72849a]">
                    {facultyRole}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="relative min-h-[calc(100vh-86px)] w-full overflow-hidden bg-[#edf4fa] px-5 py-6 sm:px-6">

          {/* BACKGROUND */}

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

          <div className="relative w-full">
{/* =================================================
                HERO
            ================================================== */}

            <section className="relative w-full overflow-hidden rounded-[23px] border border-[#263951] bg-gradient-to-br from-[#0d1728] via-[#101d30] to-[#14273b] px-7 py-6 shadow-[0_18px_45px_rgba(10,27,48,0.18)] sm:px-9 sm:py-7">

              <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#54bce5]/20" />

              <div className="pointer-events-none absolute -right-3 top-12 h-40 w-40 rounded-full border border-[#54bce5]/10" />

              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3.5 py-1.5 text-[11px] font-semibold text-[#76d0f1]">

                    <ClipboardCheck
                      size={14}
                    />

                    Faculty Attendance

                  </div>

                  <h1 className="font-serif text-[34px] font-bold leading-tight tracking-[-0.03em] text-white sm:text-[43px]">

                    Event Attendance

                  </h1>

                  <p className="mt-3 max-w-[800px] text-[13px] leading-6 text-[#a7b7c9] sm:text-[14px]">

                    Record, update and monitor
                    student attendance from
                    your Faculty Dashboard.

                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">

                    <div className="inline-flex items-center gap-2 rounded-full border border-[#49c997]/30 bg-[#49c997]/10 px-3.5 py-2 text-[11px] font-semibold text-[#72dcb4]">

                      <CheckCircle2
                        size={14}
                      />

                      Attendance Active

                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-[#7890aa]/30 bg-white/[0.04] px-3.5 py-2 text-[11px] font-medium text-[#b3c0d0]">

                      Faculty ID:

                      <span className="font-bold text-white">
                        {facultyId}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-[21px] border border-[#54bce5]/25 bg-[#15273b]/90 shadow-[0_20px_45px_rgba(0,0,0,0.2)]">

                  <ClipboardCheck
                    size={46}
                    strokeWidth={1.5}
                    className="text-[#67bfe6]"
                  />

                </div>

              </div>

            </section>
{/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">

                <div className="flex items-start gap-3">

                  <XCircle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <div>

                    <p className="font-semibold">
                      Unable to load attendance
                    </p>

                    <p className="mt-1 text-xs leading-5">
                      {error}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                MARK ATTENDANCE
            ================================================== */}

            <section className="mt-6 rounded-[20px] border border-[#d9e4ee] bg-white p-6 shadow-[0_8px_25px_rgba(30,60,90,0.06)]">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#438bb8]">
                    Attendance Entry
                  </p>

                  <h2 className="mt-1 font-serif text-[23px] font-bold text-[#142238]">
                    Mark Event Attendance
                  </h2>

                  <p className="mt-1 text-[12px] text-[#72849a]">
                    Select semester, section and event, then tick every student who is present. Every unchecked student will be marked absent.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => void loadData(true)}
                  disabled={refreshing}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d7e3ed] bg-white px-4 text-xs font-semibold text-[#456078] transition hover:border-[#9bcbe4] hover:bg-[#f4f9fd] hover:text-[#3989b7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

              </div>

              {saveMessage && (
                <div className="mt-5 rounded-xl border border-[#cdebdc] bg-[#f1faf5] px-4 py-3 text-xs font-semibold text-[#31986d]">
                  {saveMessage}
                </div>
              )}

              {saveError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                  {saveError}
                </div>
              )}

              {/* CLASS DETAILS */}
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label htmlFor="semester" className="mb-2 block text-[11px] font-semibold text-[#63788e]">Semester</label>
                  <select
                      id="semester"
                      value={selectedSemester}
                      onChange={(e) => {
                        setSelectedSemester(e.target.value);
                        setSelectedSection("");
                        setSelectedEvent("");
                        setSelectedStudents([]);
                        setStudents([]);
                        setSaveError("");
                        setSaveMessage("");
                      }}
                      className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-3 text-xs font-medium text-[#24384e] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10"
                    >
                    <option value="">Select semester</option>
                    {semesterOptions.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="section" className="mb-2 block text-[11px] font-semibold text-[#63788e]">Section</label>
                  <select
                      id="section"
                      value={selectedSection}
                      onChange={(e) => {
                        setSelectedSection(e.target.value);
                        setSelectedStudents([]);
                        setStudents([]);
                        setSaveError("");
                        setSaveMessage("");
                      }}
                      className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-3 text-xs font-medium text-[#24384e] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10"
                    >
                    <option value="">Select section</option>
                    {sectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="event"
                    className="mb-2 block text-[11px] font-semibold text-[#63788e]"
                  >
                    Event
                  </label>
                  <select
                    id="event"
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      setSelectedStudents([]);
                      setSaveError("");
                      setSaveMessage("");
                    }}
                    disabled={
                      !selectedSemester ||
                      !selectedSection ||
                      events.length === 0
                    }
                    className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-3 text-xs font-medium text-[#24384e] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 disabled:cursor-not-allowed disabled:bg-[#f1f5f8] disabled:text-[#9aabb9]"
                  >
                    <option value="">
                      {!selectedSemester || !selectedSection
                        ? "Select semester and section first"
                        : events.length === 0
                          ? "No events available"
                          : "Select event"}
                    </option>

                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="event-status"
                    className="mb-2 block text-[11px] font-semibold text-[#63788e]"
                  >
                    Status
                  </label>
                  <select
                    id="event-status"
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setSaveError("");
                      setSaveMessage("");
                    }}
                    className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-3 text-xs font-medium text-[#24384e] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Excused">Excused</option>
                  </select>
                </div>
              </div>

              {/* STUDENT LIST */}
              <div className="mt-5 rounded-xl border border-[#d8e3ed] bg-[#f8fbfd] p-4">

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#263a51]">
                      Student Attendance
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-[#72849a]">
                      Select every student who is present. Everyone left unchecked will be marked absent.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudents(allStudents.map((student) => student.id))}
                      disabled={allStudents.length === 0}
                      className="rounded-lg border border-[#bcd8e7] bg-white px-3 py-2 text-[10px] font-bold text-[#3989b7] transition hover:bg-[#eef8fc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudents([])}
                      disabled={selectedStudents.length === 0}
                      className="rounded-lg border border-[#e0e7ed] bg-white px-3 py-2 text-[10px] font-bold text-[#667b90] transition hover:bg-[#f7fafc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#dce6ee] bg-white shadow-sm">
                  <div className="grid grid-cols-[1fr_86px] border-b border-[#e5edf3] bg-[#f6f9fb] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7b8ea3]">
                    <span>Student</span>
                    <span className="text-center">Present</span>
                  </div>
                  {!selectedSemester || !selectedSection ? (
                    <div className="flex min-h-[180px] items-center justify-center px-4 py-8">
                      <div className="max-w-md text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf7fc] text-[#3989b7]">
                          <ShieldCheck size={20} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#263a51]">
                          Student list is locked
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-[#7b8ea3]">
                          Select a semester and section to load only the students registered for that exact group.
                        </p>
                      </div>
                    </div>
                  ) : loading || refreshing ? (
                    <div className="space-y-2 p-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="flex animate-pulse items-center justify-between rounded-lg border border-[#edf1f5] bg-white px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#e9f0f5]" />
                            <div className="space-y-2">
                              <div className="h-2.5 w-32 rounded bg-[#e9f0f5]" />
                              <div className="h-2 w-44 rounded bg-[#f0f4f7]" />
                            </div>
                          </div>
                          <div className="h-5 w-5 rounded border border-[#e1e8ee] bg-[#f5f8fa]" />
                        </div>
                      ))}
                    </div>
                  ) : allStudents.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-[#7b8ea3]">
                      No students are registered for {selectedSemester} / {selectedSection}.
                    </div>
                  ) : (
                    <div className="max-h-[310px] overflow-y-auto">
                      {allStudents.map((student, index) => {
                        const checked = selectedStudents.includes(student.id);

                        return (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between gap-4 px-4 py-3 transition ${
                              index !== allStudents.length - 1
                                ? "border-b border-[#edf1f5]"
                                : ""
                            } ${
                              checked
                                ? "bg-[#f1faf5]"
                                : "bg-white hover:bg-[#fafcfe]"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf7fc] text-[11px] font-bold text-[#3989b7]">
                                {(student.name || student.email || "S")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-[#263a51]">
                                  {student.name || student.email || "Unnamed Student"}
                                </p>
                                {student.email && (
                                  <p className="mt-0.5 truncate text-[9px] text-[#7b8ea3]">
                                    {student.email}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* ONLY THE CHECKBOX CONTROLS PRESENT/ABSENT */}
                            <label
                              className="flex shrink-0 cursor-pointer items-center gap-2"
                              title={checked ? "Present" : "Absent"}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setSelectedStudents((current) =>
                                    current.includes(student.id)
                                      ? current.filter((id) => id !== student.id)
                                      : [...current, student.id]
                                  );
                                  setSaveError("");
                                  setSaveMessage("");
                                }}
                                className="h-5 w-5 cursor-pointer rounded border-[#aebfcd] text-[#31986d] accent-[#31986d] focus:ring-2 focus:ring-[#54bce5]"
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#dce7ef] bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-[#31986d]">
                    {selectedStudents.length} Present
                  </p>
                  <p className="text-[10px] font-semibold text-[#d65c5c]">
                    {Math.max(allStudents.length - selectedStudents.length, 0)} Absent
                  </p>
                  <p className="text-[10px] font-semibold text-[#7b8ea3]">
                    {allStudents.length} Total
                  </p>
                </div>

              </div>

              {/* MARK ATTENDANCE */}
              <div className="mt-4 ml-auto flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => void handleBulkMarkAttendance()}
                  disabled={saving || !selectedSemester || !selectedSection || !selectedEvent || allStudents.length === 0}
                  className="ml-auto h-11 w-auto min-w-[180px] rounded-xl bg-[#0d1728] px-6 text-xs font-bold text-white shadow-[0_8px_20px_rgba(10,27,48,0.18)] transition hover:bg-[#16273c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Mark Attendance"}
                </button>
              </div>

            </section>

            {/* =================================================
                RECORDS
            ================================================== */}

            <section className="mt-6 rounded-[20px] border border-[#d9e4ee] bg-white shadow-[0_8px_25px_rgba(30,60,90,0.06)]">

              {/* HEADER */}

              <div className="border-b border-[#e2eaf1] p-6">

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#438bb8]">
                      Records
                    </p>

                    <div className="flex items-center gap-2">
                      <h2 className="mt-1 font-serif text-[23px] font-bold text-[#142238]">
                        Attendance Records
                      </h2>

                      <button
                        type="button"
                        onClick={() => void handleRecordsRefresh()}
                        disabled={refreshing}
                        aria-label="Refresh attendance records"
                        title="Refresh attendance records"
                        className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e3ed] bg-white text-[#6f8499] transition hover:border-[#54bce5] hover:bg-[#f2fbfe] hover:text-[#3aa8d5] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RefreshCw
                          size={14}
                          className={refreshing ? "animate-spin" : ""}
                        />
                      </button>
                    </div>

                    <p className="mt-1 text-[12px] text-[#72849a]">
                      View and manage attendance records.
                    </p>

                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">

                    {/* SEARCH */}

                    <div className="relative">

                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba0b5]"
                      />

                      <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                          setSearch(
                            e.target.value
                          )
                        }
                        placeholder="Search student or event..."
                        className="h-10 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] pl-9 pr-3 text-xs text-[#24384e] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 sm:w-[230px]"
                      />

                    </div>

                    {/* DATE */}

                    <div className="relative">
                      <CalendarDays
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba0b5]"
                      />

                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) =>
                          setDateFilter(e.target.value)
                        }
                        aria-label="Filter attendance by date"
                        title="Filter attendance by date"
                        className="h-10 w-full rounded-xl border border-[#d8e3ed] bg-[#fafcfe] pl-9 pr-3 text-xs font-medium text-[#24384e] outline-none transition focus:border-[#54bce5] focus:ring-4 focus:ring-[#54bce5]/10 sm:w-[165px]"
                      />
                    </div>

                    {/* STATUS */}

                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value
                        )
                      }
                      className="h-10 rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-3 text-xs font-medium text-[#24384e] outline-none focus:border-[#54bce5]"
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

                      <option value="LATE">
                        Late
                      </option>

                      <option value="EXCUSED">
                        Excused
                      </option>

                    </select>

                    {/* EVENT */}

                    <select
                      value={eventFilter}
                      onChange={(e) =>
                        setEventFilter(
                          e.target.value
                        )
                      }
                      className="h-10 max-w-[220px] rounded-xl border border-[#d8e3ed] bg-[#fafcfe] px-3 text-xs font-medium text-[#24384e] outline-none focus:border-[#54bce5]"
                    >

                      <option value="ALL">
                        All Events
                      </option>

                      {events.map(
                        (event) => (
                          <option
                            key={
                              event.id
                            }
                            value={
                              event.id
                            }
                          >
                            {event.title}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

              </div>

              {/* LOADING */}

              {loading ? (

                <div className="flex min-h-[330px] items-center justify-center">

                  <div className="flex items-center gap-3 text-sm text-[#72849a]">

                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dce6ee] border-t-[#54bce5]" />

                    Loading attendance records...

                  </div>

                </div>

              ) : !recordsViewEnabled ? (

                /* DEFAULT EMPTY STATE */

                <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#d8edf7] bg-gradient-to-br from-[#f5fbfe] to-[#eaf7fc] text-[#55a9d2] shadow-sm">

                    <ClipboardCheck
                      size={34}
                      strokeWidth={1.5}
                    />

                    <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-[#62b9df] text-white shadow-sm">

                      <CalendarDays
                        size={13}
                        strokeWidth={2.2}
                      />

                    </span>

                  </div>

                  <h3 className="mt-5 font-serif text-[20px] font-bold text-[#142238]">
                    View Attendance Records
                  </h3>

                  <p className="mt-2 max-w-md text-[12px] leading-5 text-[#71859a]">
                    Select a date and an event above to view
                    attendance records for that session.
                  </p>

                  <div className="mt-4 flex items-center gap-2 rounded-full border border-[#dcecf4] bg-[#f7fcfe] px-4 py-2 text-[10px] font-semibold text-[#4e91b3]">

                    <CalendarDays size={13} />

                    Choose date

                    <span className="text-[#aac1d0]">
                      •
                    </span>

                    <ClipboardCheck size={13} />

                    Choose event

                  </div>

                </div>

              ) : filteredAttendance.length === 0 ? (

                /* FILTERED EMPTY STATE */

                <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#e5a04a]">

                    <ClipboardCheck
                      size={28}
                      strokeWidth={1.5}
                    />

                  </div>

                  <h3 className="mt-4 font-serif text-[18px] font-bold text-[#142238]">
                    No attendance records found
                  </h3>

                  <p className="mt-2 max-w-md text-xs leading-5 text-[#7b8ea3]">
                    No attendance record matches the selected
                    date, event, and current filters.
                  </p>

                </div>

              ) : (

                /* TABLE */

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px]">

                    <thead>

                      <tr className="border-b border-[#e7edf3] bg-[#fafcfe]">

                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#73879c]">
                          Student
                        </th>

                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#73879c]">
                          Event
                        </th>

                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#73879c]">
                          Date
                        </th>

                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#73879c]">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#73879c]">
                          Actions
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-[#edf1f5]">

                      {filteredAttendance.map(
                        (record) => {

                          const studentName =
                            record.user?.name ||
                            "Unknown Student";

                          const studentEmail =
                            record.user?.email ||
                            "No email";

                          const eventTitle =
                            record.event?.title ||
                            "Unknown Event";

                          const status =
                            record.status ||
                            "Present";

                          const statusUpper =
                            status.toUpperCase();

                          const statusClass =
                            statusUpper ===
                            "PRESENT"
                              ? "border-[#bde4cf] bg-[#f1faf5] text-[#31986d]"
                              : statusUpper ===
                                  "ABSENT"
                                ? "border-red-200 bg-red-50 text-red-600"
                                : statusUpper ===
                                    "LATE"
                                  ? "border-amber-200 bg-amber-50 text-amber-600"
                                  : "border-[#cbddec] bg-[#f1f6fa] text-[#55718a]";

                          return (
                            <tr
                              key={
                                record.id
                              }
                              className="transition hover:bg-[#fbfdff]"
                            >

                              {/* STUDENT */}

                              <td className="px-6 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8f5fb] text-[12px] font-bold text-[#4b9bc3]">

                                    {record.user
                                      ?.profileImage ? (

                                      <img
                                        src={
                                          record.user
                                            .profileImage
                                        }
                                        alt={
                                          studentName
                                        }
                                        className="h-full w-full object-cover"
                                      />

                                    ) : (

                                      studentName
                                        .charAt(
                                          0
                                        )
                                        .toUpperCase()

                                    )}

                                  </div>

                                  <div className="min-w-0">

                                    <p className="max-w-[230px] truncate text-[12px] font-bold text-[#18283d]">
                                      {
                                        studentName
                                      }
                                    </p>

                                    <p className="mt-0.5 max-w-[230px] truncate text-[10px] text-[#7a8da1]">
                                      {
                                        studentEmail
                                      }
                                    </p>

                                  </div>

                                </div>

                              </td>

                              {/* EVENT */}

                              <td className="px-6 py-4">

                                <div>

                                  <p className="max-w-[230px] truncate text-[12px] font-semibold text-[#263a51]">
                                    {
                                      eventTitle
                                    }
                                  </p>

                                  {record.event
                                    ?.club
                                    ?.name && (
                                    <p className="mt-0.5 text-[10px] text-[#8497aa]">
                                      {
                                        record
                                          .event
                                          .club
                                          .name
                                      }
                                    </p>
                                  )}

                                </div>

                              </td>

                              {/* DATE */}

                              <td className="px-6 py-4">

                                <div>

                                  <p className="text-[11px] font-semibold text-[#354b63]">
                                    {formatDate(
                                      record.markedAt
                                    )}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-[#8497aa]">
                                    {formatTime(
                                      record.markedAt
                                    )}
                                  </p>

                                </div>

                              </td>

                              {/* STATUS */}

                              <td className="px-6 py-4">

                                {editingId ===
                                record.id ? (

                                  <select
                                    value={
                                      editingStatus
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setEditingStatus(
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                    className="h-9 rounded-lg border border-[#d8e3ed] bg-white px-2 text-xs font-semibold text-[#263a51] outline-none focus:border-[#54bce5]"
                                  >

                                    <option value="Present">
                                      Present
                                    </option>

                                    <option value="Absent">
                                      Absent
                                    </option>

                                    <option value="Late">
                                      Late
                                    </option>

                                    <option value="Excused">
                                      Excused
                                    </option>

                                  </select>

                                ) : (

                                  <span
                                    className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold ${statusClass}`}
                                  >
                                    {
                                      status
                                    }
                                  </span>

                                )}

                              </td>

                              {/* ACTIONS */}

                              <td className="px-6 py-4">

                                <div className="flex justify-end gap-2">

                                  {editingId ===
                                  record.id ? (

                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleUpdateAttendance(
                                            record.id
                                          )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d1728] text-white transition hover:bg-[#1b3048]"
                                        title="Save"
                                      >

                                        <Save
                                          size={15}
                                        />

                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingId(
                                            null
                                          );
                                          setEditingStatus(
                                            "Present"
                                          );
                                        }}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e3ed] bg-white text-[#70849a] transition hover:bg-[#f5f8fb]"
                                        title="Cancel"
                                      >

                                        <X
                                          size={15}
                                        />

                                      </button>
                                    </>

                                  ) : (

                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingId(
                                            record.id
                                          );
                                          setEditingStatus(
                                            record.status ||
                                              "Present"
                                          );
                                        }}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e3ed] bg-white text-[#5c7690] transition hover:border-[#9bcbe4] hover:bg-[#f3f9fd] hover:text-[#3989b7]"
                                        title="Edit"
                                      >

                                        <Edit3
                                          size={15}
                                        />

                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          deletingId ===
                                          record.id
                                        }
                                        onClick={() =>
                                          void handleDeleteAttendance(
                                            record.id
                                          )
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        title="Delete"
                                      >

                                        {deletingId ===
                                        record.id ? (

                                          <RefreshCw
                                            size={15}
                                            className="animate-spin"
                                          />

                                        ) : (

                                          <Trash2
                                            size={15}
                                          />

                                        )}

                                      </button>
                                    </>

                                  )}

                                </div>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

            <div className="h-10" />

          </div>

        </main>

      </div>

    </div>
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(new Date(value));
  } catch {
    return "—";
  }
}

function formatTime(
  value?: string
) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(value));
  } catch {
    return "—";
  }
}

/* =========================================================
   STAT CARD
========================================================= */

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ElementType;
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="group min-w-0 rounded-[19px] border border-[#d8e3ed] bg-white p-4 shadow-[0_7px_22px_rgba(30,60,90,0.055)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b9d8e9] hover:shadow-[0_12px_28px_rgba(30,70,100,0.09)]">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="text-[11px] font-medium text-[#687c93]">
            {title}
          </p>

          <p className="mt-2 font-serif text-[25px] font-bold leading-none text-[#0b1728]">
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7fc] text-[#53a7d4] transition-colors duration-200 group-hover:bg-[#54bce5] group-hover:text-white">

          <Icon
            size={18}
            strokeWidth={1.8}
          />

        </div>

      </div>

      <p className="mt-4 text-[10px] leading-5 text-[#7890a8]">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: ElementType;
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <div className="w-full min-w-0 rounded-[20px] border border-[#d8e3ed] bg-white p-5 text-left shadow-[0_7px_22px_rgba(30,60,90,0.05)]">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[11px] font-medium text-[#687c93]">
            {title}
          </p>

          <p className="mt-2 font-serif text-[27px] font-bold leading-none text-[#0b1728]">
            {value}
          </p>

          <p className="mt-2 text-[10px] text-[#7890a8]">
            {description}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7fc] text-[#4ba4d2]">

          <Icon
            size={20}
            strokeWidth={1.8}
          />

        </div>

      </div>

    </div>
  );
}