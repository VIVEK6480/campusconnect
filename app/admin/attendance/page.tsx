"use client";

import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Filter,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  XCircle,
  Clock3,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

/* =========================================================
   TYPES
========================================================= */

type Faculty = {
  id: string;
  name: string;
  email: string;
  campusUserId:
    | string
    | null;
  department:
    | string
    | null;
};

type SubjectOption = {
  id: string;
  name: string;
  semester: number;
};

type SectionOption = {
  value: string;
  label: string;
};

type DayActivity = {
  date: string;

  status:
    | "MARKED"
    | "NOT_MARKED"
    | "NO_CLASS";

  sessionCount:
    number;

  markedSessionCount:
    number;

  attendanceRecords:
    number;

  present:
    number;

  absent:
    number;

  late:
    number;

  excused:
    number;

  lastMarkedAt:
    string | null;

  subject:
    | {
        id: string;
        name: string;
        semester: number;
      }
    | null;
};

type FacultyActivity = {
  id: string;
  name: string;
  email: string;
  campusUserId:
    | string
    | null;
  department:
    | string
    | null;

  markedDays:
    number;

  totalDays:
    number;

  compliance:
    number;

  days:
    DayActivity[];
};

type SelectedSummary = {
  faculty:
    | {
        id: string;
        name: string;
        email: string;
        department:
          | string
          | null;
      }
    | null;

  date: string;

  sessionCount:
    number;

  markedSessionCount:
    number;

  attendanceRecords:
    number;

  present:
    number;

  absent:
    number;

  late:
    number;

  excused:
    number;

  attendancePercentage:
    number;

  lastMarkedAt:
    string | null;

  subject:
    SubjectOption |
    null;

  semester:
    number |
    null;

  section:
    string |
    null;

  sevenDayMarked:
    number;

  sevenDayNotMarked:
    number;

  sevenDayNoClass:
    number;

  sevenDaySessions:
    number;

  days:
    DayActivity[];
};

type ApiResponse = {
  success?: boolean;

  message?: string;

  ready?: boolean;

  selected?: {
    status?:
      | "MARKED"
      | "NOT_MARKED"
      | "NO_CLASS"
      | "NO_FACULTY_SELECTED";

    summary?:
      | SelectedSummary
      | null;
  };

  facultyActivity?:
    FacultyActivity[];

  filters?: {
    departments?:
      string[];

    faculty?:
      Faculty[];

    semesters?:
      number[];

    subjects?:
      SubjectOption[];

    sections?:
      SectionOption[];
  };
};

/* =========================================================
   MASTER OPTIONS
========================================================= */

const BRANCH_OPTIONS = [
  "Computer Science & Engineering",
  "Artificial Intelligence & Machine Learning",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Management",
  "Commerce",
  "Science",
  "Humanities",
  "Other",
];

const SEMESTER_OPTIONS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
];

const SECTION_OPTIONS: SectionOption[] = [
  {
    value: "A",
    label: "Section A",
  },
  {
    value: "B",
    label: "Section B",
  },
  {
    value: "C",
    label: "Section C",
  },
  {
    value: "D",
    label: "Section D",
  },
];

/* =========================================================
   INITIAL
========================================================= */

const EMPTY_SELECTED_SUMMARY: SelectedSummary = {
  faculty: null,
  date: "",
  sessionCount: 0,
  markedSessionCount: 0,
  attendanceRecords: 0,
  present: 0,
  absent: 0,
  late: 0,
  excused: 0,
  attendancePercentage: 0,
  lastMarkedAt: null,
  subject: null,
  semester: null,
  section: null,
  sevenDayMarked: 0,
  sevenDayNotMarked: 0,
  sevenDayNoClass: 0,
  sevenDaySessions: 0,
  days: [],
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
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

function formatDay(
  value: string
) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

function formatDayName(
  value: string
) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
    }
  );
}

