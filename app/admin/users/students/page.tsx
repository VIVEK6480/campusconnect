"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  Edit3,
  Eye,
  GraduationCap,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type Registration = {
  id: string;
  studentId: string;
  subjectId: string;
  semester: number;
  section: string;
  createdAt: string;
  subject?: {
    id: string;
    name: string;
    semester: number;
  } | null;
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
  approvalStatus: string | null;
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

  selectedAcademic?: {
    semester: number;
    section: string;
  };

  selectedSubjects?: Registration[];

  statistics?: StudentStatistics;
};

type StudentForm = {
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

type StudentsResponse = {
  success?: boolean;
  message?: string;
  students?: Student[];
  student?: Student;
  count?: number;
  filters?: {
    semesters?: Array<string | number>;
    sections?: string[];
  };
  selected?: {
    semester: number;
    section: string;
  };
  hasLoaded?: boolean;
};

/* ============================================================
   CONSTANTS
============================================================ */

const FALLBACK_SEMESTERS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
];

const FALLBACK_SECTIONS = [
  "Section A",
  "Section B",
  "Section C",
  "Section D",
];

const EMPTY_FORM: StudentForm = {
  name: "",
  email: "",
  campusUserId: "",
  phone: "",
  department: "",
  qualification: "",
  specialization: "",
  address: "",
  city: "",
  state: "",
};

/* ============================================================
   HELPERS
============================================================ */

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function normalizeStatus(value: string | null): string {
  return value?.trim().toUpperCase() || "";
}

function formatStatus(value: string | null): string {
  if (!value) return "N/A";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "S";
}

function normalizeSection(value: string): string {
  const clean = value
    .trim()
    .replace(/^SECTION\s+/i, "")
    .trim()
    .toUpperCase();

  return clean ? `Section ${clean}` : "";
}

