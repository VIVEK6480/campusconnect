"use client";

import {
  Bell,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type Faculty = {
  id: string;
  facultyId?: string | null;
  name?: string | null;
  email?: string | null;
  campusUserId?: string | null;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  joiningDate?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  officeRoom?: string | null;
  officeHours?: string | null;
  status?: string | null;
  approvalStatus?: string | null;
  isApproved?: boolean | null;
  image?: string | null;
  profileImage?: string | null;
  avatar?: string | null;
  [key: string]: unknown;
};

type FacultyResponse = {
  success?: boolean;
  count?: number;
  faculty?: Faculty[];
  departments?: string[];
  message?: string;
};

function displayValue(value: unknown, fallback = "—") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
}

function getFacultyStatus(faculty: Faculty) {
  if (typeof faculty.status === "string" && faculty.status.trim()) {
    return faculty.status.trim();
  }

  if (
    typeof faculty.approvalStatus === "string" &&
    faculty.approvalStatus.trim()
  ) {
    return faculty.approvalStatus.trim();
  }

  if (faculty.isApproved === true) return "Approved";
  return "Pending";
}

function getFacultyId(faculty: Faculty) {
  return faculty.facultyId || faculty.campusUserId || faculty.id;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "FC";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized.includes("reject")) {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  }

  if (normalized.includes("pending")) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      Approved
    </span>
  );
}

