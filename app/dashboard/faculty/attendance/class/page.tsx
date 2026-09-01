"use client";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Edit3,
  GraduationCap,
  LogOut,
  Menu,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

type FacultyUser = {
  id?: string;
  name?: string;
  email?: string;
  campusUserId?: string | null;
  role?: string;
  approvalStatus?: string;
};

let facultyUserRawCache: string | null | undefined;
let facultyUserCache: FacultyUser | null = null;

function subscribeToFacultyUser(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getFacultyUserSnapshot(): FacultyUser | null {
  try {
    const raw = localStorage.getItem("user");

    if (raw === facultyUserRawCache) {
      return facultyUserCache;
    }

    facultyUserRawCache = raw;

    if (!raw) {
      facultyUserCache = null;
      return facultyUserCache;
    }

    const parsed = JSON.parse(raw) as FacultyUser;
    facultyUserCache =
      String(parsed.role || "").toUpperCase() === "FACULTY"
        ? parsed
        : null;

    return facultyUserCache;
  } catch {
    facultyUserRawCache = null;
    facultyUserCache = null;
    return null;
  }
}

type Student = {
  id: string;
  campusUserId?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  approvalStatus?: string | null;
  profileImage?: string | null;
};

type SubjectItem = {
  id: string;
  name: string;
  semester: number;
};

type ClassAttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  subjectId: string;
  status: string;
  markedAt: string;
  updatedAt?: string;
  student?: Student | null;
  subject?: SubjectItem | null;
  session?: {
    id: string;
    facultyId: string;
    subjectId: string;
    semester: number;
    section: string;
    sessionDate: string;
  } | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  attendance?: ClassAttendanceRecord[];
  students?: Student[];
  subjects?: SubjectItem[];
  count?: number;
};

const navigation = [
  { title: "Dashboard", href: "/dashboard/faculty", icon: GraduationCap },
  { title: "Students", href: "/students", icon: Users },
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
  { title: "Events", href: "/events", icon: CalendarDays },
  { title: "Faculty Profile", href: "/faculty/profile", icon: UserCircle },
];

const accountNavigation = [
  { title: "Account Security", href: "/faculty/security", icon: ShieldCheck },
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

function semesterNumber(value: string) {
  return Number(value.match(/\d+/)?.[0] || 0);
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocalDateKey(value: string) {
  if (!value) return "";

  // A date input already has the exact YYYY-MM-DD value we need.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // For ISO timestamps, convert to the browser's local calendar date.
  // Do not use value.slice(0, 10), because UTC serialization can move a
  // midnight class session to the previous calendar day.
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "present") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "late") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized === "excused") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border-red-200 bg-red-50 text-red-600";
}