function formatTime(
  value?: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdminAttendancePage() {
  /* =======================================================
     FACULTY / SUBJECT OPTIONS
  ======================================================= */

  const [
    faculties,
    setFaculties,
  ] =
    useState<Faculty[]>(
      []
    );

  const [
    subjects,
    setSubjects,
  ] =
    useState<SubjectOption[]>(
      []
    );

  /* =======================================================
     ATTENDANCE DATA
  ======================================================= */

  const [
    activity,
    setActivity,
  ] =
    useState<FacultyActivity | null>(
      null
    );

  const [
    selectedSummary,
    setSelectedSummary,
  ] =
    useState<SelectedSummary>(
      EMPTY_SELECTED_SUMMARY
    );

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<
      | "MARKED"
      | "NOT_MARKED"
      | "NO_CLASS"
      | "NO_FACULTY_SELECTED"
    >(
      "NO_FACULTY_SELECTED"
    );

  /* =======================================================
     FILTERS

     BRANCH
     ↓
     FACULTY
     ↓
     SEMESTER
     ↓
     SUBJECT
     ↓
     SECTION
     ↓
     DATE
  ======================================================= */

  const [
    selectedBranch,
    setSelectedBranch,
  ] =
    useState("");

  const [
    selectedFaculty,
    setSelectedFaculty,
  ] =
    useState("");

  const [
    selectedSemester,
    setSelectedSemester,
  ] =
    useState("");

  const [
    selectedSubject,
    setSelectedSubject,
  ] =
    useState("");

  const [
    selectedSection,
    setSelectedSection,
  ] =
    useState("");

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState("");

  /* =======================================================
     UI
  ======================================================= */

  const [
    loadingInitial,
    setLoadingInitial,
  ] =
    useState(true);

  const [
    loadingSubjects,
    setLoadingSubjects,
  ] =
    useState(false);

  const [
    loadingAttendance,
    setLoadingAttendance,
  ] =
    useState(false);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     COMPLETE FILTER
  ======================================================= */

  const filtersComplete =
    Boolean(
      selectedBranch &&
        selectedFaculty &&
        selectedSemester &&
        selectedSubject &&
        selectedSection &&
        selectedDate
    );

  /* =======================================================
     CLEAR MONITORING
  ======================================================= */

  const clearMonitoring =
    useCallback(() => {
      setActivity(null);

      setSelectedSummary(
        EMPTY_SELECTED_SUMMARY
      );

      setSelectedStatus(
        "NO_FACULTY_SELECTED"
      );
    }, []);

  /* =======================================================
     INITIAL LOAD
     
     Branch, semester and section lists are static.
     API is used only for faculty.
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const loadInitial =
      async () => {
        try {
          setLoadingInitial(
            true
          );

          setError("");

          const response =
            await fetch(
              "/api/admin/attendance",
              {
                method:
                  "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const data =
            (await response.json()) as ApiResponse;

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load faculty list."
            );
          }

          if (
            cancelled
          ) {
            return;
          }

          setFaculties(
            data.filters
              ?.faculty ||
              []
          );
        } catch (
          initialError
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "ADMIN ATTENDANCE INITIAL ERROR:",
            initialError
          );

          setError(
            initialError instanceof Error
              ? initialError.message
              : "Unable to load faculty list."
          );
        } finally {
          if (
            !cancelled
          ) {
            setLoadingInitial(
              false
            );
          }
        }
      };

    void loadInitial();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* =======================================================
     FACULTIES BY BRANCH
  ======================================================= */

  const filteredFaculties =
    useMemo(() => {
      if (
        !selectedBranch
      ) {
        return [];
      }

      return faculties.filter(
        (faculty) =>
          faculty.department ===
          selectedBranch
      );
    }, [
      faculties,
      selectedBranch,
    ]);

  /* =======================================================
     LOAD ALL SUBJECTS FOR SELECTED SEMESTER
  ======================================================= */

  const loadSemesterSubjects =
    useCallback(
      async (
        semesterValue: string
      ) => {
        if (
          !semesterValue
        ) {
          setSubjects(
            []
          );

          return;
        }

        try {
          setLoadingSubjects(
            true
          );

          setError("");

          const response =
            await fetch(
              `/api/admin/attendance?semester=${encodeURIComponent(
                semesterValue
              )}`,
              {
                method:
                  "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const data =
            (await response.json()) as ApiResponse;

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load subjects."
            );
          }

          setSubjects(
            data.filters
              ?.subjects ||
              []
          );
        } catch (
          subjectError
        ) {
          console.error(
            "ADMIN ATTENDANCE SUBJECT ERROR:",
            subjectError
          );

          setSubjects([]);

          setError(
            subjectError instanceof Error
              ? subjectError.message
              : "Unable to load subjects."
          );
        } finally {
          setLoadingSubjects(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD ATTENDANCE
     
     ONLY AFTER ALL FILTERS.
  ======================================================= */

  const loadAttendance =
    useCallback(
      async (
        showRefresh = false
      ) => {
        if (
          !filtersComplete
        ) {
          return;
        }

        try {
          if (
            showRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoadingAttendance(
              true
            );
          }

          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "department",
            selectedBranch
          );

          params.set(
            "facultyId",
            selectedFaculty
          );

          params.set(
            "semester",
            selectedSemester
          );

          params.set(
            "subjectId",
            selectedSubject
          );

          params.set(
            "section",
            selectedSection
          );

          params.set(
            "date",
            selectedDate
          );

          const response =
            await fetch(
              `/api/admin/attendance?${params.toString()}`,
              {
                method:
                  "GET",
                credentials:
                  "include",
                cache:
                  "no-store",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data =
            (await response.json()) as ApiResponse;

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Failed to load attendance."
            );
          }

          setActivity(
            data.facultyActivity?.[0] ||
              null
          );

          setSelectedSummary(
            data.selected
              ?.summary ||
              EMPTY_SELECTED_SUMMARY
          );

          setSelectedStatus(
            data.selected
              ?.status ||
              "NO_FACULTY_SELECTED"
          );
        } catch (
          attendanceError
        ) {
          console.error(
            "ADMIN ATTENDANCE LOAD ERROR:",
            attendanceError
          );

          setError(
            attendanceError instanceof Error
              ? attendanceError.message
              : "Failed to load attendance."
          );

          clearMonitoring();
        } finally {
          setLoadingAttendance(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        filtersComplete,
        selectedBranch,
        selectedFaculty,
        selectedSemester,
        selectedSubject,
        selectedSection,
        selectedDate,
        clearMonitoring,
      ]
    );

  /* =======================================================
     AUTO ATTENDANCE LOAD
  ======================================================= */

  useEffect(() => {
    if (
      !filtersComplete
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadAttendance(
            false
          );
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    filtersComplete,
    loadAttendance,
  ]);

  /* =======================================================
     SELECTED FACULTY
  ======================================================= */

  const selectedFacultyInfo =
    useMemo(
      () =>
        faculties.find(
          (faculty) =>
            faculty.id ===
            selectedFaculty
        ) ||
        null,
      [
        faculties,
        selectedFaculty,
      ]
    );

  /* =======================================================
     HANDLERS
  ======================================================= */

  function handleBranchChange(
    value: string
  ) {
    setSelectedBranch(
      value
    );

    setSelectedFaculty(
      ""
    );

    setSelectedSemester(
      ""
    );

    setSelectedSubject(
      ""
    );

    setSelectedSection(
      ""
    );

    setSelectedDate(
      ""
    );

    setSubjects(
      []
    );

    clearMonitoring();

    setError("");
  }

  function handleFacultyChange(
    value: string
  ) {
    setSelectedFaculty(
      value
    );

    setSelectedSemester(
      ""
    );

    setSelectedSubject(
      ""
    );

    setSelectedSection(
      ""
    );

    setSelectedDate(
      ""
    );

    setSubjects(
      []
    );

    clearMonitoring();

    setError("");
  }

  async function handleSemesterChange(
    value: string
  ) {
    setSelectedSemester(
      value
    );

    setSelectedSubject(
      ""
    );

    setSelectedSection(
      ""
    );

    setSelectedDate(
      ""
    );

    clearMonitoring();

    setError("");

    await loadSemesterSubjects(
      value
    );
  }

  function handleSubjectChange(
    value: string
  ) {
    setSelectedSubject(
      value
    );

    setSelectedSection(
      ""
    );

    setSelectedDate(
      ""
    );

    clearMonitoring();

    setError("");
  }

  function handleSectionChange(
    value: string
  ) {
    setSelectedSection(
      value
    );

    setSelectedDate(
      ""
    );

    clearMonitoring();

    setError("");
  }

  function handleDateChange(
    value: string
  ) {
    setSelectedDate(
      value
    );

    clearMonitoring();

    setError("");
  }

  function clearFilters() {
    setSelectedBranch(
      ""
    );

    setSelectedFaculty(
      ""
    );

    setSelectedSemester(
      ""
    );

    setSelectedSubject(
      ""
    );

    setSelectedSection(
      ""
    );

    setSelectedDate(
      ""
    );

    setSubjects(
      []
    );

    clearMonitoring();

    setError("");
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f4f7fb] px-4 py-5 md:px-6 lg:px-8">

      <div className="w-full">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            <AlertCircle
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
              className="rounded-md p-1 hover:bg-red-100"
            >
              <X size={15} />
            </button>

          </div>
        )}

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative mb-6 h-[280px] overflow-hidden rounded-[26px] bg-gradient-to-br from-[#07132f] via-[#102a62] to-[#1d4ed8] px-7 py-8 shadow-[0_20px_50px_rgba(30,64,175,0.18)] sm:px-9">

          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/10" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-semibold text-blue-100">

                <ClipboardCheck
                  size={14}
                />

                Faculty Subject Attendance

              </div>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">

                Monitor one subject.

                <br />

                <span className="text-blue-200">
                  Day by day.
                </span>

              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/75">
                Complete all filters first. Attendance
                data is loaded only after the selected
                date.
              </p>

            </div>

            {filtersComplete && (
              <div className="grid grid-cols-2 gap-3">

                <MiniMetric
                  label="Marked"
                  value={String(
                    selectedSummary
                      .sevenDayMarked
                  )}
                  icon={
                    <Check size={18} />
                  }
                />

                <MiniMetric
                  label="Not Marked"
                  value={String(
                    selectedSummary
                      .sevenDayNotMarked
                  )}
                  icon={
                    <X size={18} />
                  }
                />

                <MiniMetric
                  label="No Class"
                  value={String(
                    selectedSummary
                      .sevenDayNoClass
                  )}
                  icon={
                    <CalendarDays
                      size={18}
                    />
                  }
                />

                <MiniMetric
                  label="Sessions"
                  value={String(
                    selectedSummary
                      .sevenDaySessions
                  )}
                  icon={
                    <BarChart3
                      size={18}
                    />
                  }
                />

              </div>
            )}

          </div>

        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Filter size={19} />
              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  FILTERS
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Attendance Selection
                </h2>

              </div>

            </div>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {/* =================================================
                BRANCH
            ================================================= */}

            <FilterSelect
              label="Branch"
              value={
                selectedBranch
              }
              disabled={
                false
              }
              onChange={
                handleBranchChange
              }
            >

              <option value="">
                Select Branch
              </option>

              {BRANCH_OPTIONS.map(
                (branch) => (
                  <option
                    key={
                      branch
                    }
                    value={
                      branch
                    }
                  >
                    {branch}
                  </option>
                )
              )}

            </FilterSelect>

            {/* =================================================
                FACULTY
            ================================================= */}

            <FilterSelect
              label="Faculty"
              value={
                selectedFaculty
              }
              disabled={
                !selectedBranch ||
                loadingInitial
              }
              onChange={
                handleFacultyChange
              }
            >

              <option value="">
                {!selectedBranch
                  ? "Select Branch First"
                  : loadingInitial
                  ? "Loading Faculty..."
                  : "Select Faculty"}
              </option>

              {filteredFaculties.map(
                (faculty) => (
                  <option
                    key={
                      faculty.id
                    }
                    value={
                      faculty.id
                    }
                  >
                    {faculty.name}
                  </option>
                )
              )}

            </FilterSelect>

            {/* =================================================
                SEMESTER
            ================================================= */}

            <FilterSelect
              label="Semester"
              value={
                selectedSemester
              }
              disabled={
                !selectedFaculty
              }
              onChange={
                handleSemesterChange
              }
            >

              <option value="">
                {!selectedFaculty
                  ? "Select Faculty First"
                  : "Select Semester"}
              </option>

              {SEMESTER_OPTIONS.map(
                (
                  semester
                ) => (
                  <option
                    key={
                      semester
                    }
                    value={`Semester ${semester}`}
                  >
                    Semester{" "}
                    {semester}
                  </option>
                )
              )}

            </FilterSelect>

            {/* =================================================
                SUBJECT
            ================================================= */}

            <FilterSelect
              label="Subject"
              value={
                selectedSubject
              }
              disabled={
                !selectedSemester ||
                loadingSubjects
              }
              onChange={
                handleSubjectChange
              }
            >

              <option value="">
                {!selectedSemester
                  ? "Select Semester First"
                  : loadingSubjects
                  ? "Loading Subjects..."
                  : "Select Subject"}
              </option>

              {subjects.map(
                (
                  subject
                ) => (
                  <option
                    key={
                      subject.id
                    }
                    value={
                      subject.id
                    }
                  >
                    {subject.name}
                  </option>
                )
              )}

            </FilterSelect>

            {/* =================================================
                SECTION
            ================================================= */}

            <FilterSelect
              label="Section"
              value={
                selectedSection
              }
              disabled={
                !selectedSubject
              }
              onChange={
                handleSectionChange
              }
            >

              <option value="">
                {!selectedSubject
                  ? "Select Subject First"
                  : "Select Section"}
              </option>

              {SECTION_OPTIONS.map(
                (
                  section
                ) => (
                  <option
                    key={
                      section.value
                    }
                    value={
                      section.value
                    }
                  >
                    {
                      section.label
                    }
                  </option>
                )
              )}

            </FilterSelect>

            {/* =================================================
                DATE
            ================================================= */}

            <div>

              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Date
              </label>

              <div className="relative">

                <CalendarDays
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  disabled={
                    !selectedSection
                  }
                  onChange={(
                    event
                  ) =>
                    handleDateChange(
                      event.target
                        .value
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              FILTER FLOW
          ================================================= */}

          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">

            <FlowStep
              label="Branch"
              active={
                Boolean(
                  selectedBranch
                )
              }
            />

            <Arrow />

            <FlowStep
              label="Faculty"
              active={
                Boolean(
                  selectedFaculty
                )
              }
            />

            <Arrow />

            <FlowStep
              label="Semester"
              active={
                Boolean(
                  selectedSemester
                )
              }
            />

            <Arrow />

            <FlowStep
              label="Subject"
              active={
                Boolean(
                  selectedSubject
                )
              }
            />

            <Arrow />

            <FlowStep
              label="Section"
              active={
                Boolean(
                  selectedSection
                )
              }
            />

            <Arrow />

            <FlowStep
              label="Date"
              active={
                Boolean(
                  selectedDate
                )
              }
            />

          </div>

        </section>

        {/* =================================================
            WAITING STATE
        ================================================= */}

        {!filtersComplete ? (

          <section className="rounded-[24px] border border-dashed border-blue-200 bg-blue-50/40 px-6 py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm">

              <ClipboardCheck
                size={28}
              />

            </div>

            <h2 className="mt-5 text-xl font-black text-slate-800">
              Complete the attendance filters
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Branch → Faculty → Semester → Subject →
              Section → Date. Attendance information
              will appear only after the final date
              is selected.
            </p>

          </section>

        ) : (

          <>

            {/* =================================================
                SELECTED SUBJECT HEADER
            ================================================= */}

            <section className="mb-6 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">

                    <GraduationCap
                      size={25}
                    />

                  </div>

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                      SELECTED SUBJECT
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-900">

                      {subjects.find(
                        (
                          subject
                        ) =>
                          subject.id ===
                          selectedSubject
                      )?.name ||
                        "Subject"}

                    </h2>

                    <p className="mt-1 text-xs text-slate-500">

                      {
                        selectedFacultyInfo
                          ?.name
                      }

                      {" • "}

                      {selectedSemester}

                      {" • "}

                      {
                        SECTION_OPTIONS.find(
                          (
                            item
                          ) =>
                            item.value ===
                            selectedSection
                        )?.label ||
                        selectedSection
                      }

                    </p>

                  </div>

                </div>

                {loadingAttendance ? (

                  <StatusBadge
                    type="loading"
                  />

                ) : selectedStatus ===
                  "MARKED" ? (

                  <StatusBadge
                    type="marked"
                  />

                ) : selectedStatus ===
                  "NOT_MARKED" ? (

                  <StatusBadge
                    type="notMarked"
                  />

                ) : (

                  <StatusBadge
                    type="noClass"
                  />

                )}

              </div>

              {/* =================================================
                  DATE DETAILS
              ================================================= */}

              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-6 sm:grid-cols-2 lg:grid-cols-4">

                <InfoBox
                  label="Date"
                  value={formatDate(
                    selectedDate
                  )}
                  icon={
                    <CalendarDays
                      size={18}
                    />
                  }
                />

                <InfoBox
                  label="Subject"
                  value={
                    selectedSummary
                      .subject
                      ?.name ||
                    "—"
                  }
                  icon={
                    <ClipboardCheck
                      size={18}
                    />
                  }
                />

                <InfoBox
                  label="Semester / Section"
                  value={`${selectedSemester} • ${
                    SECTION_OPTIONS.find(
                      (
                        item
                      ) =>
                        item.value ===
                        selectedSection
                    )?.label ||
                    selectedSection
                  }`}
                  icon={
                    <GraduationCap
                      size={18}
                    />
                  }
                />

                <InfoBox
                  label="Last Marked"
                  value={formatTime(
                    selectedSummary.lastMarkedAt
                  )}
                  icon={
                    <Clock3
                      size={18}
                    />
                  }
                />

              </div>

              {/* =================================================
                  ATTENDANCE RECORD
              ================================================= */}

              {selectedStatus ===
              "MARKED" ? (

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 p-6 sm:grid-cols-4">

                  <SummaryBox
                    label="Present"
                    value={
                      selectedSummary
                        .present
                    }
                    icon={
                      <CheckCircle2
                        size={17}
                      />
                    }
                    tone="green"
                  />

                  <SummaryBox
                    label="Absent"
                    value={
                      selectedSummary
                        .absent
                    }
                    icon={
                      <XCircle
                        size={17}
                      />
                    }
                    tone="red"
                  />

                  <SummaryBox
                    label="Late"
                    value={
                      selectedSummary
                        .late
                    }
                    icon={
                      <Clock3
                        size={17}
                      />
                    }
                    tone="amber"
                  />

                  <SummaryBox
                    label="Students"
                    value={
                      selectedSummary
                        .attendanceRecords
                    }
                    icon={
                      <Users
                        size={17}
                      />
                    }
                    tone="blue"
                  />

                </div>

              ) : selectedStatus ===
                "NOT_MARKED" ? (

                <div className="border-t border-red-100 bg-red-50/60 px-6 py-5">

                  <div className="flex items-start gap-3">

                    <XCircle
                      size={19}
                      className="mt-0.5 text-red-500"
                    />

                    <div>

                      <p className="text-sm font-bold text-red-700">
                        Attendance is not marked.
                      </p>

                      <p className="mt-1 text-xs text-red-600/80">
                        ClassSession exists for this
                        subject/date, but no student
                        attendance records were saved.
                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">

                  <div className="flex items-start gap-3">

                    <CalendarDays
                      size={19}
                      className="mt-0.5 text-slate-400"
                    />

                    <div>

                      <p className="text-sm font-bold text-slate-700">
                        No class session found.
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        No class was recorded for this
                        subject on the selected date.
                      </p>

                    </div>

                  </div>

                </div>

              )}

            </section>

            {/* =================================================
                7 DAY
            ================================================= */}

            <section className="mb-6 rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                    7 DAY SUBJECT MONITORING
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-900">

                    {
                      selectedSummary
                        .subject
                        ?.name ||
                      "Selected Subject"
                    }

                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Exact selected subject attendance
                    status for each of the seven days.
                  </p>

                </div>

                <div className="flex flex-wrap items-center gap-4">

                  <Legend
                    color="bg-emerald-500"
                    label="Marked"
                  />

                  <Legend
                    color="bg-red-400"
                    label="Not Marked"
                  />

                  <Legend
                    color="bg-slate-300"
                    label="No Class"
                  />

                </div>

              </div>

              {loadingAttendance ? (

                <div className="flex min-h-[270px] items-center justify-center">

                  <RefreshCw
                    size={22}
                    className="animate-spin text-blue-500"
                  />

                </div>

              ) : activity ? (

                <SubjectSevenDayTable
                  activity={
                    activity
                  }
                  selectedDate={
                    selectedDate
                  }
                  onDateSelect={
                    handleDateChange
                  }
                />

              ) : (

                <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">

                  <p className="text-sm text-slate-400">
                    No seven-day data available.
                  </p>

                </div>

              )}

            </section>

            {/* =================================================
                GRAPH + TOP LEVEL
            ================================================= */}

            <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">

              {/* GRAPH */}

              <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-6 flex items-center justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                      ATTENDANCE CHART
                    </p>

                    <h2 className="mt-1 text-xl font-black text-slate-900">
                      Seven Day Marking Graph
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        selectedSummary
                          .subject
                          ?.name
                      }
                    </p>

                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <BarChart3
                      size={19}
                    />

                  </div>

                </div>

                <SubjectGraph
                  days={
                    activity?.days ||
                    []
                  }
                />

              </div>

              {/* TOP RECORD */}

              <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                  TOP LEVEL RECORD
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Subject Summary
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <SmallDataCard
                    label="Marked Days"
                    value={
                      selectedSummary
                        .sevenDayMarked
                    }
                  />

                  <SmallDataCard
                    label="Not Marked"
                    value={
                      selectedSummary
                        .sevenDayNotMarked
                    }
                  />

                  <SmallDataCard
                    label="No Class"
                    value={
                      selectedSummary
                        .sevenDayNoClass
                    }
                  />

                  <SmallDataCard
                    label="Sessions"
                    value={
                      selectedSummary
                        .sevenDaySessions
                    }
                  />

                  <SmallDataCard
                    label="Present"
                    value={
                      selectedSummary
                        .present
                    }
                  />

                  <SmallDataCard
                    label="Absent"
                    value={
                      selectedSummary
                        .absent
                    }
                  />

                </div>

                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
                        Selected Date Attendance
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-900">

                        {
                          selectedSummary
                            .attendancePercentage
                        }
                        %

                      </p>

                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">

                      <ShieldCheck
                        size={21}
                      />

                    </div>

                  </div>

                </div>

              </div>

            </section>

          </>

        )}

      </div>
    </main>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 text-white backdrop-blur-sm">

      <div className="flex items-center gap-2.5">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-100">
          {icon}
        </div>

        <div>

          <p className="text-[9px] font-bold uppercase tracking-wide text-blue-100/60">
            {label}
          </p>

          <p className="mt-0.5 text-lg font-black">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="relative">

        <select
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target
                .value
            )
          }
          className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {children}
        </select>

        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

      </div>

    </div>
  );
}

/* =========================================================
   FLOW STEP
========================================================= */

function FlowStep({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-400"
      }`}
    >

      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-emerald-500"
            : "bg-slate-300"
        }`}
      />

      {label}

    </span>
  );
}

/* =========================================================
   ARROW
========================================================= */

function Arrow() {
  return (
    <span className="text-slate-300">
      →
    </span>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <div className="flex items-center gap-2 text-slate-400">

        {icon}

        <span className="text-[10px] font-bold uppercase tracking-wide">
          {label}
        </span>

      </div>

      <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-800">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  type,
}: {
  type:
    | "loading"
    | "marked"
    | "notMarked"
    | "noClass";
}) {
  if (
    type ===
    "loading"
  ) {
    return (
      <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-blue-700">

        <RefreshCw
          size={18}
          className="animate-spin"
        />

        <span className="text-sm font-black">
          Checking...
        </span>

      </div>
    );
  }

  if (
    type ===
    "marked"
  ) {
    return (
      <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-emerald-700">

        <CheckCircle2
          size={19}
        />

        <div>

          <p className="text-[10px] font-bold uppercase tracking-wide">
            Attendance
          </p>

          <p className="mt-0.5 text-base font-black">
            Marked
          </p>

        </div>

      </div>
    );
  }

  if (
    type ===
    "notMarked"
  ) {
    return (
      <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-red-700">

        <XCircle
          size={19}
        />

        <div>

          <p className="text-[10px] font-bold uppercase tracking-wide">
            Attendance
          </p>

          <p className="mt-0.5 text-base font-black">
            Not Marked
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-600">

      <CalendarDays
        size={19}
      />

      <div>

        <p className="text-[10px] font-bold uppercase tracking-wide">
          Session
        </p>

        <p className="mt-0.5 text-base font-black">
          No Class
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   SUMMARY BOX
========================================================= */

function SummaryBox({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone:
    | "green"
    | "red"
    | "amber"
    | "blue";
}) {
  const tones = {
    green:
      "bg-emerald-50 text-emerald-600",
    red:
      "bg-red-50 text-red-600",
    amber:
      "bg-amber-50 text-amber-600",
    blue:
      "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">

      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        {icon}
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   SMALL CARD
========================================================= */

function SmallDataCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-900">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   LEGEND
========================================================= */

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">

      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      <span className="text-[10px] font-semibold text-slate-500">
        {label}
      </span>

    </div>
  );
}

/* =========================================================
   7 DAY TABLE
========================================================= */

function SubjectSevenDayTable({
  activity,
  selectedDate,
  onDateSelect,
}: {
  activity: FacultyActivity;
  selectedDate: string;
  onDateSelect: (
    value: string
  ) => void;
}) {
  const subjectName =
    activity.days.find(
      (day) =>
        day.subject
    )?.subject
      ?.name ||
    "Selected Subject";

  return (
    <div className="overflow-x-auto">

      <div className="min-w-[1100px]">

        {/* HEADER */}

        <div className="grid grid-cols-[220px_repeat(7,minmax(110px,1fr))_100px] gap-2 border-b border-slate-100 pb-3">

          <div className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Subject
          </div>

          {activity.days.map(
            (day) => (
              <div
                key={
                  day.date
                }
                className={`rounded-xl px-2 py-2 text-center ${
                  day.date ===
                  selectedDate
                    ? "bg-blue-50"
                    : ""
                }`}
              >

                <p className="text-[9px] font-bold text-slate-400">
                  {formatDayName(
                    day.date
                  )}
                </p>

                <p className="mt-0.5 text-[10px] font-black text-slate-700">
                  {formatDay(
                    day.date
                  )}
                </p>

              </div>
            )
          )}

          <div className="text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">
            Marked
          </div>

        </div>

        {/* BODY */}

        <div className="grid grid-cols-[220px_repeat(7,minmax(110px,1fr))_100px] items-stretch gap-2 py-5">

          {/* SUBJECT */}

          <div className="flex items-center px-3">

            <div>

              <p className="text-sm font-black text-slate-800">
                {
                  subjectName
                }
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {
                  selectedSummarySemester(
                    activity
                  )
                }
              </p>

            </div>

          </div>

          {/* 7 DAYS */}

          {activity.days.map(
            (day) => (
              <button
                key={
                  day.date
                }
                type="button"
                onClick={() =>
                  onDateSelect(
                    day.date
                  )
                }
                className={`min-h-[110px] rounded-xl border p-2 text-center transition hover:-translate-y-0.5 ${
                  day.date ===
                  selectedDate
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >

                {day.status ===
                "MARKED" ? (

                  <>
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">

                      <Check
                        size={17}
                        strokeWidth={
                          2.8
                        }
                      />

                    </div>

                    <p className="mt-2 line-clamp-2 text-[10px] font-bold text-slate-700">
                      {
                        day.subject
                          ?.name ||
                        subjectName
                      }
                    </p>

                    <p className="mt-1 text-[9px] font-semibold text-emerald-600">
                      Marked
                    </p>
                  </>

                ) : day.status ===
                  "NOT_MARKED" ? (

                  <>
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-500">

                      <X
                        size={17}
                      />

                    </div>

                    <p className="mt-2 line-clamp-2 text-[10px] font-bold text-slate-700">
                      {
                        day.subject
                          ?.name ||
                        subjectName
                      }
                    </p>

                    <p className="mt-1 text-[9px] font-semibold text-red-500">
                      Not Marked
                    </p>
                  </>

                ) : (

                  <>
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-400">

                      <CalendarDays
                        size={16}
                      />

                    </div>

                    <p className="mt-2 text-[10px] font-bold text-slate-400">
                      No Class
                    </p>
                  </>

                )}

              </button>
            )
          )}

          {/* MARKED COUNT */}

          <div className="flex items-center justify-center">

            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">

              {
                activity.markedDays
              }
              /
              {
                activity.totalDays
              }

            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   HELPER FOR TABLE
========================================================= */

function selectedSummarySemester(
  activity: FacultyActivity
) {
  const semester =
    activity.days.find(
      (day) =>
        day.subject
    )?.subject
      ?.semester;

  return semester
    ? `Semester ${semester}`
    : "Selected Semester";
}

/* =========================================================
   GRAPH
========================================================= */

function SubjectGraph({
  days,
}: {
  days: DayActivity[];
}) {
  if (
    days.length ===
    0
  ) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">

        <p className="text-sm text-slate-400">
          No graph data available.
        </p>

      </div>
    );
  }

  return (
    <div>

      <div className="flex min-h-[270px] items-end gap-3 border-b border-slate-100 px-2 pb-8 pt-5">

        {days.map(
          (day) => {

            const height =
              day.status ===
              "MARKED"
                ? 160
                : day.status ===
                  "NOT_MARKED"
                ? 75
                : 22;

            const barClass =
              day.status ===
              "MARKED"
                ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                : day.status ===
                  "NOT_MARKED"
                ? "bg-gradient-to-t from-red-500 to-red-300"
                : "bg-slate-200";

            return (
              <div
                key={
                  day.date
                }
                className="flex h-[230px] flex-1 flex-col items-center justify-end"
              >

                <div className="mb-2 text-[10px] font-black text-slate-500">

                  {day.status ===
                  "MARKED"
                    ? "✓"
                    : day.status ===
                      "NOT_MARKED"
                    ? "!"
                    : "—"}

                </div>

                <div
                  className={`w-full max-w-[48px] rounded-t-xl ${barClass}`}
                  style={{
                    height:
                      `${height}px`,
                  }}
                />

                <p className="mt-3 text-[9px] font-bold text-slate-400">
                  {formatDayName(
                    day.date
                  )}
                </p>

                <p className="text-[9px] font-semibold text-slate-500">
                  {formatDay(
                    day.date
                  )}
                </p>

              </div>
            );
          }
        )}

      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">

          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            Marked
          </p>

          <p className="mt-1 text-2xl font-black text-emerald-700">

            {
              days.filter(
                (day) =>
                  day.status ===
                  "MARKED"
              ).length
            }

          </p>

        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">

          <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
            Not Marked
          </p>

          <p className="mt-1 text-2xl font-black text-red-700">

            {
              days.filter(
                (day) =>
                  day.status ===
                  "NOT_MARKED"
              ).length
            }

          </p>

        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">

          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            No Class
          </p>

          <p className="mt-1 text-2xl font-black text-slate-700">

            {
              days.filter(
                (day) =>
                  day.status ===
                  "NO_CLASS"
              ).length
            }

          </p>

        </div>

      </div>

    </div>
  );
}