export default function AdminFacultyPage() {
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [error, setError] = useState("");


  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    campusUserId: "",
    department: "",
    designation: "",
    phone: "",
    qualification: "",
    specialization: "",
    joiningDate: "",
    address: "",
    city: "",
    state: "",
    officeRoom: "",
    officeHours: "",
  });

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      setError("");

      const response = await fetch("/api/admin/users/faculty", {
        method: "GET",
        cache: "no-store",
      });

      const data: FacultyResponse = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to load departments."));
      }

      const uniqueDepartments = Array.from(
        new Set(
          (Array.isArray(data.departments) ? data.departments : [])
            .map((item) => String(item).trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      setDepartments(uniqueDepartments);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load departments."
      );
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadFaculty = async (
    selectedDepartment = department
  ) => {
    if (!selectedDepartment) {
      setFaculty([]);
      return;
    }

    try {
      setLoadingFaculty(true);
      setError("");

      const query = new URLSearchParams({
        department: selectedDepartment,
      });

      const response = await fetch(
        `/api/admin/users/faculty?${query.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: FacultyResponse = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to load faculty."));
      }

      setFaculty(Array.isArray(data.faculty) ? data.faculty : []);
    } catch (err) {
      setFaculty([]);
      setError(err instanceof Error ? err.message : "Unable to load faculty.");
    } finally {
      setLoadingFaculty(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/admin/users/faculty", {
          method: "GET",
          cache: "no-store",
        });

        const data: FacultyResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to load departments.")
          );
        }

        // Some API responses may not populate `departments` even though
        // the faculty records themselves contain department values.
        // Build the dropdown from BOTH sources so the page never stays empty.
        const departmentValues = [
          ...(Array.isArray(data.departments) ? data.departments : []),
          ...(Array.isArray(data.faculty)
            ? data.faculty.map((member) => member.department)
            : []),
        ];

        const uniqueDepartments = Array.from(
          new Set(
            departmentValues
              .map((item) => String(item ?? "").trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));

        if (!cancelled) {
          setDepartments(uniqueDepartments);
          setLoadingDepartments(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load departments."
          );
          setLoadingDepartments(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!department) {
      return;
    }

    let cancelled = false;

    const fetchSelectedDepartment = async () => {
      try {
        setLoadingFaculty(true);
        setError("");

        const query = new URLSearchParams({
          department: department.trim(),
        });

        const response = await fetch(
          `/api/admin/users/faculty?${query.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: FacultyResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to load faculty.")
          );
        }

        if (!cancelled) {
          const result = Array.isArray(data.faculty) ? data.faculty : [];

          // Keep only the selected department on the client as an extra
          // safeguard in case the backend returns a broader faculty list.
          const selected = department.trim().toLowerCase();

          setFaculty(
            result.filter(
              (member) =>
                String(member.department ?? "").trim().toLowerCase() ===
                selected
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setFaculty([]);
          setError(
            err instanceof Error ? err.message : "Unable to load faculty."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingFaculty(false);
        }
      }
    };

    fetchSelectedDepartment();

    return () => {
      cancelled = true;
    };
  }, [department]);

  const openEdit = (member: Faculty) => {
    setEditingFaculty(member);

    setForm({
      name: displayValue(member.name, ""),
      email: displayValue(member.email, ""),
      campusUserId: displayValue(
        member.campusUserId || member.facultyId,
        ""
      ),
      department: displayValue(member.department, ""),
      designation: displayValue(member.designation, ""),
      phone: displayValue(member.phone, ""),
      qualification: displayValue(member.qualification, ""),
      specialization: displayValue(member.specialization, ""),
      joiningDate: member.joiningDate
        ? String(member.joiningDate).slice(0, 10)
        : "",
      address: displayValue(member.address, ""),
      city: displayValue(member.city, ""),
      state: displayValue(member.state, ""),
      officeRoom: displayValue(member.officeRoom, ""),
      officeHours: displayValue(member.officeHours, ""),
    });
  };

  const saveFaculty = async () => {
    if (!editingFaculty) return;

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/users/faculty", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingFaculty.id,
          facultyId: editingFaculty.facultyId,
          name: form.name.trim(),
          email: form.email.trim(),
          campusUserId: form.campusUserId.trim() || null,
          department: form.department.trim() || null,
          designation: form.designation.trim() || null,
          phone: form.phone.trim() || null,
          qualification: form.qualification.trim() || null,
          specialization: form.specialization.trim() || null,
          joiningDate: form.joiningDate || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          officeRoom: form.officeRoom.trim() || null,
          officeHours: form.officeHours.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to update faculty."));
      }

      setEditingFaculty(null);
      await loadFaculty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update faculty.");
    } finally {
      setSaving(false);
    }
  };

  const deleteFaculty = async (member: Faculty) => {
    const confirmed = window.confirm(
      `Delete ${displayValue(member.name, "this faculty member")}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(member.id);
      setError("");

      const response = await fetch(
        `/api/admin/users/faculty?id=${encodeURIComponent(member.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to delete faculty."));
      }

      setFaculty((current) =>
        current.filter((item) => item.id !== member.id)
      );

      if (selectedFaculty?.id === member.id) {
        setSelectedFaculty(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete faculty.");
    } finally {
      setDeletingId(null);
    }
  };

  const clearDepartment = () => {
    setDepartment("");
    setFaculty([]);
    setError("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      {/* ====================================================
          BACKGROUND
      ==================================================== */}

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="pointer-events-none fixed -left-32 top-20 z-0 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl animate-pulse" />
      <div className="pointer-events-none fixed -right-32 top-1/3 z-0 h-80 w-80 rounded-full bg-blue-300/10 blur-3xl animate-pulse [animation-delay:1200ms]" />
      <div className="pointer-events-none fixed bottom-[-140px] left-1/3 z-0 h-96 w-96 rounded-full bg-sky-300/10 blur-3xl animate-pulse [animation-delay:2400ms]" />
      <div className="pointer-events-none fixed left-1/2 top-0 z-0 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-200/10 blur-3xl" />

      <div className="relative z-10 w-full px-4 py-6 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* ====================================================
            ADMIN TOP HEADER — SAME STUDENT UI
        ==================================================== */}

        <header className="-mx-4 -mt-6 mb-6 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-[0_1px_8px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10 2xl:-mx-12 2xl:px-12">
          <div className="mx-auto flex min-h-[62px] w-full items-center justify-between gap-4">
            <div className="min-w-[190px]">
              <div className="text-[15px] font-black tracking-[0.14em] text-indigo-600">
                ADMIN PORTAL
              </div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">
                Your campus, under your control.
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Bell size={19} />
                <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              <div className="hidden h-10 w-px bg-slate-200 sm:block" />

              <div className="hidden text-right sm:block">
                <div className="text-sm font-bold text-slate-800">
                  Administrator
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  System Admin
                </div>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
                A
              </div>
            </div>
          </div>
        </header>

        {/* ====================================================
            FACULTY BANNER
        ==================================================== */}

        <section className="relative mb-6 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#202f73] via-[#30499c] to-[#4d6be0] px-7 py-8 text-white shadow-[0_18px_45px_rgba(37,58,135,0.20)] sm:px-9 sm:py-9 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute -right-6 -top-12 h-36 w-36 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute right-16 -top-5 h-24 w-24 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-[-70px] right-[-40px] h-48 w-48 rounded-full border border-white/10" />

          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-sm backdrop-blur-sm">
                <BriefcaseBusiness className="h-4 w-4" />
                Welcome to Faculty Management
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                Manage your faculty.
                <br />
                Shape the campus experience.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-indigo-50 sm:text-base">
                Manage faculty accounts, organize departments and keep
                professional information connected across your CampusConnect
                administration portal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                loadDepartments();
                if (department) loadFaculty();
              }}
              disabled={loadingFaculty || loadingDepartments}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-2xl bg-white px-6 text-sm font-black text-indigo-700 shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingFaculty || loadingDepartments ? "animate-spin" : ""
                }`}
              />
              Refresh Faculty
            </button>
          </div>
        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error ? (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1.5 transition hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* ====================================================
            DEPARTMENT FILTER — SAME STYLE AS STUDENT ACADEMIC GROUP
        ==================================================== */}

        <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Faculty Department
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Select a department to load only faculty members belonging
                  to that department.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                Department
              </span>

              <div className="relative">
                <select
                  value={department}
                  disabled={loadingDepartments}
                  onChange={(event) => {
                    setDepartment(event.target.value);
                  }}
                  className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-semibold text-slate-700 outline-none transition hover:border-indigo-200 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {loadingDepartments
                      ? "Loading departments..."
                      : "Choose department"}
                  </option>

                  {departments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs">
              {department ? (
                <>
                  <span className="font-medium text-slate-500">
                    Current department
                  </span>
                  <span className="rounded-lg border border-indigo-100 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm">
                    {department}
                  </span>
                  <button
                    type="button"
                    onClick={clearDepartment}
                    className="ml-auto rounded-lg px-3 py-1.5 font-bold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span className="font-medium text-slate-500">
                  Select a department. Faculty will appear automatically for
                  the selected department only.
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            FACULTY DIRECTORY
        ==================================================== */}

        {department ? (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      Faculty Directory
                    </h2>

                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-600">
                      {faculty.length}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {department}
                  </p>
                </div>


              </div>
            </div>

            {loadingFaculty ? (
              <div className="flex min-h-56 items-center justify-center">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  Loading faculty from {department}...
                </div>
              </div>
            ) : faculty.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                  <Users className="h-6 w-6 text-indigo-500" />
                </div>

                <h3 className="font-bold text-slate-800">
                  No faculty found
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  No faculty members are registered in {department}.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-indigo-50/35 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      <th className="px-6 py-4">Faculty</th>
                      <th className="px-6 py-4">Faculty ID</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Designation</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {faculty.map((member) => {
                      const name = displayValue(
                        member.name,
                        "Unnamed Faculty"
                      );

                      const avatar =
                        member.image ||
                        member.profileImage ||
                        member.avatar ||
                        "";

                      return (
                        <tr
                          key={member.id}
                          className="group border-b border-slate-100 transition-colors hover:bg-indigo-50/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {avatar ? (
                                <img
                                  src={avatar}
                                  alt=""
                                  className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600 ring-1 ring-indigo-100">
                                  {getInitials(name)}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-bold text-slate-900">
                                  {name}
                                </p>
                                <p className="max-w-[260px] truncate text-xs text-slate-500">
                                  {displayValue(member.email)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700">
                              {getFacultyId(member)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {displayValue(member.department)}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {displayValue(member.designation)}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {displayValue(member.phone)}
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge status={getFacultyStatus(member)} />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                title="View faculty"
                                onClick={() => setSelectedFaculty(member)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                title="Edit faculty"
                                onClick={() => openEdit(member)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                title="Delete faculty"
                                disabled={deletingId === member.id}
                                onClick={() => deleteFaculty(member)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                {deletingId === member.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <BriefcaseBusiness className="h-7 w-7 text-indigo-500" />
              </div>

              <h2 className="font-bold text-slate-900">
                Select a department
              </h2>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Choose a department above to display only the faculty members
                belonging to that department.
              </p>
            </div>
          </section>
        )}
      </div>

      {selectedFaculty ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Faculty Details
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Professional and department information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFaculty(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
              <Detail label="Name" value={selectedFaculty.name} />
              <Detail label="Email" value={selectedFaculty.email} />
              <Detail label="Faculty ID" value={getFacultyId(selectedFaculty)} />
              <Detail label="Phone" value={selectedFaculty.phone} />
              <Detail
                label="Department"
                value={selectedFaculty.department}
              />
              <Detail
                label="Designation"
                value={selectedFaculty.designation}
              />
              <Detail
                label="Qualification"
                value={selectedFaculty.qualification}
              />
              <Detail
                label="Specialization"
                value={selectedFaculty.specialization}
              />
              <Detail
                label="Joining Date"
                value={selectedFaculty.joiningDate}
              />
              <Detail label="Office Room" value={selectedFaculty.officeRoom} />
              <Detail label="Office Hours" value={selectedFaculty.officeHours} />
              <Detail label="City" value={selectedFaculty.city} />
              <Detail label="State" value={selectedFaculty.state} />
              <div className="sm:col-span-2">
                <Detail label="Address" value={selectedFaculty.address} />
              </div>
              <div className="sm:col-span-2">
                <Detail
                  label="Status"
                  value={getFacultyStatus(selectedFaculty)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingFaculty ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Faculty
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Update faculty profile and professional information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingFaculty(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
              <InputField
                label="Name"
                value={form.name}
                onChange={(value) => setForm((f) => ({ ...f, name: value }))}
              />
              <InputField
                label="Email"
                value={form.email}
                onChange={(value) => setForm((f) => ({ ...f, email: value }))}
              />
              <InputField
                label="Faculty / Campus ID"
                value={form.campusUserId}
                onChange={(value) =>
                  setForm((f) => ({ ...f, campusUserId: value }))
                }
              />
              <InputField
                label="Department"
                value={form.department}
                onChange={(value) =>
                  setForm((f) => ({ ...f, department: value }))
                }
              />
              <InputField
                label="Designation"
                value={form.designation}
                onChange={(value) =>
                  setForm((f) => ({ ...f, designation: value }))
                }
              />
              <InputField
                label="Phone"
                value={form.phone}
                onChange={(value) => setForm((f) => ({ ...f, phone: value }))}
              />
              <InputField
                label="Qualification"
                value={form.qualification}
                onChange={(value) =>
                  setForm((f) => ({ ...f, qualification: value }))
                }
              />
              <InputField
                label="Specialization"
                value={form.specialization}
                onChange={(value) =>
                  setForm((f) => ({ ...f, specialization: value }))
                }
              />
              <InputField
                label="Joining Date"
                type="date"
                value={form.joiningDate}
                onChange={(value) =>
                  setForm((f) => ({ ...f, joiningDate: value }))
                }
              />
              <InputField
                label="Office Room"
                value={form.officeRoom}
                onChange={(value) =>
                  setForm((f) => ({ ...f, officeRoom: value }))
                }
              />
              <InputField
                label="Office Hours"
                value={form.officeHours}
                onChange={(value) =>
                  setForm((f) => ({ ...f, officeHours: value }))
                }
              />
              <InputField
                label="City"
                value={form.city}
                onChange={(value) => setForm((f) => ({ ...f, city: value }))}
              />
              <InputField
                label="State"
                value={form.state}
                onChange={(value) => setForm((f) => ({ ...f, state: value }))}
              />
              <div className="lg:col-span-3">
                <InputField
                  label="Address"
                  value={form.address}
                  onChange={(value) =>
                    setForm((f) => ({ ...f, address: value }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={() => setEditingFaculty(null)}
                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveFaculty}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value?: unknown }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-600 hover:to-blue-600 hover:text-white hover:shadow-[0_12px_28px_rgba(79,70,229,0.24)]">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-indigo-100">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-white">
        {displayValue(value)}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}
