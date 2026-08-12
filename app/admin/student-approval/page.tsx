"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  createdAt?: string;
  registeredAt?: string;
  approvalStatus?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

interface ApiResponse {
  students?: Student[];
  data?: Student[] | { students?: Student[] };
  message?: string;
}

type FilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function StudentApprovalPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [rejectingStudent, setRejectingStudent] =
    useState<Student | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const extractStudents = (payload: ApiResponse): Student[] => {
    if (Array.isArray(payload.students)) {
      return payload.students;
    }

    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (
      payload.data &&
      !Array.isArray(payload.data) &&
      Array.isArray(payload.data.students)
    ) {
      return payload.data.students;
    }

    return [];
  };

  const loadStudents = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/admin/approvals/students",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load student approval requests. (${response.status})`
          );
        }

        const payload: ApiResponse = await response.json();

        setStudents(extractStudents(payload));
      } catch (err) {
        console.error(
          "STUDENT APPROVAL LOAD ERROR:",
          err
        );

        setError(
          "Unable to load student approval requests."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    // The fetch updates React state after the request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStudents();
  }, [loadStudents]);

  const getStatus = (student: Student) => {
    return (
      student.approvalStatus?.toUpperCase() ||
      "PENDING"
    );
  };

  const pendingStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          getStatus(student) === "PENDING"
      ),
    [students]
  );

  const approvedStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          getStatus(student) === "APPROVED"
      ),
    [students]
  );

  const rejectedStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          getStatus(student) === "REJECTED"
      ),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const status = getStatus(student);

      const matchesFilter =
        filter === "ALL" ||
        status === filter;

      const matchesSearch =
        !query ||
        student.name
          ?.toLowerCase()
          .includes(query) ||
        student.email
          ?.toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [students, search, filter]);

  const handleApprove = async (
    student: Student
  ) => {
    try {
      setProcessingId(student.id);

      const response = await fetch(
        "/api/admin/approvals/students",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId: student.id,
            action: "APPROVE",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to approve student."
        );
      }

      await loadStudents(true);
      setSelectedStudent(null);
    } catch (err) {
      console.error(
        "STUDENT APPROVAL ERROR:",
        err
      );

      setError(
        "Unable to approve the student."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingStudent) {
      return;
    }

    try {
      setProcessingId(rejectingStudent.id);

      const response = await fetch(
        "/api/admin/approvals/students",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId: rejectingStudent.id,
            action: "REJECT",
            rejectionReason:
              rejectionReason.trim() ||
              "Registration request rejected by administrator.",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to reject student."
        );
      }

      setRejectingStudent(null);
      setRejectionReason("");
      setSelectedStudent(null);

      await loadStudents(true);
    } catch (err) {
      console.error(
        "STUDENT REJECTION ERROR:",
        err
      );

      setError(
        "Unable to reject the student."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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
  };

  const getInitials = (
    name: string
  ) => {
    return (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "ST"
    );
  };

  const statusBadge = (
    status: string
  ) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          Approved
        </span>
      );
    }

    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
          <XCircle size={14} />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Clock3 size={14} />
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#07132f] via-[#102a62] to-[#1d4ed8] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                <ShieldCheck size={15} />
                Administrative Verification Center
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Student Acceptance
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Review student registration requests,
                verify applicant information, and manage
                admission approvals from one secure workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadStudents(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh Data
            </button>
          </div>
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setFilter("PENDING")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Awaiting Review
                </p>

                <p className="mt-3 text-3xl font-black text-slate-900">
                  {pendingStudents.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Applications pending approval
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock3 size={22} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter("APPROVED")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Accepted
                </p>

                <p className="mt-3 text-3xl font-black text-slate-900">
                  {approvedStudents.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Successfully approved students
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Applications
                </p>

                <p className="mt-3 text-3xl font-black text-slate-900">
                  {students.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  All registration requests
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>
            </div>
          </button>
        </section>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => loadStudents(true)}
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* =====================================================
            APPLICATIONS
        ====================================================== */}

        <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          {/* HEADER */}
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap
                    size={20}
                    className="text-blue-600"
                  />

                  <h2 className="text-lg font-black text-slate-900">
                    Registration Applications
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Review and manage student applications.
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative w-full xl:w-[330px]">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by name or email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* FILTERS */}
            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  ["ALL", "All Applications"],
                  ["PENDING", "Pending"],
                  ["APPROVED", "Approved"],
                  ["REJECTED", "Rejected"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    filter === value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            /* EMPTY */
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={28} />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-800">
                No applications found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                There are no student applications matching
                your current search or filter.
              </p>
            </div>
          ) : (
            /* LIST */
            <div className="divide-y divide-slate-100">
              {filteredStudents.map(
                (student) => {
                  const status =
                    getStatus(student);

                  return (
                    <div
                      key={student.id}
                      className="group flex flex-col gap-5 p-5 transition hover:bg-slate-50/70 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
                    >
                      {/* STUDENT */}
                      <div className="flex min-w-0 items-center gap-4">
                        {student.profileImage ? (
                          <img
                            src={student.profileImage}
                            alt={student.name}
                            className="h-14 w-14 rounded-2xl object-cover ring-4 ring-slate-100"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
                            {getInitials(
                              student.name
                            )}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-slate-900 sm:text-base">
                            {student.name}
                          </h3>

                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {student.email}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Registered{" "}
                            {formatDate(
                              student.registeredAt ||
                                student.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {statusBadge(status)}

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedStudent(
                              student
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        {status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={
                                processingId ===
                                student.id
                              }
                              onClick={() =>
                                handleApprove(
                                  student
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check size={15} />
                              Approve
                            </button>

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                student.id
                              }
                              onClick={() =>
                                setRejectingStudent(
                                  student
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              <X size={15} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="flex flex-col gap-2 px-1 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            CampusConnect Administrative Portal
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Approval system operational
          </span>
        </div>
      </div>

      {/* =====================================================
          STUDENT DETAILS MODAL
      ====================================================== */}

      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-[#07132f] to-blue-700 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                    Applicant Profile
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Student Details
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedStudent(null)
                  }
                  className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-lg font-black text-blue-700">
                  {getInitials(
                    selectedStudent.name
                  )}
                </div>

                <div>
                  <h3 className="font-black text-slate-900">
                    {selectedStudent.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {selectedStudent.email}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Registration Date
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(
                      selectedStudent.registeredAt ||
                        selectedStudent.createdAt
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Current Status
                  </p>

                  <div className="mt-2">
                    {statusBadge(
                      getStatus(
                        selectedStudent
                      )
                    )}
                  </div>
                </div>
              </div>

              {selectedStudent.rejectionReason && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-xs font-bold text-red-700">
                    Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-red-600">
                    {
                      selectedStudent.rejectionReason
                    }
                  </p>
                </div>
              )}

              {getStatus(selectedStudent) ===
                "PENDING" && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={
                      processingId ===
                      selectedStudent.id
                    }
                    onClick={() =>
                      handleApprove(
                        selectedStudent
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={17} />
                    Approve Student
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingStudent(
                        selectedStudent
                      );
                      setSelectedStudent(null);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    <X size={17} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          REJECTION MODAL
      ====================================================== */}

      {rejectingStudent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <XCircle size={22} />
                </div>

                <h2 className="mt-4 text-xl font-black text-slate-900">
                  Reject Application
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Rejecting registration for{" "}
                  <span className="font-bold text-slate-700">
                    {rejectingStudent.name}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRejectingStudent(null)
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value
                )
              }
              placeholder="Enter rejection reason..."
              rows={4}
              className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/10"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setRejectingStudent(null)
                }
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  processingId ===
                  rejectingStudent.id
                }
                onClick={handleReject}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {processingId ===
                rejectingStudent.id
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}