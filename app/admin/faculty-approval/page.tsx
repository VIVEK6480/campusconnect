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

interface Faculty {
  id: string;
  campusUserId?: string | null;
  name: string;
  email: string;
  profileImage?: string | null;
  role?: string | null;
  createdAt?: string;
  approvalStatus?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

interface ApiResponse {
  success?: boolean;
  faculty?: Faculty[];
  message?: string;
}

type FilterType =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export default function FacultyApprovalPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterType>("ALL");

  const [selectedFaculty, setSelectedFaculty] =
    useState<Faculty | null>(null);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [rejectingFaculty, setRejectingFaculty] =
    useState<Faculty | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  /*
   * =====================================================
   * API HEADERS
   * =====================================================
   *
   * Admin authentication uses the HTTP-only "token"
   * cookie created by /api/admin/login.
   *
   * credentials: "include" below makes the browser
   * automatically send that cookie with the request.
   */

  const getAuthHeaders = (): HeadersInit => {
    return {
      "Content-Type": "application/json",
    };
  };

  /*
   * =====================================================
   * LOAD FACULTY
   * =====================================================
   */

  const loadFaculty = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/admin/approvals/Faculty",
          {
            method: "GET",
            headers: getAuthHeaders(),
            credentials: "include",
            cache: "no-store",
          }
        );

        const payload: ApiResponse =
          await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.message ||
              `Unable to load faculty approvals. (${response.status})`
          );
        }

        if (!payload.success) {
          throw new Error(
            payload.message ||
              "Unable to load faculty approvals."
          );
        }

        setFaculty(payload.faculty || []);
      } catch (error) {
        console.error(
          "FACULTY APPROVAL LOAD ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load faculty approval requests."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFaculty();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadFaculty]);

  /*
   * =====================================================
   * STATUS
   * =====================================================
   */

  const getStatus = (member: Faculty) =>
    member.approvalStatus?.toUpperCase() ||
    "PENDING";

  /*
   * =====================================================
   * STATUS FILTERS
   * =====================================================
   */

  const pendingFaculty = useMemo(
    () =>
      faculty.filter(
        (member) =>
          getStatus(member) === "PENDING"
      ),
    [faculty]
  );

  const approvedFaculty = useMemo(
    () =>
      faculty.filter(
        (member) =>
          getStatus(member) === "APPROVED"
      ),
    [faculty]
  );

  const rejectedFaculty = useMemo(
    () =>
      faculty.filter(
        (member) =>
          getStatus(member) === "REJECTED"
      ),
    [faculty]
  );

  /*
   * =====================================================
   * SEARCH + FILTER
   * =====================================================
   */

  const filteredFaculty = useMemo(() => {
    const query = search.trim().toLowerCase();

    return faculty.filter((member) => {
      const status = getStatus(member);

      const matchesFilter =
        filter === "ALL" ||
        status === filter;

      const matchesSearch =
        !query ||
        member.name
          .toLowerCase()
          .includes(query) ||
        member.email
          .toLowerCase()
          .includes(query) ||
        member.campusUserId
          ?.toLowerCase()
          .includes(query);

      return (
        matchesFilter &&
        matchesSearch
      );
    });
  }, [faculty, search, filter]);

  /*
   * =====================================================
   * APPROVE FACULTY
   * =====================================================
   */

  const handleApprove = async (
    member: Faculty
  ) => {
    try {
      setProcessingId(member.id);
      setError("");

      const response = await fetch(
        "/api/admin/approvals/Faculty",
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            userId: member.id,
            action: "APPROVE",
          }),
        }
      );

      const payload: ApiResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message ||
            "Unable to approve faculty."
        );
      }

      setSelectedFaculty(null);

      await loadFaculty(true);
    } catch (error) {
      console.error(
        "FACULTY APPROVAL ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to approve the faculty member."
      );
    } finally {
      setProcessingId(null);
    }
  };

  /*
   * =====================================================
   * REJECT FACULTY
   * =====================================================
   */

  const handleReject = async () => {
    if (!rejectingFaculty) {
      return;
    }

    const reason = rejectionReason.trim();

    if (!reason) {
      setError(
        "Please enter a rejection reason."
      );
      return;
    }

    try {
      setProcessingId(
        rejectingFaculty.id
      );

      setError("");

      const response = await fetch(
        "/api/admin/approvals/Faculty",
        {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            userId: rejectingFaculty.id,
            action: "REJECT",
            rejectionReason: reason,
          }),
        }
      );

      const payload: ApiResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message ||
            "Unable to reject faculty."
        );
      }

      setRejectingFaculty(null);
      setRejectionReason("");
      setSelectedFaculty(null);

      await loadFaculty(true);
    } catch (error) {
      console.error(
        "FACULTY REJECTION ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to reject the faculty member."
      );
    } finally {
      setProcessingId(null);
    }
  };

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

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
  ) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

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

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HERO */}

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
                Faculty Acceptance
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Review faculty registration requests,
                verify applicant information, and manage
                faculty approvals from one secure workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadFaculty(true)
              }
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

        {/* SUMMARY */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <button
            type="button"
            onClick={() =>
              setFilter("PENDING")
            }
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Awaiting Review
                </p>

                <p className="mt-3 text-3xl font-black text-slate-900">
                  {pendingFaculty.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Faculty applications pending approval
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock3 size={22} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("APPROVED")
            }
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Accepted
                </p>

                <p className="mt-3 text-3xl font-black text-slate-900">
                  {approvedFaculty.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Successfully approved faculty
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("ALL")
            }
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Applications
                </p>

                <p className="mt-3 text-3xl font-black text-slate-900">
                  {faculty.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  All faculty applications
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>
            </div>
          </button>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                void loadFaculty(true)
              }
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* APPLICATIONS */}

        <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5 sm:p-6">

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap
                    size={20}
                    className="text-blue-600"
                  />

                  <h2 className="text-lg font-black text-slate-900">
                    Faculty Applications
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Review and manage faculty applications.
                </p>
              </div>

              <div className="relative w-full xl:w-[330px]">

                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search name, email or ID..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

            </div>

            <div className="mt-5 flex flex-wrap gap-2">

              {(
                [
                  ["ALL", "All Applications"],
                  ["PENDING", "Pending"],
                  ["APPROVED", "Approved"],
                  ["REJECTED", "Rejected"],
                ] as const
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(value)
                    }
                    className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                      filter === value
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}

            </div>
          </div>

          {/* CONTENT */}

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                  />
                )
              )}
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={28} />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-800">
                No faculty applications found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                There are no faculty applications matching
                your current search or filter.
              </p>

            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {filteredFaculty.map(
                (member) => {
                  const status =
                    getStatus(member);

                  return (
                    <div
                      key={member.id}
                      className="group flex flex-col gap-5 p-5 transition hover:bg-slate-50/70 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
                    >

                      <div className="flex min-w-0 items-center gap-4">

                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.name}
                            className="h-14 w-14 rounded-2xl object-cover ring-4 ring-slate-100"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">
                            {getInitials(
                              member.name
                            )}
                          </div>
                        )}

                        <div className="min-w-0">

                          <h3 className="truncate text-sm font-black text-slate-900 sm:text-base">
                            {member.name}
                          </h3>

                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {member.email}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID:{" "}
                            {member.campusUserId ||
                              "Not assigned"}
                            {" • "}
                            Registered{" "}
                            {formatDate(
                              member.createdAt
                            )}
                          </p>

                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">

                        {statusBadge(status)}

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFaculty(
                              member
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
                                member.id
                              }
                              onClick={() =>
                                void handleApprove(
                                  member
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
                                member.id
                              }
                              onClick={() =>
                                setRejectingFaculty(
                                  member
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

        <div className="flex flex-col gap-2 px-1 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            CampusConnect Administrative Portal
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Faculty approval system operational
          </span>
        </div>

      </div>

      {/* FACULTY DETAILS MODAL */}

      {selectedFaculty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="bg-gradient-to-br from-[#07132f] to-blue-700 p-6 text-white">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                    Faculty Profile
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Faculty Details
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFaculty(null)
                  }
                  className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>

              </div>
            </div>

            <div className="space-y-5 p-6">

              <div className="flex items-center gap-4">

                {selectedFaculty.profileImage ? (
                  <img
                    src={selectedFaculty.profileImage}
                    alt={selectedFaculty.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-lg font-black text-blue-700">
                    {getInitials(
                      selectedFaculty.name
                    )}
                  </div>
                )}

                <div>
                  <h3 className="font-black text-slate-900">
                    {selectedFaculty.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {selectedFaculty.email}
                  </p>
                </div>

              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Campus User ID
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {selectedFaculty.campusUserId ||
                      "Not assigned"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Registration Date
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(
                      selectedFaculty.createdAt
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Current Status
                  </p>

                  <div className="mt-2">
                    {statusBadge(
                      getStatus(
                        selectedFaculty
                      )
                    )}
                  </div>
                </div>

              </div>

              {selectedFaculty.rejectionReason && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                  <p className="text-xs font-bold text-red-700">
                    Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-red-600">
                    {
                      selectedFaculty.rejectionReason
                    }
                  </p>

                </div>
              )}

              {getStatus(
                selectedFaculty
              ) === "PENDING" && (
                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    disabled={
                      processingId ===
                      selectedFaculty.id
                    }
                    onClick={() =>
                      void handleApprove(
                        selectedFaculty
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={17} />
                    Approve Faculty
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingFaculty(
                        selectedFaculty
                      );
                      setSelectedFaculty(null);
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

      {/* REJECTION MODAL */}

      {rejectingFaculty && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <XCircle size={22} />
                </div>

                <h2 className="mt-4 text-xl font-black text-slate-900">
                  Reject Faculty Application
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Rejecting registration for{" "}
                  <span className="font-bold text-slate-700">
                    {rejectingFaculty.name}
                  </span>
                  .
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setRejectingFaculty(null);
                  setRejectionReason("");
                }}
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
                onClick={() => {
                  setRejectingFaculty(null);
                  setRejectionReason("");
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  processingId ===
                    rejectingFaculty.id ||
                  !rejectionReason.trim()
                }
                onClick={() =>
                  void handleReject()
                }
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {processingId ===
                rejectingFaculty.id
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