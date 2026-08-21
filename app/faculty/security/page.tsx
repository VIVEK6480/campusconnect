"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  LockKeyhole,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type FacultyUser = {
  id?: string;
  email?: string;
  role?: string;
};

export default function FacultySecurityPage() {
  const [user, setUser] = useState<FacultyUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("facultyUser");

      if (storedUser) {
        const parsedUser: FacultyUser =
          JSON.parse(storedUser);

        setUser(parsedUser);
      }
    } catch (err) {
      console.error(
        "FACULTY SECURITY LOAD ERROR:",
        err
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function handlePasswordChange() {
    setError("");
    setMessage("");

    if (!currentPassword) {
      setError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setError(
        "Please enter your new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (!user?.email) {
      setError(
        "Faculty account information could not be found."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/auth/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: user.email,
            currentPassword,
            newPassword,
          }),
        }
      );

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to change password."
        );

        return;
      }

      setMessage(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(
        "FACULTY PASSWORD CHANGE ERROR:",
        err
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="flex h-16 items-center border-b border-slate-200 bg-white px-5 sm:px-8">

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


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">

        {/* =================================================
            BACK
        ================================================== */}

        <Link
          href="/dashboard/faculty"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-600"
        >

          <ArrowLeft size={16} />

          Back to Faculty Dashboard

        </Link>


        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-7">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">

            <ShieldCheck size={14} />

            Account Security

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Security
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage your faculty account security and
            password.
          </p>

        </div>


        {/* =================================================
            SECURITY STATUS
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">

              <CheckCircle2 size={21} />

            </div>

            <div>

              <h2 className="font-bold text-emerald-800">
                Account Protected
              </h2>

              <p className="mt-1 text-sm leading-6 text-emerald-700/80">
                Your CampusConnect faculty account uses
                secure authentication.
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            PASSWORD CARD
        ================================================== */}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

              <LockKeyhole size={21} />

            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Change Password
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update your password to keep your account
                secure.
              </p>

            </div>

          </div>


          {/* =================================================
              MESSAGES
          ================================================== */}

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>

            </div>
          )}


          {message && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-600">

              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{message}</span>

            </div>
          )}


          <div className="mt-7 space-y-5">

            {/* CURRENT PASSWORD */}

            <div>

              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Current Password
              </label>

              <div className="relative">

                <KeyRound
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(
                      e.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  disabled={
                    saving || loading
                  }
                  placeholder="Enter current password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

            </div>


            {/* NEW PASSWORD */}

            <div>

              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(
                      e.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  disabled={
                    saving || loading
                  }
                  placeholder="Enter new password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              <p className="mt-2 text-xs text-slate-400">
                Password must contain at least 6 characters.
              </p>

            </div>


            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Confirm New Password
              </label>

              <div className="relative">

                <ShieldCheck
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  disabled={
                    saving || loading
                  }
                  placeholder="Confirm new password"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

            </div>


            {/* SUBMIT */}

            <div className="flex justify-end border-t border-slate-100 pt-6">

              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={
                  saving || loading
                }
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Updating...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={17} />

                    Update Password
                  </>
                )}

              </button>

            </div>

          </div>

        </div>


        {/* =================================================
            SECURITY INFORMATION
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

              <ShieldCheck size={21} />

            </div>

            <div>

              <h3 className="font-bold text-slate-900">
                Security Tips
              </h3>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">

                <li>
                  • Use a strong and unique password.
                </li>

                <li>
                  • Do not share your CampusConnect
                  password with anyone.
                </li>

                <li>
                  • Always log out when using a shared
                  computer.
                </li>

              </ul>

            </div>

          </div>

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