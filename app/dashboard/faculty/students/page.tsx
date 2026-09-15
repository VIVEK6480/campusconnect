"use client";

import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Edit3,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  UserCircle,
  Users,
  X,
  Trophy,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ============================================================
   TYPES
============================================================ */

type Subject = {
  id: string;
  name: string;
  semester: number;
};

type Registration = {
  id: string;
  semester: number;
  section: string;
  createdAt: string;
  subject: Subject;
};

type Certificate = {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
};

type Membership = {
  id: string;
  joinedAt: string;
  club: {
    id: string;
    name: string;
    description: string;
    category: string | null;
    logo: string | null;
  };
};

type ClassAttendance = {
  id: string;
  status: string;
  markedAt: string;
  updatedAt: string;
  subjectId: string;
  subject: Subject;
  session: {
    id: string;
    semester: number;
    section: string;
    sessionDate: string;
    faculty: {
      id: string;
      name: string;
      email: string;
    };
  };
};

type EventAttendance = {
  id: string;
  status: string;
  markedAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    description: string;
    venue: string;
    eventDate: string;
    image: string | null;
    club: {
      id: string;
      name: string;
    };
  };
};

type StudentStatistics = {
  subjectCount: number;
  classAttendanceTotal: number;
  classAttendancePresent: number;
  classAttendanceAbsent: number;
  classAttendancePercentage: number;
  eventAttendanceTotal: number;
  eventAttendancePresent: number;
  certificateCount: number;
  clubCount: number;
};

type Student = {
  id: string;
  campusUserId: string | null;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
  approvalStatus: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;

  department: string | null;
  designation: string | null;
  phone: string | null;
  qualification: string | null;
  specialization: string | null;
  joiningDate: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  officeRoom: string | null;
  officeHours: string | null;

  studentRegistrations: Registration[];
  classAttendances: ClassAttendance[];
  attendances: EventAttendance[];
  certificates: Certificate[];
  memberships: Membership[];

  statistics: StudentStatistics;
};

type Faculty = {
  id: string;
  name: string;
  email: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  students?: Student[];
};

type DeleteResponse = {
  success?: boolean;
  message?: string;
};