export default function FacultyAttendancePage() {
  const router = useRouter();

  const user = useSyncExternalStore(
    subscribeToFacultyUser,
    getFacultyUserSnapshot,
    () => null
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [attendanceMenuOpen, setAttendanceMenuOpen] = useState(true);

  const [attendance, setAttendance] = useState<ClassAttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [showingHistory, setShowingHistory] = useState(false);


  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Present");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState("Present");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) return;

    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("facultyUser");
      localStorage.removeItem("faculty");
      localStorage.removeItem("currentFaculty");
      localStorage.removeItem("facultyToken");
    } catch {
      // Ignore storage cleanup errors before redirecting.
    }

    router.replace("/faculty/login");
  }, [router, user]);

  const token = () => {
    try {
      return localStorage.getItem("token") || localStorage.getItem("facultyToken") || "";
    } catch {
      return "";
    }
  };

  const requestHeaders = (): HeadersInit => {
    const value = token();
    return value ? { Authorization: `Bearer ${value}` } : {};
  };

  async function readResponse(response: Response): Promise<ApiResponse> {
    try {
      return (await response.json()) as ApiResponse;
    } catch {
      return {};
    }
  }

  async function fetchData(
    semester = selectedSemester,
    section = selectedSection,
    subjectId = selectedSubject,
    date = ""
  ): Promise<ApiResponse> {
    const params = new URLSearchParams();

    if (semester) params.set("semester", semester);
    if (section) params.set("section", section);
    if (subjectId) params.set("subjectId", subjectId);
    if (date) params.set("date", date);

    const query = params.toString();
    const url = query
      ? `/api/faculty/attendance/class?${query}`
      : "/api/faculty/attendance/class";

    const response = await fetch(url, {
      method: "GET",
      headers: requestHeaders(),
      credentials: "include",
      cache: "no-store",
    });

    const data = await readResponse(response);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load class attendance.");
    }

    return data;
  }

  function applyLoadedData(data: ApiResponse) {
    setAttendance(Array.isArray(data.attendance) ? data.attendance : []);
    setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
    setStudents(
      selectedSemester && selectedSection && selectedSubject
        ? Array.isArray(data.students)
          ? data.students
          : []
        : []
    );
  }

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const data = await fetchData();
        if (cancelled) return;
        applyLoadedData(data);
        setError("");
      } catch (loadError) {
        if (cancelled) return;
        console.error("FACULTY CLASS ATTENDANCE LOAD ERROR:", loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load class attendance."
        );
        setAttendance([]);
        setStudents([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // The fetch must run when the selected class changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester, selectedSection, selectedSubject]);

  const filteredSubjectOptions = useMemo(() => {
    const sem = semesterNumber(selectedSemester);
    if (!sem) return [];
    return subjects
      .filter((subject) => Number(subject.semester) === sem)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subjects, selectedSemester]);


  const filteredAttendance = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attendance.filter((record) => {
      const studentName = record.student?.name || "";
      const studentId = record.student?.campusUserId || "";
      const studentEmail = record.student?.email || "";
      const subjectName = record.subject?.name || "";

      const matchesSearch =
        !query ||
        studentName.toLowerCase().includes(query) ||
        studentId.toLowerCase().includes(query) ||
        studentEmail.toLowerCase().includes(query) ||
        subjectName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        record.status.toUpperCase() === statusFilter;

      const recordSessionDate = getLocalDateKey(
        record.session?.sessionDate || record.markedAt
      );

      const matchesDate =
        recordSessionDate === dateFilter;

      // The selected Semester, Section and Subject above are reused for history.
      // This avoids selecting the same class details a second time.
      const matchesSelectedSemester =
        !selectedSemester ||
        record.session?.semester === semesterNumber(selectedSemester);

      const matchesSelectedSection =
        !selectedSection ||
        record.session?.section === selectedSection;

      const matchesSelectedSubject =
        !selectedSubject ||
        record.subjectId === selectedSubject;

      return (
        showingHistory &&
        matchesSearch &&
        matchesStatus &&
        matchesDate &&
        matchesSelectedSemester &&
        matchesSelectedSection &&
        matchesSelectedSubject
      );
    });
  }, [
    attendance,
    search,
    statusFilter,
    dateFilter,
    selectedSemester,
    selectedSection,
    selectedSubject,
    showingHistory,
  ]);

  const presentCount = useMemo(
    () => filteredAttendance.filter((record) => record.status.toLowerCase() === "present").length,
    [filteredAttendance]
  );

  const absentCount = useMemo(
    () => filteredAttendance.filter((record) => record.status.toLowerCase() === "absent").length,
    [filteredAttendance]
  );

  const allSelected =
    students.length > 0 &&
    students.every((student) => selectedStudents.includes(student.id));

  function toggleStudent(studentId: string) {
    setSelectedStudents((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  }

  function toggleAllStudents() {
    if (allSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((student) => student.id));
    }
  }

  function clearClassSelection() {
    setSelectedSemester("");
    setSelectedSection("");
    setSelectedSubject("");
    setSelectedStudents([]);
    setShowingHistory(false);
  }

  async function refreshData() {
    setRefreshing(true);
    setError("");

    try {
      const data = await fetchData(
        selectedSemester,
        selectedSection,
        selectedSubject,
        showingHistory ? dateFilter : ""
      );
      applyLoadedData(data);
    } catch (refreshError) {
      console.error("FACULTY CLASS ATTENDANCE REFRESH ERROR:", refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh class attendance."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleShowHistory() {
    setSaveError("");
    setSaveMessage("");

    if (!selectedSemester || !selectedSection || !selectedSubject) {
      setSaveError(
        "Select semester, section and subject above first."
      );
      return;
    }

    if (!dateFilter) {
      setSaveError(
        "Select a date in Attendance History first."
      );
      return;
    }

    setRefreshing(true);
    setError("");

    try {
      const data = await fetchData(
        selectedSemester,
        selectedSection,
        selectedSubject,
        dateFilter
      );

      applyLoadedData(data);
      setShowingHistory(true);
    } catch (showError) {
      console.error(
        "SHOW CLASS ATTENDANCE HISTORY ERROR:",
        showError
      );

      setSaveError(
        showError instanceof Error
          ? showError.message
          : "Unable to show attendance history."
      );

      setShowingHistory(false);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleMarkAttendance() {
    setSaveError("");
    setSaveMessage("");

    if (!selectedSemester || !selectedSection || !selectedSubject) {
      setSaveError("Select semester, section and subject first.");
      return;
    }

    if (students.length === 0) {
      setSaveError("No registered students found for this class.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/faculty/attendance/class", {
        method: "POST",
        headers: {
          ...requestHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          semester: selectedSemester,
          section: selectedSection,
          subjectId: selectedSubject,
          presentStudentIds: selectedStudents,
          status: selectedStatus,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save class attendance.");
      }

      setSaveMessage(
        `Attendance marked successfully for ${students.length} registered student${students.length === 1 ? "" : "s"}.`
      );
      setSelectedStudents([]);
      await refreshData();
    } catch (saveErrorValue) {
      console.error("MARK CLASS ATTENDANCE ERROR:", saveErrorValue);
      setSaveError(
        saveErrorValue instanceof Error
          ? saveErrorValue.message
          : "Unable to save class attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateAttendance(id: string) {
    setSaveError("");
    setSaveMessage("");

    try {
      const response = await fetch(`/api/faculty/attendance/class/${id}`, {
        method: "PUT",
        headers: {
          ...requestHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ status: editingStatus }),
      });

      const data = await readResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update attendance.");
      }

      setEditingId(null);
      setEditingStatus("Present");
      setSaveMessage("Attendance updated successfully.");
      await refreshData();
    } catch (updateError) {
      console.error("UPDATE CLASS ATTENDANCE ERROR:", updateError);
      setSaveError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update attendance."
      );
    }
  }

  async function handleDeleteAttendance(id: string) {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) {
      return;
    }

    setDeletingId(id);
    setSaveError("");
    setSaveMessage("");

    try {
      const response = await fetch(`/api/faculty/attendance/class/${id}`, {
        method: "DELETE",
        headers: requestHeaders(),
        credentials: "include",
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete attendance.");
      }

      setSaveMessage("Attendance deleted successfully.");
      await refreshData();
    } catch (deleteError) {
      console.error("DELETE CLASS ATTENDANCE ERROR:", deleteError);
      setSaveError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete attendance."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (logoutError) {
      console.error("FACULTY LOGOUT ERROR:", logoutError);
    }

    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("facultyUser");
      localStorage.removeItem("faculty");
      localStorage.removeItem("currentFaculty");
      localStorage.removeItem("facultyToken");
    } catch (storageError) {
      console.error("FACULTY STORAGE CLEANUP ERROR:", storageError);
    }

    router.replace("/faculty/login");
  }

  const facultyName = user?.name || "Faculty Member";
  const facultyId = user?.campusUserId || "Faculty";
  const initials = facultyName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FM";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef4fa] text-[#0d1728]">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#07111f]/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] border-r border-[#1b3048] bg-[#091321] text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#54bce5] text-[#07111f]">
              <GraduationCap size={23} />
            </div>
            <div>
              <p className="font-serif text-xl font-bold tracking-tight">CampusConnect</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#91a5ba]">Faculty Portal</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f8499]">
              Main Menu
            </p>

            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isAttendance = item.title === "Attendance";

                if (isAttendance) {
                  return (
                    <div key={item.title}>
                      <button
                        type="button"
                        onClick={() => setAttendanceMenuOpen((value) => !value)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#9db0c3] transition hover:bg-white/5 hover:text-white"
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={17} />
                          Attendance
                        </span>
                        <ChevronRight
                          size={15}
                          className={`transition-transform ${attendanceMenuOpen ? "rotate-90" : ""}`}
                        />
                      </button>

                      {attendanceMenuOpen && (
                        <div className="ml-5 border-l border-white/10 pl-3">
                          <Link
                            href="/dashboard/faculty/attendance/class"
                            className="block rounded-lg bg-[#18263a] px-3 py-2.5 text-xs font-semibold text-[#d9ecfa]"
                            onClick={() => setMobileSidebarOpen(false)}
                          >
                            Mark Class Attendance
                          </Link>
                          <Link
                            href="/dashboard/faculty/attendance/event"
                            className="mt-1 block rounded-lg px-3 py-2.5 text-xs font-medium text-[#8ea3b8] transition hover:bg-white/5 hover:text-white"
                            onClick={() => setMobileSidebarOpen(false)}
                          >
                            Mark Event Attendance
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#9db0c3] transition hover:bg-white/5 hover:text-white"
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <Icon size={17} />
                    {item.title}
                  </Link>
                );
              })}
            </div>

            <p className="mb-3 mt-8 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f8499]">
              Account
            </p>
            {accountNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#9db0c3] transition hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <Icon size={17} />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#54bce5] text-sm font-bold text-[#07111f]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{facultyName}</p>
                <p className="truncate text-[10px] text-[#8497aa]">{user?.email || "Faculty"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#9db0c3] transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={17} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-[#d8e3ed] bg-white/95 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e3ed] text-[#3e5870] lg:hidden"
            >
              <Menu size={19} />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4b8bad]">Faculty Portal</p>
              <p className="text-xs text-[#7890a5]">Attendance management workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e3ed] bg-white text-[#5d7890]">
              <Bell size={18} />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e3ed] bg-white text-[#5d7890]">
              <Settings size={18} />
            </button>
            <div className="hidden h-9 w-px bg-[#d8e3ed] sm:block" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#72c5e9] text-xs font-bold text-[#08304a]">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-[#263a51]">{facultyName}</p>
                <p className="text-[10px] uppercase tracking-wide text-[#8497aa]">Faculty</p>
              </div>
            </div>
          </div>
        </header>

        <section className="px-4 py-5 lg:px-7 lg:py-6">
          <div className="relative overflow-hidden rounded-[24px] bg-[#101b2d] px-6 py-8 text-white shadow-sm lg:px-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#54bce5]/20" />
            <div className="pointer-events-none absolute -right-3 top-12 h-40 w-40 rounded-full border border-[#54bce5]/10" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#54bce5]/30 bg-[#54bce5]/10 px-3 py-1.5 text-[10px] font-bold text-[#9dddf8]">
                <ClipboardCheck size={13} />
                Faculty Attendance
              </div>
              <h1 className="font-serif text-4xl font-bold tracking-tight lg:text-5xl">Class Attendance</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#a9bbcc]">
                Record, update and monitor attendance for registered students by semester, section and subject.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">
                  <CheckCircle2 size={13} /> Attendance Active
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-[#c6d4e0]">
                  Faculty ID: {facultyId}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              <p className="text-sm font-bold">Unable to load attendance</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          )}

          {saveError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              <p className="text-sm font-bold">Attendance action failed</p>
              <p className="mt-1 text-xs">{saveError}</p>
            </div>
          )}

          {saveMessage && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
              <p className="text-sm font-bold">{saveMessage}</p>
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#d8e3ed] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d92a7]">Students</p>
              <p className="mt-2 text-3xl font-bold text-[#17283b]">{students.length}</p>
              <p className="mt-1 text-[10px] text-[#8ca0b2]">Registered students for selected class</p>
            </div>
            <div className="rounded-2xl border border-[#d8e3ed] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d92a7]">Attendance Records</p>
              <p className="mt-2 text-3xl font-bold text-[#17283b]">{filteredAttendance.length}</p>
              <p className="mt-1 text-[10px] text-[#8ca0b2]">Class attendance records</p>
            </div>
            <div className="rounded-2xl border border-[#d8e3ed] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d92a7]">Present</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{presentCount}</p>
              <p className="mt-1 text-[10px] text-[#8ca0b2]">Students marked present</p>
            </div>
            <div className="rounded-2xl border border-[#d8e3ed] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d92a7]">Absent</p>
              <p className="mt-2 text-3xl font-bold text-red-500">{absentCount}</p>
              <p className="mt-1 text-[10px] text-[#8ca0b2]">Students marked absent</p>
            </div>
          </div>

          <section className="mt-5 rounded-[22px] border border-[#d8e3ed] bg-white p-5 shadow-sm lg:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4b8bad]">Attendance Entry</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#17283b]">Mark Class Attendance</h2>
                <p className="mt-1 text-xs text-[#7d92a7]">
                  Select semester, section and subject. Every registered student is shown; checked students are marked present and unchecked students are marked absent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refreshData()}
                disabled={refreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e3ed] bg-white px-4 text-xs font-bold text-[#46627b] transition hover:bg-[#f5f8fb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-4">
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#6f8499]">Semester</span>
                <select
                  value={selectedSemester}
                  onChange={(event) => {
                    setSelectedSemester(event.target.value);
                    setSelectedSubject("");
                    setSelectedStudents([]);
                    setShowingHistory(false);
                  }}
                  className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-white px-3 text-sm font-semibold text-[#263a51] outline-none focus:border-[#54bce5]"
                >
                  <option value="">Select semester</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#6f8499]">Section</span>
                <select
                  value={selectedSection}
                  onChange={(event) => {
                    setSelectedSection(event.target.value);
                    setSelectedStudents([]);
                    setShowingHistory(false);
                  }}
                  className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-white px-3 text-sm font-semibold text-[#263a51] outline-none focus:border-[#54bce5]"
                >
                  <option value="">Select section</option>
                  {sectionOptions.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#6f8499]">Subject</span>
                <select
                  value={selectedSubject}
                  disabled={!selectedSemester}
                  onChange={(event) => {
                    setSelectedSubject(event.target.value);
                    setSelectedStudents([]);
                    setShowingHistory(false);
                  }}
                  className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-white px-3 text-sm font-semibold text-[#263a51] outline-none focus:border-[#54bce5] disabled:cursor-not-allowed disabled:bg-[#f4f7fa] disabled:text-[#9aacbb]"
                >
                  <option value="">
                    {selectedSemester ? "Select subject" : "Select semester first"}
                  </option>
                  {filteredSubjectOptions.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#6f8499]">Status for checked students</span>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8e3ed] bg-white px-3 text-sm font-semibold text-[#263a51] outline-none focus:border-[#54bce5]"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Excused">Excused</option>
                </select>
              </label>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#d8e3ed]">
              <div className="flex flex-col justify-between gap-3 border-b border-[#d8e3ed] bg-[#f8fafc] px-4 py-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4b6279]">Student Attendance</p>
                  <p className="mt-1 text-[10px] text-[#8ca0b2]">
                    {selectedSemester && selectedSection && selectedSubject
                      ? `${students.length} registered student${students.length === 1 ? "" : "s"} found for this exact semester, section and subject.`
                      : "Select semester, section and subject to load registered students."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleAllStudents}
                    disabled={students.length === 0}
                    className="rounded-lg border border-[#cfdde8] bg-white px-3 py-2 text-[10px] font-bold text-[#547089] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {allSelected ? "Clear All" : "Select All"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudents([])}
                    disabled={selectedStudents.length === 0}
                    className="rounded-lg border border-[#cfdde8] bg-white px-3 py-2 text-[10px] font-bold text-[#547089] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-[430px] overflow-y-auto">
                {loading ? (
                  <div className="px-5 py-14 text-center text-sm text-[#7890a5]">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="px-5 py-14 text-center">
                    <Users className="mx-auto text-[#8ca0b2]" size={24} />
                    <p className="mt-2 text-sm font-semibold text-[#4b6279]">No registered students found.</p>
                    <p className="mt-1 text-xs text-[#8ca0b2]">Select the exact semester, section and subject.</p>
                  </div>
                ) : (
                  students.map((student) => {
                    const checked = selectedStudents.includes(student.id);
                    return (
                      <label
                        key={student.id}
                        className="flex cursor-pointer items-center justify-between gap-4 border-b border-[#edf2f6] px-4 py-3 transition last:border-b-0 hover:bg-[#f8fbfd]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(student.id)}
                            className="h-4 w-4 rounded border-[#b7c9d8] text-[#54bce5] focus:ring-[#54bce5]"
                          />
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f5fb] text-xs font-bold text-[#3989b7]">
                            {(student.name || "S").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[#263a51]">{student.name || "Unnamed Student"}</p>
                            <p className="truncate text-[10px] text-[#8497aa]">
                              {student.campusUserId || student.email || student.id}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                          {checked ? selectedStatus : "Absent"}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-[#d8e3ed] bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold text-[#263a51]">
                  {selectedStudents.length} of {students.length} student{students.length === 1 ? "" : "s"} selected as {selectedStatus.toLowerCase()}.
                </p>
                <p className="mt-1 text-[10px] text-[#8497aa]">
                  Unchecked registered students will be saved as Absent for this class session.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearClassSelection}
                  className="h-11 rounded-xl border border-[#d8e3ed] bg-white px-5 text-xs font-bold text-[#5b748c] hover:bg-[#f3f7fa]"
                >
                  Clear Class
                </button>
                <button
                  type="button"
                  onClick={() => void handleMarkAttendance()}
                  disabled={
                    saving ||
                    !selectedSemester ||
                    !selectedSection ||
                    !selectedSubject ||
                    students.length === 0
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#102038] px-6 text-xs font-bold text-white transition hover:bg-[#1b3048] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {saving ? "Saving..." : "Mark Attendance"}
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[22px] border border-[#d8e3ed] bg-white p-5 shadow-sm lg:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4b8bad]">Class Records</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#17283b]">Attendance History</h2>
                <p className="mt-1 text-xs text-[#7d92a7]">Select the semester, section and subject above, then choose a date here to find and correct attendance records. Event attendance is handled separately.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDateFilter("");
                  setStatusFilter("ALL");
                  setShowingHistory(false);
                  void refreshData();
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e3ed] bg-white px-4 text-xs font-bold text-[#46627b]"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_190px_170px_auto_auto]">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba0b5]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, ID, email or subject..."
                  className="h-10 w-full rounded-xl border border-[#d8e3ed] bg-white pl-9 pr-3 text-xs text-[#263a51] outline-none focus:border-[#54bce5]"
                />
              </div>

              <input
                type="date"
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value);
                  setShowingHistory(false);
                }}
                className="h-10 rounded-xl border border-[#d8e3ed] bg-white px-3 text-xs font-semibold text-[#263a51] outline-none focus:border-[#54bce5]"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-xl border border-[#d8e3ed] bg-white px-3 text-xs font-semibold text-[#263a51] outline-none focus:border-[#54bce5]"
              >
                <option value="ALL">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
              </select>

              <button
                type="button"
                onClick={() => void handleShowHistory()}
                disabled={
                  refreshing ||
                  !selectedSemester ||
                  !selectedSection ||
                  !selectedSubject ||
                  !dateFilter
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#102038] px-5 text-xs font-bold text-white transition hover:bg-[#1b3048] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                {refreshing ? "Loading..." : "Show"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDateFilter("");
                  setStatusFilter("ALL");
                  setShowingHistory(false);
                }}
                className="h-10 rounded-xl border border-[#d8e3ed] bg-white px-4 text-xs font-bold text-[#647e95] hover:bg-[#f5f8fb]"
              >
                Clear
              </button>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-[#d8e3ed]">
              <table className="min-w-[920px] w-full border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-left">
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f8499]">Student</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f8499]">Subject</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f8499]">Class</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f8499]">Date</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f8499]">Status</th>
                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f8499]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <ClipboardCheck className="mx-auto text-[#9ab0c0]" size={25} />
                        <p className="mt-2 text-sm font-semibold text-[#536d84]">No class attendance records found</p>
                        <p className="mt-1 text-xs text-[#8ca0b2]">Select semester, section, subject and date to quickly find the exact class attendance record.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => {
                      const status = record.status || "Absent";
                      return (
                        <tr key={record.id} className="border-t border-[#edf2f6] hover:bg-[#fbfdff]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f5fb] text-xs font-bold text-[#3989b7]">
                                {(record.student?.name || "S").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-[#263a51]">{record.student?.name || "Unknown Student"}</p>
                                <p className="truncate text-[10px] text-[#8497aa]">{record.student?.campusUserId || record.student?.email || record.studentId}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-[#354b63]">{record.subject?.name || "Unknown Subject"}</p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-[#354b63]">
                              Semester {record.session?.semester ?? "—"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[#8497aa]">
                              {record.session?.section || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-[11px] font-semibold text-[#354b63]">{formatDate(record.session?.sessionDate || record.markedAt)}</p>
                            <p className="mt-0.5 text-[10px] text-[#8497aa]">{formatTime(record.session?.sessionDate || record.markedAt)}</p>
                          </td>

                          <td className="px-5 py-4">
                            {editingId === record.id ? (
                              <select
                                value={editingStatus}
                                onChange={(event) => setEditingStatus(event.target.value)}
                                className="h-9 rounded-lg border border-[#d8e3ed] bg-white px-2 text-xs font-semibold text-[#263a51] outline-none focus:border-[#54bce5]"
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                                <option value="Excused">Excused</option>
                              </select>
                            ) : (
                              <span className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusClass(status)}`}>
                                {status}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {editingId === record.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void handleUpdateAttendance(record.id)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d1728] text-white hover:bg-[#1b3048]"
                                    title="Save"
                                  >
                                    <Save size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingStatus("Present");
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e3ed] bg-white text-[#70849a] hover:bg-[#f5f8fb]"
                                    title="Cancel"
                                  >
                                    <X size={15} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingId(record.id);
                                      setEditingStatus(record.status || "Present");
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e3ed] bg-white text-[#5c7690] hover:border-[#9bcbe4] hover:bg-[#f3f9fd] hover:text-[#3989b7]"
                                    title="Edit"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deletingId === record.id}
                                    onClick={() => void handleDeleteAttendance(record.id)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Delete"
                                  >
                                    {deletingId === record.id ? (
                                      <RefreshCw size={15} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={15} />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}