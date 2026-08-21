"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  Search,
  Mail,
  ShieldCheck,
} from "lucide-react";

type Student = {
  id: string;
  campusUserId?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  approvalStatus?: string | null;
  profileImage?: string | null;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const studentToken =
        localStorage.getItem("studentToken");

      const facultyToken =
        localStorage.getItem("facultyToken");

      const token =
        studentToken || facultyToken;

      const response = await fetch(
        "/api/students",
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
            "Unable to load students."
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
        "STUDENTS LOAD ERROR:",
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

  const filteredStudents =
    students.filter((student) => {
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
    });

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
              Student Portal
            </p>

          </div>

        </div>

        <div className="hidden items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 sm:flex">

          <ShieldCheck size={15} />

          Campus Access

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">

        {/* BACK */}

        <Link
          href="/dashboard/student"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >

          <ArrowLeft size={16} />

          Back to Student Dashboard

        </Link>


        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-7">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">

            <Users size={14} />

            Students

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Students
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View student information available through
            CampusConnect.
          </p>

        </div>


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
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
            {error}
          </div>
        )}


        {/* =================================================
            STUDENT CARD
        ================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

            <div>

              <h2 className="font-bold text-slate-900">
                Student Directory
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredStudents.length} student
                {filteredStudents.length === 1
                  ? ""
                  : "s"} found
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

              <Users size={20} />

            </div>

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
                No student records are available or
                no students match your search.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {filteredStudents.map(
                (student) => (
                  <div
                    key={student.id}
                    className="p-6 transition hover:bg-slate-50"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-lg font-bold text-emerald-600">

                          {student.profileImage ? (

                            <img
                              src={
                                student.profileImage
                              }
                              alt={
                                student.name ||
                                "Student"
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            (
                              student.name ||
                              "S"
                            )
                              .charAt(0)
                              .toUpperCase()

                          )}

                        </div>

                        <div>

                          <h3 className="font-bold text-slate-900">
                            {student.name ||
                              "Unnamed Student"}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">

                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">

                              <Mail size={14} />

                              {student.email ||
                                "No email available"}

                            </span>

                          </div>

                          <p className="mt-1 text-xs font-medium text-slate-400">

                            Campus ID:{" "}

                            {student.campusUserId ||
                              "Not assigned"}

                          </p>

                        </div>

                      </div>


                      <div className="flex items-center">

                        <span className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">

                          {String(
                            student.approvalStatus ||
                              "APPROVED"
                          ).toUpperCase()}

                        </span>

                      </div>

                    </div>

                  </div>
                )
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