type EditForm = {
  name: string;
  email: string;
  campusUserId: string;
  phone: string;
  department: string;
  qualification: string;
  specialization: string;
  address: string;
  city: string;
  state: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const SECTIONS = ["A", "B", "C", "D"];

const defaultStatistics: StudentStatistics = {
  subjectCount: 0,
  classAttendanceTotal: 0,
  classAttendancePresent: 0,
  classAttendanceAbsent: 0,
  classAttendancePercentage: 0,
  eventAttendanceTotal: 0,
  eventAttendancePresent: 0,
  certificateCount: 0,
  clubCount: 0,
};

/* ============================================================
   STORAGE
============================================================ */

function getStoredFaculty(): Faculty | null {
  if (typeof window === "undefined") {
    return null;
  }

  const keys = [
    "facultyUser",
    "faculty",
    "currentFaculty",
    "user",
  ];

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (!value) {
      continue;
    }

    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;

      const role = String(parsed.role ?? "")
        .trim()
        .toUpperCase();

      if (role === "FACULTY" && parsed.id) {
        return {
          id: String(parsed.id),
          name: String(parsed.name ?? "Faculty"),
          email: String(parsed.email ?? ""),
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeStudent(student: Student): Student {
  return {
    ...student,

    studentRegistrations: Array.isArray(student.studentRegistrations)
      ? student.studentRegistrations
      : [],

    classAttendances: Array.isArray(student.classAttendances)
      ? student.classAttendances
      : [],

    attendances: Array.isArray(student.attendances)
      ? student.attendances
      : [],

    certificates: Array.isArray(student.certificates)
      ? student.certificates
      : [],

    memberships: Array.isArray(student.memberships)
      ? student.memberships
      : [],

    statistics: {
      ...defaultStatistics,
      ...(student.statistics ?? {}),
    },
  };
}

/* ============================================================
   HELPERS
============================================================ */

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
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

function getStudentSemester(student: Student): number | null {
  const registration = student.studentRegistrations.find(
    (item) => Number(item.semester) > 0
  );

  return registration ? Number(registration.semester) : null;
}

function getStudentSections(student: Student): string[] {
  return Array.from(
    new Set(
      student.studentRegistrations
        .map((item) => item.section?.trim())
        .filter(Boolean)
    )
  );
}

function getStudentSection(student: Student): string {
  return getStudentSections(student).join(", ") || "-";
}

function getUniqueSubjects(student: Student): Subject[] {
  const map = new Map<string, Subject>();

  for (const registration of student.studentRegistrations) {
    if (registration.subject?.id) {
      map.set(registration.subject.id, registration.subject);
    }
  }

  return Array.from(map.values());
}

function createEditForm(student: Student): EditForm {
  return {
    name: student.name ?? "",
    email: student.email ?? "",
    campusUserId: student.campusUserId ?? "",
    phone: student.phone ?? "",
    department: student.department ?? "",
    qualification: student.qualification ?? "",
    specialization: student.specialization ?? "",
    address: student.address ?? "",
    city: student.city ?? "",
    state: student.state ?? "",
  };
}

/* ============================================================
   PAGE
============================================================ */

export default function FacultyStudentsPage() {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ----------------------------------------------------------
     CLASS SELECTION
  ---------------------------------------------------------- */

  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [hasLoadedClass, setHasLoadedClass] = useState(false);

  /* ----------------------------------------------------------
     SEARCH
  ---------------------------------------------------------- */

  const [search, setSearch] = useState("");

  /* ----------------------------------------------------------
     DETAILS
  ---------------------------------------------------------- */

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  /* ----------------------------------------------------------
     DELETE
  ---------------------------------------------------------- */

  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ----------------------------------------------------------
     EDIT
  ---------------------------------------------------------- */

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  /* ============================================================
     INITIAL CLIENT SETUP
  ============================================================ */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFaculty(getStoredFaculty());
      setSemester("");
      setSection("");
      setStudents([]);
      setHasLoadedClass(false);
      setSearch("");
      setSelectedStudent(null);
      setDeleteStudent(null);
      setEditingStudent(null);
      setEditForm(null);
      setError("");
      setSuccess("");
    }, 0);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      setSemester("");
      setSection("");
      setStudents([]);
      setHasLoadedClass(false);
      setSearch("");
      setSelectedStudent(null);
      setDeleteStudent(null);
      setEditingStudent(null);
      setEditForm(null);
      setError("");
      setSuccess("");
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  /* ============================================================
     LOAD STUDENTS
  ============================================================ */

  const loadStudents = useCallback(
    async (
      selectedSemester: string,
      selectedSection: string,
      isRefresh = false
    ) => {
      if (!faculty?.id) {
        setError(
          "Faculty information was not found. Please login again."
        );
        return;
      }

      if (!selectedSemester || !selectedSection) {
        setError("Please select both semester and section.");
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      try {
        const response = await fetch(
          `/api/faculty/students?semester=${encodeURIComponent(
            selectedSemester
          )}&section=${encodeURIComponent(selectedSection)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              "x-faculty-id": faculty.id,
            },
          }
        );

        let data: ApiResponse = {};

        try {
          data = (await response.json()) as ApiResponse;
        } catch {
          data = {};
        }

        if (!response.ok || data.success !== true) {
          throw new Error(
            data.message ||
              `Unable to load students (HTTP ${response.status}).`
          );
        }

        const loaded = Array.isArray(data.students)
          ? data.students
          : [];

        setStudents(loaded.map(normalizeStudent));
        setHasLoadedClass(true);

        if (isRefresh) {
          setSuccess(
            `Semester ${selectedSemester} - Section ${selectedSection} refreshed successfully.`
          );
        }
      } catch (err) {
        console.error("Faculty student load error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load students."
        );

        setStudents([]);
        setHasLoadedClass(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [faculty]
  );

  /* ============================================================
     SELECTION CHANGE
  ============================================================ */

  const handleSemesterChange = (value: string) => {
    setSemester(value);
    setSection("");
    setStudents([]);
    setHasLoadedClass(false);
    setSearch("");
    setError("");
    setSuccess("");
  };

  const handleSectionChange = (value: string) => {
    setSection(value);
    setStudents([]);
    setHasLoadedClass(false);
    setSearch("");
    setError("");
    setSuccess("");
  };

  const handleLoadStudents = () => {
    void loadStudents(semester, section, false);
  };

  const handleRefresh = () => {
    setSemester("");
    setSection("");
    setStudents([]);
    setHasLoadedClass(false);
    setSearch("");
    setSelectedStudent(null);
    setDeleteStudent(null);
    setEditingStudent(null);
    setEditForm(null);
    setError("");
    setSuccess("");
  };

  /* ============================================================
     DELETE
  ============================================================ */

  const confirmDelete = async () => {
    if (!faculty?.id || !deleteStudent) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/faculty/students", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-faculty-id": faculty.id,
        },
        body: JSON.stringify({
          studentId: deleteStudent.id,
        }),
      });

      let data: DeleteResponse = {};

      try {
        data = (await response.json()) as DeleteResponse;
      } catch {
        data = {};
      }

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message ||
            `Unable to delete student (HTTP ${response.status}).`
        );
      }

      const deletedName = deleteStudent.name;

      setStudents((current) =>
        current.filter((student) => student.id !== deleteStudent.id)
      );

      setSelectedStudent(null);
      setDeleteStudent(null);

      setSuccess(`${deletedName} deleted successfully.`);
    } catch (err) {
      console.error("Faculty student delete error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete student."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     EDIT
  ============================================================ */

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm(createEditForm(student));
    setSelectedStudent(null);
    setError("");
    setSuccess("");
  };

  const closeEdit = () => {
    if (savingEdit) {
      return;
    }

    setEditingStudent(null);
    setEditForm(null);
  };

  const updateEditField = (field: keyof EditForm, value: string) => {
    setEditForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  };

  const saveStudent = async () => {
    if (!faculty?.id || !editingStudent || !editForm) {
      return;
    }

    if (!editForm.name.trim()) {
      setError("Student name is required.");
      return;
    }

    if (!editForm.email.trim()) {
      setError("Student email is required.");
      return;
    }

    setSavingEdit(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/faculty/students", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-faculty-id": faculty.id,
        },
        body: JSON.stringify({
          studentId: editingStudent.id,
          ...editForm,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        student?: Student;
      };

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Unable to update student.");
      }

      if (data.student) {
        const updated = normalizeStudent(data.student);

        setStudents((current) =>
          current.map((student) =>
            student.id === updated.id ? updated : student
          )
        );
      } else {
        setStudents((current) =>
          current.map((student) =>
            student.id === editingStudent.id
              ? {
                  ...student,
                  name: editForm.name.trim(),
                  email: editForm.email.trim(),
                  campusUserId:
                    editForm.campusUserId.trim() || null,
                  phone: editForm.phone.trim() || null,
                  department:
                    editForm.department.trim() || null,
                  qualification:
                    editForm.qualification.trim() || null,
                  specialization:
                    editForm.specialization.trim() || null,
                  address: editForm.address.trim() || null,
                  city: editForm.city.trim() || null,
                  state: editForm.state.trim() || null,
                }
              : student
          )
        );
      }

      setEditingStudent(null);
      setEditForm(null);

      setSuccess(`${editForm.name.trim()} updated successfully.`);
    } catch (err) {
      console.error("Faculty student update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update student."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return students;
    }

    return students.filter((student) => {
      const subjects = student.studentRegistrations
        .map((registration) => registration.subject?.name ?? "")
        .join(" ");

      return (
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        (student.campusUserId ?? "").toLowerCase().includes(term) ||
        subjects.toLowerCase().includes(term)
      );
    });
  }, [students, search]);

  /* ============================================================
     RETURN
  ============================================================ */

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#edf4fa] text-[#102033]">
      <div className="min-h-screen w-full min-w-0">
        <main className="relative min-h-screen w-full overflow-hidden bg-[#edf4fa] px-3 py-5 sm:px-5 lg:px-7 xl:px-8">
          {/* BACKGROUND GRID */}
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(88,157,197,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(88,157,197,0.065) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
          </div>

          <div className="relative w-full max-w-none">
            {/* =================================================
                TOP
            ================================================= */}

            <section className="mb-5">
              <div className="relative h-[280px] overflow-hidden rounded-[25px] bg-[#101c2e] text-white shadow-[0_20px_60px_rgba(20,45,70,0.14)]">
                <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-[#6fc9ed]/20" />
                <div className="pointer-events-none absolute right-[-30px] top-[55px] h-56 w-56 rounded-full border border-[#6fc9ed]/10" />
                <div className="pointer-events-none absolute bottom-[-110px] left-[40%] h-64 w-64 rounded-full bg-[#54bce5]/5 blur-3xl" />

                <div className="relative flex h-full w-full items-center px-6 sm:px-9 lg:px-10">
                  <div className="flex w-full items-center justify-between gap-6">
                    <div className="max-w-[780px]">
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#63c9ef]/30 bg-[#17314a] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#73d0f3]">
                        <Users size={13} />
                        Faculty Student Management
                      </div>

                      <h1 className="font-serif text-[32px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[40px]">
                        Student Directory
                      </h1>

                      <p className="mt-3 max-w-[680px] text-[11px] leading-5 text-[#a9b9ca] sm:text-[12px]">
                        Select a semester and section to view the approved
                        students for that class. Review student information,
                        attendance, and academic details from one secure
                        faculty workspace.
                      </p>
                    </div>

                    <div className="relative flex shrink-0 items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-sm">
                        <p className="text-[8px] uppercase tracking-[0.18em] text-[#8ea4b9]">
                          Students Found
                        </p>

                        <p className="mt-1 text-[24px] font-bold leading-none">
                          {hasLoadedClass ? filteredStudents.length : 0}
                        </p>
                      </div>

                      <div className="flex h-[62px] w-[62px] items-center justify-center rounded-2xl border border-[#61c8ee]/20 bg-[#17324b] text-[#68cbed]">
                        <GraduationCap size={29} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
              <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-[#f2caca] bg-[#fff6f6] px-4 py-3 text-[11px] text-[#b13c3c] shadow-sm">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="shrink-0 rounded-lg p-1 hover:bg-red-100"
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
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* =================================================
                CLASS SELECTION
            ================================================= */}

            <section className="mb-5 overflow-hidden rounded-[22px] border border-[#d5e2ec] bg-white shadow-[0_12px_35px_rgba(30,60,90,0.055)]">
              <div className="border-b border-[#e6edf2] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3988b8]">
                      Class Selection
                    </p>

                    <h2 className="mt-1 font-serif text-[20px] font-bold text-[#17283c]">
                      Select Semester {"&"} Section
                    </h2>

                    <p className="mt-1 text-[10px] text-[#8194a7]">
                      Students will appear only after both values are
                      selected.
                    </p>
                  </div>

                  {hasLoadedClass && (
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#bfe6d3] bg-[#f1fbf6] px-3 py-1.5 text-[9px] font-bold text-[#31815f]">
                      <CheckCircle2 size={12} />
                      Semester {semester} • Section {section}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] sm:p-6">
                {/* SEMESTER */}
                <div>
                  <label
                    htmlFor="semester"
                    className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#71879b]"
                  >
                    Semester
                  </label>

                  <div className="relative">
                    <select
                      id="semester"
                      value={semester}
                      onChange={(event) =>
                        handleSemesterChange(event.target.value)
                      }
                      className="h-12 w-full appearance-none rounded-xl border border-[#d8e5ee] bg-[#fbfdff] px-4 pr-10 text-[11px] font-semibold text-[#273b50] outline-none transition focus:border-[#72c5e9] focus:ring-4 focus:ring-[#54bce5]/10"
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map((item) => (
                        <option key={item} value={String(item)}>
                          Semester {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7890a5]"
                    />
                  </div>
                </div>

                {/* SECTION */}
                <div>
                  <label
                    htmlFor="section"
                    className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#71879b]"
                  >
                    Section
                  </label>

                  <div className="relative">
                    <select
                      id="section"
                      value={section}
                      disabled={!semester}
                      onChange={(event) =>
                        handleSectionChange(event.target.value)
                      }
                      className="h-12 w-full appearance-none rounded-xl border border-[#d8e5ee] bg-[#fbfdff] px-4 pr-10 text-[11px] font-semibold text-[#273b50] outline-none transition focus:border-[#72c5e9] focus:ring-4 focus:ring-[#54bce5]/10 disabled:cursor-not-allowed disabled:bg-[#f2f5f7] disabled:text-[#9aa9b7]"
                    >
                      <option value="">Select Section</option>
                      {SECTIONS.map((item) => (
                        <option key={item} value={item}>
                          Section {item}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7890a5]"
                    />
                  </div>
                </div>

                {/* LOAD */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleLoadStudents}
                    disabled={!semester || !section || loading}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111d2e] px-6 text-[11px] font-bold text-white shadow-[0_10px_25px_rgba(17,29,46,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1a2a40] disabled:cursor-not-allowed disabled:opacity-45 lg:w-auto"
                  >
                    {loading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Users size={15} />
                    )}
                    {loading ? "Loading..." : "Load Students"}
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================
                SEARCH
            ================================================= */}

            {hasLoadedClass && (
              <section className="mb-5 rounded-[18px] border border-[#d7e3ed] bg-white p-3 shadow-[0_7px_25px_rgba(30,60,90,0.045)]">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8da1b4]"
                    />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search student by name, email, Campus ID or subject..."
                      className="h-12 w-full rounded-xl border border-[#dce7ef] bg-[#fbfdff] pl-11 pr-10 text-[12px] text-[#25384d] outline-none transition placeholder:text-[#9badbe] focus:border-[#8fc8e6] focus:ring-4 focus:ring-[#54bce5]/10"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8195a9] hover:bg-[#eef5fa]"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={!semester || !section || loading || refreshing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#d5e2eb] bg-white px-5 text-[11px] font-bold text-[#49657f] shadow-sm transition hover:border-[#9bcce6] hover:text-[#267ba8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </section>
            )}

            {/* =================================================
                DIRECTORY
            ================================================= */}

            <section className="overflow-hidden rounded-[22px] border border-[#d5e1eb] bg-white shadow-[0_12px_35px_rgba(30,60,90,0.055)]">
              <div className="flex flex-col gap-3 border-b border-[#e2e9ef] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef7fc] text-[#4a9bc8]">
                    <Users size={19} />
                  </div>

                  <div>
                    <h2 className="font-serif text-[19px] font-bold text-[#15263a]">
                      Students
                    </h2>

                    <p className="mt-0.5 text-[10px] text-[#7b8fa2]">
                      {hasLoadedClass
                        ? `${filteredStudents.length} student${
                            filteredStudents.length === 1 ? "" : "s"
                          } displayed`
                        : "Select a semester and section to begin"}
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ccebdc] bg-[#f3fbf7] px-3 py-1.5 text-[9px] font-semibold text-[#31815f]">
                  <CheckCircle2 size={12} />
                  Approved Students
                </div>
              </div>

              {/* NOT SELECTED */}
              {!hasLoadedClass && !loading && (
                <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#eef6fb] text-[#77a9c6] shadow-inner">
                    <GraduationCap size={34} />
                  </div>

                  <h3 className="mt-5 font-serif text-[19px] font-bold text-[#26394d]">
                    Select Your Class
                  </h3>

                  <p className="mt-2 max-w-[450px] text-[11px] leading-5 text-[#8194a7]">
                    Choose semester and section above to view the approved
                    students belonging to that class.
                  </p>
                </div>
              )}

              {/* LOADING */}
              {hasLoadedClass && loading && (
                <div className="flex min-h-[350px] flex-col items-center justify-center">
                  <Loader2
                    size={31}
                    className="animate-spin text-[#54bce5]"
                  />

                  <p className="mt-4 text-[12px] font-semibold text-[#536b83]">
                    Loading students...
                  </p>
                </div>
              )}

              {/* EMPTY */}
              {hasLoadedClass &&
                !loading &&
                filteredStudents.length === 0 && (
                  <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef5fa] text-[#88a0b6]">
                      <Users size={28} />
                    </div>

                    <h3 className="mt-5 font-serif text-[17px] font-bold text-[#24374c]">
                      No students found
                    </h3>

                    <p className="mt-2 max-w-[450px] text-[11px] leading-5 text-[#8194a7]">
                      {search
                        ? "No student in this class matches your search."
                        : `No approved students are registered in Semester ${semester}, Section ${section}.`}
                    </p>
                  </div>
                )}

              {/* STUDENT LIST */}
              {hasLoadedClass &&
                !loading &&
                filteredStudents.length > 0 && (
                  <div className="divide-y divide-[#e7edf2]">
                    {filteredStudents.map((student) => (
                      <StudentRow
                        key={student.id}
                        student={student}
                        onView={() => setSelectedStudent(student)}
                        onDelete={() => setDeleteStudent(student)}
                      />
                    ))}
                  </div>
                )}
            </section>

            {/* FOOTER */}
            <footer className="py-8 text-center text-[10px] text-[#8194a7]">
              © 2026 CampusConnect • Faculty Student Management
            </footer>
          </div>
        </main>
      </div>

      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={() => openEdit(selectedStudent)}
          onDelete={() => {
            setDeleteStudent(selectedStudent);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}
      {editingStudent && editForm && (
        <EditStudentModal
          student={editingStudent}
          form={editForm}
          saving={savingEdit}
          onChange={updateEditField}
          onCancel={closeEdit}
          onSave={() => void saveStudent()}
        />
      )}

      {/* ======================================================
          DELETE MODAL
      ====================================================== */}
      {deleteStudent && (
        <DeleteModal
          student={deleteStudent}
          loading={deleting}
          onCancel={() => setDeleteStudent(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}

/* ============================================================
   STUDENT ROW
============================================================ */

function StudentRow({
  student,
  onView,
  onDelete,
}: {
  student: Student;
  onView: () => void;
  onDelete: () => void;
}) {
  const semester = getStudentSemester(student);
  const section = getStudentSection(student);
  const attendance = Number.isFinite(
    student.statistics.classAttendancePercentage
  )
    ? student.statistics.classAttendancePercentage
    : 0;

  return (
    <div className="group px-4 py-5 transition duration-300 hover:bg-[#f7fcff] sm:px-6 lg:px-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        {/* STUDENT */}
        <button
          type="button"
          onClick={onView}
          className="group/student flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-transparent p-2 text-left transition duration-300 hover:border-[#54bce5]/40 hover:bg-[#eefaff] hover:shadow-[0_0_0_3px_rgba(84,188,229,0.08),0_0_28px_rgba(84,188,229,0.16)]"
        >
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#cfe2ed] bg-[#eff8fd] text-[#4699c7] transition duration-300 group-hover/student:border-[#54bce5] group-hover/student:shadow-[0_0_20px_rgba(84,188,229,0.22)]">
            {student.profileImage ? (
              <img
                src={student.profileImage}
                alt={student.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle size={25} />
            )}

            <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#61bd8d]" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-bold text-[#17283c] transition-colors group-hover/student:text-[#167aa9]">
                {student.name}
              </h3>

              <span className="inline-flex items-center gap-1 rounded-full border border-[#bfe6d3] bg-[#f1fbf6] px-2.5 py-1 text-[8px] font-bold text-[#30805d]">
                <CheckCircle2 size={9} />
                Approved
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[#75899d]">
              <span className="inline-flex items-center gap-1">
                <Mail size={10} />
                {student.email}
              </span>

              {student.campusUserId && (
                <span>ID: {student.campusUserId}</span>
              )}
            </div>
          </div>
        </button>

        {/* SEMESTER / SECTION / ATTENDANCE */}
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 xl:w-[540px] xl:shrink-0">
          <InfoBox
            label="Semester"
            value={semester ? `Semester ${semester}` : "Not assigned"}
          />

          <InfoBox label="Section" value={section} />

          <InfoBox
            label="Attendance"
            value={`${attendance.toFixed(1)}%`}
          />
        </div>

        {/* VIEW + DELETE */}
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#bcdff3] bg-[#f7fcff] px-5 text-[10px] font-bold text-[#2d83b4] transition duration-300 hover:-translate-y-0.5 hover:border-[#54bce5] hover:bg-[#eefaff] hover:text-[#126f9b] hover:shadow-[0_0_0_3px_rgba(84,188,229,0.09),0_0_24px_rgba(84,188,229,0.18)] focus:outline-none focus:ring-4 focus:ring-[#54bce5]/10"
          >
            <Users size={15} />
            View Details
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#efcaca] bg-[#fffafa] px-5 text-[10px] font-bold text-[#c34c4c] transition duration-300 hover:-translate-y-0.5 hover:border-[#54bce5] hover:bg-[#eefaff] hover:text-[#167aa9] hover:shadow-[0_0_0_3px_rgba(84,188,229,0.09),0_0_24px_rgba(84,188,229,0.18)] focus:outline-none focus:ring-4 focus:ring-[#54bce5]/10"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INFO BOX
============================================================ */

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="group/box flex min-h-[68px] min-w-0 flex-col justify-center rounded-2xl border border-[#d8e5ee] bg-[#f8fafc] px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#54bce5] hover:bg-[#eefaff] hover:shadow-[0_0_0_3px_rgba(84,188,229,0.08),0_0_24px_rgba(84,188,229,0.16)]">
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#8295a7] transition-colors group-hover/box:text-[#3b8db7]">
        {label}
      </p>

      <p className="mt-1.5 truncate text-[11px] font-bold text-[#273a4f] transition-colors group-hover/box:text-[#126f9b]">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   DETAILS MODAL
============================================================ */

function StudentDetailsModal({
  student,
  onClose,
  onEdit,
  onDelete,
}: {
  student: Student;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const registrations = student.studentRegistrations ?? [];
  const memberships = student.memberships ?? [];
  const certificates = student.certificates ?? [];
  const statistics = {
    ...defaultStatistics,
    ...(student.statistics ?? {}),
  };
  const subjects = getUniqueSubjects(student);
  const sections = getStudentSections(student);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/75 p-2 backdrop-blur-md sm:p-4 lg:p-5">
      <div className="flex max-h-[96vh] w-full max-w-[1380px] flex-col overflow-hidden rounded-[25px] border border-[#d6e2eb] bg-[#f4f8fb] shadow-[0_35px_110px_rgba(5,20,35,0.32)] animate-[modalIn_.25s_ease-out]">
        {/* HEADER */}
        <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-[#dce6ee] bg-[#101d2f] px-5 py-5 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-[#69cbed]/15" />

          <div className="relative flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#18344c] text-[#63c9ef]">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle size={23} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-serif text-[20px] font-bold sm:text-[24px]">
                  {student.name}
                </h2>

                <span className="rounded-full border border-[#76d5a9]/25 bg-[#193b31] px-2.5 py-1 text-[8px] font-bold text-[#82dcb2]">
                  APPROVED
                </span>
              </div>

              <p className="mt-1 truncate text-[10px] text-[#9eb1c3]">
                {student.email}
                {student.campusUserId ? ` • ${student.campusUserId}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#b4c3d1] transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          {/* STATS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ModalStat
              label="Subjects"
              value={String(subjects.length)}
              icon={BookOpen}
            />

            <ModalStat
              label="Semester"
              value={getStudentSemester(student)?.toString() ?? "-"}
              icon={GraduationCap}
            />

            <ModalStat
              label="Section"
              value={sections.join(", ") || "-"}
              icon={Users}
            />

            <ModalStat
              label="Certificates"
              value={String(statistics.certificateCount)}
              icon={Award}
            />
          </div>

          {/* PERSONAL + ACADEMIC */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DetailSection
              title="Personal Information"
              icon={UserCircle}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem label="Full Name" value={student.name} />
                <DetailItem label="Email" value={student.email} />
                <DetailItem
                  label="Phone"
                  value={student.phone || "Not provided"}
                />
                <DetailItem
                  label="Campus User ID"
                  value={student.campusUserId || "Not assigned"}
                />
                <DetailItem
                  label="Address"
                  value={student.address || "Not provided"}
                  className="sm:col-span-2"
                />
                <DetailItem
                  label="City"
                  value={student.city || "Not provided"}
                />
                <DetailItem
                  label="State"
                  value={student.state || "Not provided"}
                />
              </div>
            </DetailSection>

            <DetailSection
              title="Academic Information"
              icon={GraduationCap}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Semester"
                  value={
                    getStudentSemester(student)
                      ? `Semester ${getStudentSemester(student)}`
                      : "Not available"
                  }
                />
                <DetailItem
                  label="Section"
                  value={getStudentSection(student)}
                />
                <DetailItem
                  label="Qualification"
                  value={student.qualification || "Not available"}
                />
                <DetailItem
                  label="Department"
                  value={student.department || "Not available"}
                />
                <DetailItem
                  label="Specialization"
                  value={student.specialization || "Not available"}
                />
                <DetailItem
                  label="Designation"
                  value={student.designation || "Not available"}
                />
                <DetailItem label="Account Status" value="Approved" />
                <DetailItem
                  label="Joining Date"
                  value={
                    student.joiningDate
                      ? formatDate(student.joiningDate)
                      : "Not available"
                  }
                />
              </div>
            </DetailSection>
          </div>

          {/* REGISTRATION */}
          <DetailSection
            title="Registered Subjects"
            icon={BookOpen}
            badge={`${registrations.length}`}
          >
            {registrations.length === 0 ? (
              <EmptyDetail text="No subject registration found." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#dce6ee]">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="bg-[#f6f9fb]">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Semester
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Section
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-[#7b8fa2]">
                        Registered
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e8eef3] bg-white">
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td className="px-4 py-3 text-[11px] font-semibold text-[#26394d]">
                          {registration.subject?.name}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-[#62788d]">
                          Semester {registration.semester}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-[#62788d]">
                          {registration.section}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-[#62788d]">
                          {formatDate(registration.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DetailSection>

          {/* CLUBS */}
          <DetailSection
            title="Club Memberships"
            icon={Trophy}
            badge={`${memberships.length}`}
          >
            {memberships.length === 0 ? (
              <EmptyDetail text="No club memberships found." />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="rounded-xl border border-[#dce6ee] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <h4 className="text-[12px] font-bold text-[#26394d]">
                      {membership.club?.name}
                    </h4>

                    <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#8194a7]">
                      {membership.club?.description}
                    </p>

                    <p className="mt-3 text-[9px] text-[#72879a]">
                      Joined: {formatDate(membership.joinedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DetailSection>

          {/* CERTIFICATES */}
          <DetailSection
            title="Certificates"
            icon={Award}
            badge={`${certificates.length}`}
          >
            {certificates.length === 0 ? (
              <EmptyDetail text="No certificates found." />
            ) : (
              <div className="space-y-2">
                {certificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex flex-col gap-3 rounded-xl border border-[#dce6ee] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-[#26394d]">
                        {certificate.title}
                      </p>

                      <p className="mt-1 text-[9px] text-[#8194a7]">
                        Issued {formatDate(certificate.createdAt)}
                      </p>
                    </div>

                    {certificate.fileUrl && (
                      <a
                        href={certificate.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#c5e0f1] bg-[#f5fbff] px-3 py-1.5 text-[9px] font-bold text-[#3385b2] transition hover:bg-[#eaf7ff]"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DetailSection>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-[#dce6ee] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="hidden text-[9px] text-[#8194a7] sm:block">
            Student ID: {student.id}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#f0caca] bg-[#fffafa] px-4 text-[10px] font-bold text-[#c34c4c] transition hover:bg-[#fff1f1]"
            >
              <Trash2 size={14} />
              Delete
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#bcdff3] bg-[#f4fbff] px-4 text-[10px] font-bold text-[#2d83b4] transition hover:bg-[#eaf7ff]"
            >
              <Edit3 size={14} />
              Edit Student
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#132238] px-5 text-[10px] font-bold text-white transition hover:bg-[#1c304a]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   MODAL STAT
============================================================ */

function ModalStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-xl border border-[#dce6ee] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] uppercase tracking-wider text-[#8194a7]">
          {label}
        </p>

        <Icon size={14} className="text-[#5ba8d1]" />
      </div>

      <p className="mt-2 truncate text-[15px] font-bold text-[#24374c]">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   DETAIL SECTION
============================================================ */

function DetailSection({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  icon: React.ComponentType<{
    size?: number;
  }>;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-[16px] border border-[#dce6ee] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5edf2] bg-[#fbfdff] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf7fc] text-[#4b9dca]">
            <Icon size={16} />
          </div>

          <h3 className="font-serif text-[14px] font-bold text-[#26394d]">
            {title}
          </h3>
        </div>

        {badge && (
          <span className="rounded-full border border-[#d5e5ef] bg-white px-2.5 py-1 text-[8px] font-bold text-[#678097]">
            {badge}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#e1e9ef] bg-[#fafcfe] px-3.5 py-3 ${className}`}
    >
      <p className="text-[8px] font-medium uppercase tracking-wider text-[#8a9cad]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-[10px] font-semibold text-[#2d4054]">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   EMPTY DETAIL
============================================================ */

function EmptyDetail({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8e3eb] bg-[#fbfdff] px-5 py-8 text-center">
      <p className="text-[10px] text-[#8295a7]">{text}</p>
    </div>
  );
}

/* ============================================================
   EDIT MODAL
============================================================ */

function EditStudentModal({
  student,
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  student: Student;
  form: EditForm;
  saving: boolean;
  onChange: (field: keyof EditForm, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const fields: {
    key: keyof EditForm;
    label: string;
    placeholder: string;
  }[] = [
    {
      key: "name",
      label: "Full Name",
      placeholder: "Student name",
    },
    {
      key: "email",
      label: "Email",
      placeholder: "student@example.com",
    },
    {
      key: "campusUserId",
      label: "Campus User ID",
      placeholder: "Campus ID",
    },
    {
      key: "phone",
      label: "Phone",
      placeholder: "Phone number",
    },
    {
      key: "department",
      label: "Department",
      placeholder: "Department",
    },
    {
      key: "qualification",
      label: "Qualification",
      placeholder: "Qualification",
    },
    {
      key: "specialization",
      label: "Specialization",
      placeholder: "Specialization",
    },
    {
      key: "city",
      label: "City",
      placeholder: "City",
    },
    {
      key: "state",
      label: "State",
      placeholder: "State",
    },
  ];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#07111f]/75 p-3 backdrop-blur-md sm:p-6">
      <div className="flex max-h-[94vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[24px] border border-[#dce5ed] bg-[#f6f9fb] shadow-[0_30px_100px_rgba(5,20,35,0.3)]">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#dce6ee] bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#3988b8]">
              Student Management
            </p>

            <h2 className="mt-1 font-serif text-[20px] font-bold text-[#17283c]">
              Edit Student
            </h2>

            <p className="mt-1 text-[10px] text-[#8194a7]">
              Update student profile information.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce6ee] bg-white text-[#657a8e] transition hover:bg-[#f2f6f9] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto px-5 py-5 sm:px-7">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#dce7ef] bg-white p-4">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#edf7fc] text-[#479ac7]">
              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt={student.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle size={22} />
              )}
            </div>

            <div>
              <p className="text-[12px] font-bold text-[#26394d]">
                {student.name}
              </p>

              <p className="mt-1 text-[9px] text-[#8194a7]">
                Student ID: {student.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-[#71879b]">
                  {field.label}
                </span>

                <input
                  value={form[field.key]}
                  onChange={(event) =>
                    onChange(field.key, event.target.value)
                  }
                  placeholder={field.placeholder}
                  className="h-11 w-full rounded-xl border border-[#dce7ef] bg-white px-3.5 text-[11px] text-[#293d51] outline-none transition placeholder:text-[#a2b0bd] focus:border-[#75c5e7] focus:ring-4 focus:ring-[#54bce5]/10"
                />
              </label>
            ))}

            {/* ADDRESS */}
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-[#71879b]">
                Address
              </span>

              <textarea
                value={form.address}
                onChange={(event) =>
                  onChange("address", event.target.value)
                }
                placeholder="Full address"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#dce7ef] bg-white px-3.5 py-3 text-[11px] text-[#293d51] outline-none transition placeholder:text-[#a2b0bd] focus:border-[#75c5e7] focus:ring-4 focus:ring-[#54bce5]/10"
              />
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#dce6ee] bg-white px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-10 rounded-xl border border-[#d7e2ea] bg-white px-5 text-[10px] font-bold text-[#60768a] transition hover:bg-[#f5f8fa] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#132238] px-6 text-[10px] font-bold text-white transition hover:bg-[#1c304a] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DELETE MODAL
============================================================ */

function DeleteModal({
  student,
  loading,
  onCancel,
  onConfirm,
}: {
  student: Student;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#07111f]/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-[440px] overflow-hidden rounded-[22px] border border-[#e2e8ed] bg-white shadow-[0_30px_90px_rgba(5,20,35,0.28)]">
        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0f0] text-[#d14f4f]">
            <Trash2 size={22} />
          </div>

          <h3 className="mt-5 font-serif text-[20px] font-bold text-[#17283c]">
            Delete Student?
          </h3>

          <p className="mt-2 text-[11px] leading-5 text-[#71869a]">
            You are about to delete{" "}
            <span className="font-bold text-[#2b3f53]">
              {student.name}
            </span>
            . This will permanently remove the student account and related
            records according to your database cascade rules.
          </p>

          <div className="mt-4 rounded-xl border border-[#f0d0d0] bg-[#fff8f8] px-4 py-3">
            <p className="text-[9px] font-semibold text-[#a35b5b]">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#e5ebef] bg-[#fbfdff] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-9 rounded-lg border border-[#d7e2ea] bg-white px-4 text-[10px] font-bold text-[#60768a] hover:bg-[#f5f8fa] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#c94e4e] px-4 text-[10px] font-bold text-white hover:bg-[#b84242] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete Student
          </button>
        </div>
      </div>
    </div>
  );
}