"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

type Student = {
  id: string;
  campusUserId: string | null;
  name: string;
  email: string;
  profileImage: string | null;
  role: string;
  approvalStatus: string;
  createdAt: string;
  rejectionReason: string | null;
};

type Faculty = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function FacultyStudentApprovalPage() {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(
    null
  );

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  /*
   * Faculty information localStorage se read hoti hai.
   * Existing faculty login structure ko disturb nahi kiya gaya.
   */
  const getStoredFaculty = useCallback((): Faculty | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const possibleKeys = [
      "faculty",
      "facultyUser",
      "currentFaculty",
      "user",
    ];

    for (const key of possibleKeys) {
      const stored = window.localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      try {
        const parsed = JSON.parse(stored);

        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.role === "FACULTY" || parsed.role === "faculty")
        ) {
          return {
            id: String(parsed.id || ""),
            name: String(parsed.name || "Faculty"),
            email: String(parsed.email || ""),
            role: String(parsed.role || "FACULTY"),
          };
        }
      } catch {
        continue;
      }
    }

    return null;
  }, []);

  const loadStudents = useCallback(async (facultyData: Faculty) => {
    setError("");

    try {
      const response = await fetch("/api/faculty/approvals/students", {
        method: "GET",
        headers: {
          "x-faculty-id": facultyData.id,
        },
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load student approvals."
        );
      }

      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      console.error("Load student approvals error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load student approval requests."
      );
    }
  }, []);

  /*
   * Initial page load.
   */
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const storedFaculty = getStoredFaculty();

      if (cancelled) {
        return;
      }

      if (!storedFaculty || !storedFaculty.id) {
        setError("Faculty information was not found. Please login again.");
        setLoading(false);
        return;
      }

      setFaculty(storedFaculty);

      try {
        await loadStudents(storedFaculty);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [getStoredFaculty, loadStudents]);

  /*
   * Search filtering.
   *
   * IMPORTANT:
   * Filtering ko useEffect + setState se nahi kiya gaya.
   * Isse react-hooks/set-state-in-effect error nahi aayega.
   */
  const filteredStudents = students.filter((student) => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return (
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      (student.campusUserId || "").toLowerCase().includes(term)
    );
  });

  const refreshStudents = async () => {
    if (!faculty) {
      return;
    }

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      await loadStudents(faculty);
      setSuccess("Student approval requests refreshed.");
    } catch (err) {
      console.error("Refresh student approvals error:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveStudent = async (student: Student) => {
    if (!faculty) {
      setError("Faculty information was not found.");
      return;
    }

    setActionLoading(student.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/faculty/approvals/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-faculty-id": faculty.id,
        },
        credentials: "include",
        body: JSON.stringify({
          studentId: student.id,
          facultyId: faculty.id,
          action: "approve",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to approve student.");
      }

      setStudents((current) =>
        current.filter((item) => item.id !== student.id)
      );

      setSelectedStudent(null);
      setSuccess(`${student.name} has been approved successfully.`);
    } catch (err) {
      console.error("Approve student error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to approve student."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (student: Student) => {
    setSelectedStudent(student);
    setRejectionReason("");
    setShowRejectModal(true);
    setError("");
    setSuccess("");
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedStudent(null);
    setRejectionReason("");
  };

  const rejectStudent = async () => {
    if (!faculty || !selectedStudent) {
      return;
    }

    setActionLoading(selectedStudent.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/faculty/approvals/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-faculty-id": faculty.id,
        },
        credentials: "include",
        body: JSON.stringify({
          studentId: selectedStudent.id,
          facultyId: faculty.id,
          action: "reject",
          rejectionReason:
            rejectionReason.trim() ||
            "Student registration rejected by faculty.",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reject student.");
      }

      const rejectedName = selectedStudent.name;

      setStudents((current) =>
        current.filter((item) => item.id !== selectedStudent.id)
      );

      closeRejectModal();

      setSuccess(`${rejectedName} has been rejected.`);
    } catch (err) {
      console.error("Reject student error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reject student."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f9fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/dashboard/faculty"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Faculty Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <GraduationCap className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                  Faculty Portal
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Student Approval
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Review and approve student registration requests.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshStudents}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Faculty Information */}
        {faculty && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
              {faculty.name
                .split(" ")
                .map((part) => part.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {faculty.name}
              </p>

              <p className="text-xs text-slate-500">{faculty.email}</p>
            </div>

            <div className="ml-auto inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Faculty Access
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <X className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">Success</p>
              <p className="mt-1 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Approvals
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {students.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Showing
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {filteredStudents.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Search className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Approval Role
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  Faculty
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search student by name, email or campus ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        {/* Students */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Student Registration Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Approve eligible students or reject registrations that do not
                meet requirements.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock3 className="h-4 w-4" />
              {students.length} Pending
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />

                <p className="text-sm font-medium">
                  Loading student requests...
                </p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                No pending student approvals
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                There are currently no student registration requests waiting
                for faculty approval.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sky-100 text-sky-700">
                        {student.profileImage ? (
                          <Image
                            src={student.profileImage}
                            alt={student.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-slate-900">
                            {student.name}
                          </h3>

                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            <Clock3 className="h-3 w-3" />
                            Pending
                          </span>
                        </div>

                        <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {student.email}
                          </span>

                          {student.campusUserId && (
                            <span className="inline-flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              {student.campusUserId}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          Registration submitted on{" "}
                          {formatDate(student.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => approveStudent(student)}
                        disabled={actionLoading === student.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => openRejectModal(student)}
                        disabled={actionLoading === student.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <UserX className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Reject Student
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Rejecting registration for{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedStudent.name}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={closeRejectModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Rejection Reason
            </label>

            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
              placeholder="Enter the reason for rejecting this student..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-100"
            />

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRejectModal}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={rejectStudent}
                disabled={actionLoading === selectedStudent.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === selectedStudent.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                Reject Student
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}