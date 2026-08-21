
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  User,
  ShieldCheck,
  Building2,
  Save,
} from "lucide-react";

type FacultyUser = {
  id?: string;
  campusUserId?: string | null;
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string | null;
};

export default function FacultyProfilePage() {
  const [user, setUser] = useState<FacultyUser | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [campusUserId, setCampusUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("facultyUser");

      if (!storedUser) {
        setLoading(false);
        return;
      }

      const parsedUser: FacultyUser = JSON.parse(storedUser);

      setUser(parsedUser);
      setName(parsedUser.name || "");
      setEmail(parsedUser.email || "");
      setCampusUserId(parsedUser.campusUserId || "");
    } catch (error) {
      console.error("FACULTY PROFILE LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSave() {
    if (!user) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updatedUser: FacultyUser = {
        ...user,
        name: name.trim() || user.name || "",
      };

      localStorage.setItem(
        "facultyUser",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);

      setMessage(
        "Profile information updated successfully."
      );
    } catch (error) {
      console.error("FACULTY PROFILE SAVE ERROR:", error);

      setMessage(
        "Unable to update profile information."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

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

      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">

        <Link
          href="/dashboard/faculty"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >
          <ArrowLeft size={16} />
          Back to Faculty Dashboard
        </Link>

        <div className="mb-7">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
            <User size={14} />
            Faculty Profile
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View and manage your CampusConnect faculty
            profile information.
          </p>

        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#0b2d22] via-[#0e3b2d] to-[#124a3b]">

            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

          </div>

          <div className="px-6 pb-8 sm:px-9">

            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex items-end gap-4">

                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-emerald-400 to-teal-500 text-3xl font-bold text-white shadow-lg">
                  {(name || "F").charAt(0).toUpperCase()}
                </div>

                <div className="pb-1">

                  <h2 className="text-xl font-bold text-slate-900">
                    {loading ? "Faculty" : name || "Faculty"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    Faculty Member
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">
                <ShieldCheck size={15} />
                Faculty Account
              </div>

            </div>

            {message && (
              <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                {message}
              </div>
            )}

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                  />

                </div>

              </div>

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 pl-11 pr-4 text-sm text-slate-600 outline-none"
                  />

                </div>

              </div>

              <div>

                <label
                  htmlFor="campusUserId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Campus User ID
                </label>

                <div className="relative">

                  <Building2
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="campusUserId"
                    type="text"
                    value={campusUserId}
                    readOnly
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 pl-11 pr-4 text-sm text-slate-600 outline-none"
                  />

                </div>

              </div>

              <div>

                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Account Role
                </label>

                <div className="relative">

                  <ShieldCheck
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="role"
                    type="text"
                    value={user?.role || "FACULTY"}
                    readOnly
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 pl-11 pr-4 text-sm font-semibold text-slate-600 outline-none"
                  />

                </div>

              </div>

            </div>

            <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading || !user}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <Save size={17} />

                {saving ? "Saving..." : "Save Changes"}

              </button>

            </div>

          </div>

        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <ShieldCheck size={21} />
            </div>

            <div>

              <h3 className="font-bold text-slate-900">
                Account Security
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your faculty account is protected by
                CampusConnect authentication.
              </p>

            </div>

          </div>

        </div>

        <footer className="mt-8 border-t border-slate-200 py-6">

          <p className="text-center text-xs text-slate-400">
            © 2026 CampusConnect. Smart Campus Management.
          </p>

        </footer>

      </main>

    </div>
  );
}