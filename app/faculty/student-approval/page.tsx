"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  ShieldCheck,
} from "lucide-react";

type Student = {
  id: string;
  campusUserId?: string | null;
  name?: string | null;
  email?: string | null;
  approvalStatus?: string | null;
  rejectionReason?: string | null;
};

export default function FacultyStudentApprovalPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("facultyToken");

      const response = await fetch(
        "/api/admin/approvals/students",
        {
          method: "GET",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to load student approvals."
        );
        return;
      }

      setStudents(
        Array.isArray(data.students)
          ? data.students
          : Array.isArray(data.users)
          ? data.users
          : []
      );
    } catch (err) {
      console.error(
        "FACULTY STUDENT APPROVAL LOAD ERROR:",
        err
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function updateApproval(
    student: Student,
    status: "APPROVED" | "REJECTED"
  ) {
    setProcessingId(student.id);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("facultyToken");

      const response = await fetch(
        `/api/admin/approvals/students/${student.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            approvalStatus: status,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            `Unable to ${
              status === "APPROVED"
                ? "approve"
                : "reject"
            } student.`
        );
        return;
      }

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? {
                ...item,
                approvalStatus: status,
              }
            : item
        )
      );

      setMessage(
        `${student.name || "Student"} ${
          status === "APPROVED"
            ? "approved"
            : "rejected"
        } successfully.`
      );
    } catch (err) {
      console.error(
        "FACULTY STUDENT APPROVAL ERROR:",
        err
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const filteredStudents = students.filter(
    (student) => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return true;
      }

      return (
        String(student.name || "")
          .toLowerCase()
          .includes(value) ||
        String(student.email || "")
          .toLowerCase()
          .includes(value) ||
        String(student.campusUserId || "")
          .toLowerCase()
          .includes(value)
      );
    }
  );

  const pendingCount = students.filter(
    (student) =>
      String(
        student.approvalStatus || ""
      ).toUpperCase() === "PENDING"
  ).length;

  const approvedCount = students.filter(
    (student) =>
      String(
        student.approvalStatus || ""
      ).toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = students.filter(
    (student) =>
      String(
        student.approvalStatus || ""
      ).toUpperCase() === "REJECTED"
  ).length;

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
            <GraduationCap size={21} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              CampusConnect
            </p>

            <p className="text-[11px] text-emerald-600">
              Faculty Portal
            </p>
          </div>

        </div>

        <div className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 sm:flex">
          <ShieldCheck size={15} />
          Faculty Access
        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">

        {/* BACK */}

        <Link
          href="/dashboard/faculty"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft size={16} />
          Back to Faculty Dashboard
        </Link>


        {/* PAGE HEADER */}

        <div className="mb-7">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
            <Users size={14} />
            Student Approval
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Student Approvals
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Review and manage student registration
            requests.
          </p>

        </div>


        {/* =================================================
            STATS
        ================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <Users size={21} />
              </div>

              <span className="text-2xl font-bold text-slate-900">
                {students.length}
              </span>

            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Total Students
            </p>

          </div>


          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Clock3 size={21} />
              </div>

              <span className="text-2xl font-bold text-slate-900">
                {pendingCount}
              </span>

            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Pending
            </p>

          </div>


          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <CheckCircle2 size={21} />
              </div>

              <span className="text-2xl font-bold text-slate-900">
                {approvedCount}
              </span>

            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Approved
            </p>

          </div>


          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <XCircle size={21} />
              </div>

              <span className="text-2xl font-bold text-slate-900">
                {rejectedCount}
              </span>

            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Rejected
            </p>

          </div>

        </div>


        {/* =================================================
            MESSAGES
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-600">
            {message}
          </div>
        )}


        {/* =================================================
            SEARCH
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by name, email or Campus User ID..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />

          </div>

        </div>


        {/* =================================================
            STUDENT LIST
        ================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="font-bold text-slate-900">
              Student Registration Requests
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredStudents.length} student
              {filteredStudents.length === 1
                ? ""
                : "s"} found
            </p>

          </div>


          {loading ? (

            <div className="flex min-h-60 items-center justify-center">

              <div className="flex items-center gap-3 text-sm text-slate-500">

                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />

                Loading students...

              </div>

            </div>

          ) : filteredStudents.length === 0 ? (

            <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={25} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No students found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                There are currently no student records
                matching your search.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {filteredStudents.map(
                (student) => {

                  const status =
                    String(
                      student.approvalStatus ||
                        "PENDING"
                    ).toUpperCase();

                  const processing =
                    processingId ===
                    student.id;

                  return (
                    <div
                      key={student.id}
                      className="p-6 transition hover:bg-slate-50"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-start gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-lg font-bold text-emerald-600">
                            {(
                              student.name ||
                              "S"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <h3 className="font-bold text-slate-900">
                              {student.name ||
                                "Unnamed Student"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {student.email ||
                                "No email available"}
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-400">
                              Campus ID:{" "}
                              {student.campusUserId ||
                                "Not assigned"}
                            </p>

                          </div>

                        </div>


                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                          {status ===
                            "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateApproval(
                                    student,
                                    "APPROVED"
                                  )
                                }
                                disabled={
                                  processing
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                              >

                                {processing ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                  <CheckCircle2
                                    size={16}
                                  />
                                )}

                                Approve

                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateApproval(
                                    student,
                                    "REJECTED"
                                  )
                                }
                                disabled={
                                  processing
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >

                                <XCircle
                                  size={16}
                                />

                                Reject

                              </button>
                            </>
                          )}


                          {status ===
                            "APPROVED" && (
                            <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600">
                              <CheckCircle2
                                size={16}
                              />
                              Approved
                            </span>
                          )}


                          {status ===
                            "REJECTED" && (
                            <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                              <XCircle
                                size={16}
                              />
                              Rejected
                            </span>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>


        {/* =================================================
            FOOTER
        ================================================== */}

        <footer className="mt-8 border-t border-slate-200 py-6">

          <p className="text-center text-xs text-slate-400">
            © 2026 CampusConnect. Smart Campus Management.
          </p>

        </footer>

      </main>

    </div>
  );
}