/* ============================================================
   PAGE
============================================================ */

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);

  const [semesters, setSemesters] = useState<string[]>(
    FALLBACK_SEMESTERS
  );

  const [sections, setSections] = useState<string[]>(
    FALLBACK_SECTIONS
  );

  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [error, setError] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [editingStudent, setEditingStudent] =
    useState<Student | null>(null);

  const [deletingStudent, setDeletingStudent] =
    useState<Student | null>(null);

  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ============================================================
     ESCAPE MODAL
  ============================================================ */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (saving || deleting) return;

      setSelectedStudent(null);
      setEditingStudent(null);
      setDeletingStudent(null);
      setForm(EMPTY_FORM);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [saving, deleting]);

  /* ============================================================
     LOAD FILTERS
  ============================================================ */

  useEffect(() => {
    let active = true;

    const loadFilters = async () => {
      setLoadingFilters(true);

      try {
        const response = await fetch(
          "/api/admin/users/students",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as StudentsResponse;

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load academic filters."
          );
        }

        if (!active) return;

        /*
         * Always keep the complete academic filter available:
         * Semester 1-8 and Section A-D.
         *
         * The API may return only the values currently present in
         * the database, but the admin UI must always allow every
         * semester and section.
         */
        setSemesters(FALLBACK_SEMESTERS);
        setSections(FALLBACK_SECTIONS);
      } catch (err) {
        if (!active) return;

        /*
         * Keep fallback filters available even if
         * the filter request fails.
         */
        setSemesters(FALLBACK_SEMESTERS);
        setSections(FALLBACK_SECTIONS);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load academic filters."
        );
      } finally {
        if (active) {
          setLoadingFilters(false);
        }
      }
    };

    void loadFilters();

    return () => {
      active = false;
    };
  }, []);

  /* ============================================================
     LOAD STUDENTS
  ============================================================ */

  const loadStudents = useCallback(
    async (
      selectedSemester: string,
      selectedSection: string
    ) => {
      if (
        !selectedSemester ||
        !selectedSection
      ) {
        setStudents([]);
        return;
      }

      setLoadingStudents(true);
      setError("");

      try {
        const params = new URLSearchParams();

        params.set(
          "semester",
          selectedSemester
        );

        params.set(
          "section",
          normalizeSection(selectedSection)
        );

        const response = await fetch(
          `/api/admin/users/students?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as StudentsResponse;

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load students."
          );
        }

        setStudents(data.students ?? []);
      } catch (err) {
        setStudents([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load students."
        );
      } finally {
        setLoadingStudents(false);
      }
    },
    []
  );

  /* ============================================================
     FILTER HANDLERS
  ============================================================ */

  const handleSemesterChange = (
    value: string
  ) => {
    setSemester(value);
    setSearch("");
    setStatusFilter("ALL");
    setError("");

    if (value && section) {
      void loadStudents(value, section);
    } else {
      setStudents([]);
    }
  };

  const handleSectionChange = (
    value: string
  ) => {
    setSection(value);
    setSearch("");
    setStatusFilter("ALL");
    setError("");

    if (semester && value) {
      void loadStudents(semester, value);
    } else {
      setStudents([]);
    }
  };

  const clearFilters = () => {
    setSemester("");
    setSection("");
    setSearch("");
    setStatusFilter("ALL");
    setStudents([]);
    setError("");
  };

  /* ============================================================
     FILTER STUDENTS
  ============================================================ */

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [
          student.name,
          student.email,
          student.campusUserId,
          student.department,
          student.phone,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizeStatus(
          student.approvalStatus
        ) === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    students,
    search,
    statusFilter,
  ]);

  /* ============================================================
     EDIT
  ============================================================ */

  const openEdit = (
    student: Student
  ) => {
    setEditingStudent(student);

    setForm({
      name: student.name || "",
      email: student.email || "",
      campusUserId:
        student.campusUserId || "",
      phone: student.phone || "",
      department:
        student.department || "",
      qualification:
        student.qualification || "",
      specialization:
        student.specialization || "",
      address:
        student.address || "",
      city: student.city || "",
      state: student.state || "",
    });
  };

  const closeEdit = () => {
    if (saving) return;

    setEditingStudent(null);
    setForm(EMPTY_FORM);
  };

  const saveStudent = async () => {
    if (!editingStudent) return;

    const name = form.name.trim();
    const email =
      form.email.trim().toLowerCase();

    if (!name) {
      setError(
        "Student name is required."
      );
      return;
    }

    if (!email) {
      setError(
        "Student email is required."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/users/students",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            // The Student API uses `studentId` to identify the User record.
            // Keep `id` as well so the existing frontend/API contract remains intact.
            id: editingStudent.id,
            studentId: editingStudent.id,
            name,
            email,
            campusUserId:
              form.campusUserId.trim(),
            phone:
              form.phone.trim(),
            department:
              form.department.trim(),
            qualification:
              form.qualification.trim(),
            specialization:
              form.specialization.trim(),
            address:
              form.address.trim(),
            city:
              form.city.trim(),
            state:
              form.state.trim(),
          }),
        }
      );

      const data =
        (await response.json()) as StudentsResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update student."
        );
      }

      setEditingStudent(null);
      setForm(EMPTY_FORM);

      if (semester && section) {
        await loadStudents(
          semester,
          section
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update student."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE
  ============================================================ */

  const removeStudent = async () => {
    if (!deletingStudent) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/users/students?id=${encodeURIComponent(
          deletingStudent.id
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data =
        (await response.json()) as StudentsResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete student."
        );
      }

      setDeletingStudent(null);
      setSelectedStudent(null);

      if (semester && section) {
        await loadStudents(
          semester,
          section
        );
      }
    } catch (err) {
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
     RENDER
  ============================================================ */

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-[#f6f8fc] text-slate-900"
      style={{
        "--cc-accent": "#4f46e5",
        "--cc-accent-soft": "rgba(79,70,229,.10)",
      } as CSSProperties}
    >
      <style jsx>{`
        .cc-admin-banner {
          position: relative;
          overflow: hidden;
          background: linear-gradient(112deg, #202b63 0%, #2d4fae 52%, #4669e2 100%);
          box-shadow: 0 18px 45px rgba(37, 60, 145, .18);
          transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease;
        }

        .cc-admin-banner::before,
        .cc-admin-banner::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 9999px;
        }

        .cc-admin-banner::before {
          width: 120px;
          height: 120px;
          right: 95px;
          top: -42px;
        }

        .cc-admin-banner::after {
          width: 175px;
          height: 175px;
          right: -38px;
          top: -65px;
        }

        .cc-banner-button {
          transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease;
        }

        .cc-banner-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 28px rgba(9, 24, 76, .22);
          background: #ffffff;
          color: #2846a5;
        }

        /* MINI BOXES ONLY
           Large panels stay completely static.
           Small information/detail boxes use the Admin UI indigo on hover. */
        :global(.cc-mini-box) {
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        :global(.cc-mini-box:hover) {
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%) !important;
          border-color: #4f46e5 !important;
          color: #ffffff !important;
          transform: translateY(-2px) scale(1.035);
          box-shadow:
            0 12px 28px rgba(79, 70, 229, 0.30),
            0 0 0 3px rgba(79, 70, 229, 0.14),
            0 0 22px rgba(37, 99, 235, 0.22);
        }

        :global(.cc-mini-box:hover p),
        :global(.cc-mini-box:hover span),
        :global(.cc-mini-box:hover div),
        :global(.cc-mini-box:hover strong) {
          color: #ffffff !important;
        }

        :global(.cc-mini-box:hover svg) {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* SEMESTER + SECTION SELECT BOXES */
        .cc-academic-select {
          transition:
            background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .cc-academic-select:hover,
        .cc-academic-select:focus {
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%) !important;
          border-color: #4f46e5 !important;
          color: #ffffff !important;
          transform: translateY(-2px) scale(1.015);
          box-shadow:
            0 12px 28px rgba(79, 70, 229, 0.30),
            0 0 0 3px rgba(79, 70, 229, 0.14),
            0 0 22px rgba(37, 99, 235, 0.22);
          outline: none;
        }

        .cc-academic-select:hover option,
        .cc-academic-select:focus option {
          color: #0f172a;
          background: #ffffff;
        }

        @media (prefers-reduced-motion: reduce) {

          :global(.cc-glow-button),
          :global(.cc-mini-box),
          :global(.cc-banner-button),
          :global(.cc-academic-select) {
            transition: none !important;
          }
        }
      `}</style>

      {/* BACKGROUND GRID */}

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
          backgroundSize:
            "32px 32px",
        }}
      />

      <div
        className="pointer-events-none fixed -left-32 top-20 z-0 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl animate-pulse"
      />

      <div
        className="pointer-events-none fixed -right-32 top-1/3 z-0 h-80 w-80 rounded-full bg-violet-300/10 blur-3xl animate-pulse [animation-delay:1200ms]"
      />

      <div
        className="pointer-events-none fixed bottom-[-140px] left-1/3 z-0 h-96 w-96 rounded-full bg-sky-300/10 blur-3xl animate-pulse [animation-delay:2400ms]"
      />

      <div className="pointer-events-none fixed left-1/2 top-0 z-0 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-200/10 blur-3xl" />

      <div className="relative z-10 w-full px-4 py-6 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            <AlertCircle
              size={19}
              className="shrink-0"
            />

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1.5 transition hover:bg-red-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ====================================================
            ADMIN STYLE STUDENT BANNER
        ==================================================== */}

        <section className="cc-admin-banner mb-6 rounded-[24px] px-6 py-7 text-white sm:px-8 sm:py-8 lg:px-9 lg:py-9">
          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white/95 backdrop-blur-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <GraduationCap size={13} />
                </span>
                Welcome to Student Management
              </div>

              <h2 className="font-serif text-4xl font-black leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-[48px]">
                Manage your students.
                <br />
                Shape the campus experience.
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-[15px]">
                Monitor registered students, manage academic groups and keep
                student information connected across your CampusConnect
                administration portal.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                document.getElementById("student-directory")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="cc-banner-button relative z-10 inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-6 text-sm font-black text-indigo-700 shadow-lg shadow-indigo-950/10"
            >
              Manage Students
              <span className="text-lg leading-none">›</span>
            </button>
          </div>
        </section>

        {/* ====================================================
            ACADEMIC FILTER
        ==================================================== */}

        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Academic Group
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Select semester and section
                  to load registered students.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Semester"
                value={semester}
                placeholder="Choose semester"
                options={semesters}
                disabled={
                  loadingFilters
                }
                onChange={
                  handleSemesterChange
                }
                prefix="Semester"
              />

              <SelectField
                label="Section"
                value={section}
                placeholder="Choose section"
                options={sections}
                disabled={
                  loadingFilters
                }
                onChange={
                  handleSectionChange
                }
                prefix="Section"
              />
            </div>

            {semester &&
              section && (
                <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                  <span className="text-xs font-medium text-indigo-500">
                    Current academic group
                  </span>

                  <span className="cc-mini-box rounded-lg border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
                    Semester{" "}
                    {semester}
                  </span>

                  <span className="cc-mini-box rounded-lg border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
                    {normalizeSection(
                      section
                    )}
                  </span>
                </div>
              )}

            {(!semester ||
              !section) && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <BookOpen
                  size={15}
                  className="text-slate-400"
                />

                Select both semester and
                section. Students will load
                automatically.
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            DIRECTORY
        ==================================================== */}

        <section
          id="student-directory"
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-white via-white to-indigo-50/50 p-5 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Student Directory
                  </h2>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                    {
                      filteredStudents.length
                    }
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {semester &&
                  section
                    ? `Semester ${semester} · ${normalizeSection(
                        section
                      )}`
                    : "No academic group selected"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={
                    !semester ||
                    !section ||
                    loadingStudents
                  }
                  onClick={() =>
                    void loadStudents(
                      semester,
                      section
                    )
                  }
                  className="cc-glow-button group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw
                    size={16}
                    className={
                      loadingStudents
                        ? "animate-spin"
                        : "transition-transform duration-500 group-hover:rotate-180"
                    }
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {!semester ||
          !section ? (
            <EmptyState
              icon={GraduationCap}
              title="Select semester and section"
              description="Choose Semester 1–8 and Section A–D to display the registered student list."
            />
          ) : loadingStudents ? (
            <LoadingState text="Loading students..." />
          ) : filteredStudents.length ===
            0 ? (
            <EmptyState
              icon={Search}
              title="No students found"
              description={`No registered students were found for Semester ${semester}, ${normalizeSection(
                section
              )} with the current filters.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-indigo-50/35 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-6 py-4">
                      Student
                    </th>

                    <th className="px-6 py-4">
                      Student ID
                    </th>

                    <th className="px-6 py-4">
                      Academic
                    </th>

                    <th className="px-6 py-4">
                      Contact
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.id
                        }
                        className="group border-b border-slate-100 transition-colors hover:bg-indigo-50/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {student.profileImage ? (
                              <img
                                src={
                                  student.profileImage
                                }
                                alt=""
                                className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600 ring-1 ring-indigo-100">
                                {getInitials(
                                  student.name
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {
                                  student.name
                                }
                              </p>

                              <p className="max-w-[260px] truncate text-xs text-slate-500">
                                {
                                  student.email
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                            {displayValue(
                              student.campusUserId
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {displayValue(
                              student.department
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Semester{" "}
                            {
                              semester
                            }{" "}
                            ·{" "}
                            {normalizeSection(
                              section
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {displayValue(
                            student.phone
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge
                            approvalStatus={
                              student.approvalStatus
                            }
                          />
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              title="View student"
                              onClick={() =>
                                setSelectedStudent(
                                  student
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </ActionButton>

                            <ActionButton
                              title="Edit student"
                              onClick={() =>
                                openEdit(
                                  student
                                )
                              }
                            >
                              <Edit3
                                size={16}
                              />
                            </ActionButton>

                            <ActionButton
                              title="Delete student"
                              danger
                              onClick={() =>
                                setDeletingStudent(
                                  student
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ========================================================
          VIEW MODAL
      ======================================================== */}

      {selectedStudent && (
        <Modal
          title="Student Details"
          subtitle="Complete student account and academic information"
          wide
          onClose={() =>
            setSelectedStudent(
              null
            )
          }
        >
          <ProfileHeader
            name={
              selectedStudent.name
            }
            email={
              selectedStudent.email
            }
            image={
              selectedStudent.profileImage
            }
            initials={getInitials(
              selectedStudent.name
            )}
            status={
              selectedStudent.approvalStatus
            }
            accent="indigo"
          />

          <DetailSection title="Academic Information">
            <Info
              label="Student ID"
              value={
                selectedStudent.campusUserId
              }
            />

            <Info
              label="Semester"
              value={
                semester
                  ? `Semester ${semester}`
                  : null
              }
            />

            <Info
              label="Section"
              value={
                section
                  ? normalizeSection(
                      section
                    )
                  : null
              }
            />

            <Info
              label="Department"
              value={
                selectedStudent.department
              }
            />

            <Info
              label="Qualification"
              value={
                selectedStudent.qualification
              }
            />

            <Info
              label="Specialization"
              value={
                selectedStudent.specialization
              }
            />
          </DetailSection>

          <DetailSection title="Account Information">
            <Info
              label="Email"
              value={
                selectedStudent.email
              }
            />

            <Info
              label="Role"
              value={
                selectedStudent.role
              }
            />

            <Info
              label="Approval Status"
              value={
                formatStatus(
                  selectedStudent.approvalStatus
                )
              }
            />

            <Info
              label="Account Created"
              value={formatDate(
                selectedStudent.createdAt
              )}
            />
          </DetailSection>

          {selectedStudent
            .selectedSubjects &&
            selectedStudent
              .selectedSubjects
              .length > 0 && (
              <section className="mb-6">
                <h4 className="mb-3 text-sm font-bold text-slate-800">
                  Registered Subjects
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedStudent.selectedSubjects.map(
                    (
                      registration
                    ) => (
                      <div
                        key={
                          registration.id
                        }
                        className="cc-mini-box rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-sm font-bold text-slate-800">
                          {registration
                            .subject
                            ?.name ??
                            "Subject"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Semester{" "}
                          {
                            registration.semester
                          }{" "}
                          ·{" "}
                          {normalizeSection(
                            registration.section
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          <DetailSection title="Contact Information">
            <Info
              label="Phone"
              value={
                selectedStudent.phone
              }
            />

            <Info
              label="City"
              value={
                selectedStudent.city
              }
            />

            <Info
              label="State"
              value={
                selectedStudent.state
              }
            />

            <Info
              label="Address"
              value={
                selectedStudent.address
              }
            />
          </DetailSection>

          {selectedStudent.rejectionReason && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                Rejection Reason
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {
                  selectedStudent.rejectionReason
                }
              </p>
            </div>
          )}
        </Modal>
      )}

      {/* ========================================================
          EDIT MODAL
      ======================================================== */}

      {editingStudent && (
        <Modal
          title="Edit Student"
          subtitle="Update student account information"
          wide
          onClose={closeEdit}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Full Name"
              required
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
            />

            <Input
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  email: value,
                }))
              }
            />

            <Input
              label="Student ID"
              value={
                form.campusUserId
              }
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  campusUserId:
                    value,
                }))
              }
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  phone: value,
                }))
              }
            />

            <Input
              label="Department"
              value={
                form.department
              }
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  department:
                    value,
                }))
              }
            />

            <Input
              label="Qualification"
              value={
                form.qualification
              }
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  qualification:
                    value,
                }))
              }
            />

            <Input
              label="Specialization"
              value={
                form.specialization
              }
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  specialization:
                    value,
                }))
              }
            />

            <Input
              label="City"
              value={form.city}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  city: value,
                }))
              }
            />

            <Input
              label="State"
              value={form.state}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  state: value,
                }))
              }
            />

            <div className="md:col-span-2">
              <Input
                label="Address"
                value={
                  form.address
                }
                onChange={(value) =>
                  setForm(
                    (current) => ({
                      ...current,
                      address:
                        value,
                    })
                  )
                }
              />
            </div>
          </div>

          <ModalActions
            saving={saving}
            onCancel={closeEdit}
            onSave={() =>
              void saveStudent()
            }
            saveLabel="Save Changes"
          />
        </Modal>
      )}

      {/* ========================================================
          DELETE MODAL
      ======================================================== */}

      {deletingStudent && (
        <Modal
          title="Delete Student"
          subtitle="Permanent account deletion"
          onClose={() =>
            !deleting &&
            setDeletingStudent(
              null
            )
          }
        >
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2
                  size={19}
                />
              </div>

              <div>
                <p className="font-bold text-red-900">
                  Delete{" "}
                  {
                    deletingStudent.name
                  }
                  ?
                </p>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  This permanently
                  deletes the student
                  account and may also
                  affect related records
                  depending on your
                  database relations.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() =>
                setDeletingStudent(
                  null
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() =>
                void removeStudent()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:opacity-50"
            >
              {deleting && (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              )}

              {deleting
                ? "Deleting..."
                : "Delete Student"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ============================================================
   SELECT FIELD
============================================================ */

function SelectField({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
  prefix,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
  prefix: "Semester" | "Section";
}) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="cc-academic-select h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {placeholder}
          </option>

          {options.map(
            (option) => {
              const normalized =
                prefix === "Semester"
                  ? option
                  : normalizeSection(
                      option
                    );

              const text =
                prefix ===
                "Semester"
                  ? `Semester ${normalized.replace(
                      /^Semester\s+/i,
                      ""
                    )}`
                  : normalizeSection(
                      normalized
                    );

              return (
                <option
                  key={`${prefix}-${option}`}
                  value={
                    prefix ===
                    "Semester"
                      ? normalized.replace(
                          /^Semester\s+/i,
                          ""
                        )
                      : normalized
                  }
                >
                  {text}
                </option>
              );
            }
          )}
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  approvalStatus,
}: {
  approvalStatus: string | null;
}) {
  const normalized =
    normalizeStatus(
      approvalStatus
    );

  let classes =
    "border-slate-200 bg-slate-50 text-slate-500";

  if (normalized === "APPROVED") {
    classes =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (
    normalized === "PENDING"
  ) {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (
    normalized === "REJECTED"
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {formatStatus(
        approvalStatus
      )}
    </span>
  );
}

/* ============================================================
   PROFILE HEADER
============================================================ */

function ProfileHeader({
  name,
  email,
  image,
  initials,
  status,
  accent,
}: {
  name: string;
  email: string;
  image: string | null;
  initials: string;
  status: string | null;
  accent: "indigo" | "violet";
}) {
  const imageFallback =
    accent === "indigo"
      ? "bg-indigo-50 text-indigo-600"
      : "bg-violet-50 text-violet-600";

  return (
    <div className="mb-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black ${imageFallback}`}
          >
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-xl font-black text-slate-900">
            {name}
          </h3>

          <p className="mt-1 break-all text-sm text-slate-500">
            {email}
          </p>
        </div>

        <div className="sm:ml-auto">
          <StatusBadge
            approvalStatus={status}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ACTION BUTTON
============================================================ */

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
        danger
          ? "border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:shadow-md hover:shadow-red-100"
          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md hover:shadow-indigo-100"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[370px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
        <Icon
          size={27}
        />
      </div>

      <h3 className="mt-5 font-black text-slate-800">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[370px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">
        <RefreshCw
          size={18}
          className="animate-spin text-indigo-500"
        />

        {text}
      </div>
    </div>
  );
}

/* ============================================================
   MODAL
============================================================ */

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-2xl ${
          wide
            ? "max-w-5xl"
            : "max-w-2xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="font-black text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL SECTION
============================================================ */

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-7">
      <h4 className="mb-3 text-sm font-black text-slate-800">
        {title}
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   INFO
============================================================ */

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="cc-mini-box rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {displayValue(value)}
      </p>
    </div>
  );
}

/* ============================================================
   INPUT
============================================================ */

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
      />
    </label>
  );
}

/* ============================================================
   MODAL ACTIONS
============================================================ */

function ModalActions({
  saving,
  onCancel,
  onSave,
  saveLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        disabled={saving}
        onClick={onCancel}
        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
      >
        {saving && (
          <RefreshCw
            size={16}
            className="animate-spin"
          />
        )}

        {saving
          ? "Saving..."
          : saveLabel}
      </button>
    </div>
  );
}