"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function StudentResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /*
   * =========================================
   * SUBMIT
   * =========================================
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    /*
     * =========================================
     * CHECK TOKEN
     * =========================================
     */

    if (!token) {
      setError(
        "Password reset token is missing."
      );
      return;
    }

    /*
     * =========================================
     * CHECK PASSWORD
     * =========================================
     */

    if (!newPassword) {
      setError(
        "New password is required."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "STUDENT RESET REQUEST STARTED"
      );

      /*
       * =========================================
       * SEND RESET REQUEST
       * =========================================
       */

      const response = await fetch(
        "/api/auth/student-reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token,
            newPassword,
            confirmPassword,
          }),
        }
      );

      /*
       * =========================================
       * READ RESPONSE
       * =========================================
       */

      const data = await response.json();

      console.log(
        "STUDENT RESET RESPONSE:",
        response.status,
        data
      );

      /*
       * =========================================
       * HANDLE ERROR
       * =========================================
       */

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset password."
        );
      }

      /*
       * =========================================
       * SUCCESS
       * =========================================
       */

      console.log(
        "STUDENT PASSWORD RESET SUCCESSFULLY"
      );

      setSuccess(true);
    } catch (error) {
      console.error(
        "STUDENT RESET PASSWORD FRONTEND ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================
   * SUCCESS SCREEN
   * =========================================
   */

  if (success) {
    return (
      <main className="min-h-screen bg-[#071312] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1917] p-10 text-center shadow-2xl">

          {/* SUCCESS ICON */}

          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10">
            <CheckCircle2
              size={44}
              className="text-emerald-400"
            />
          </div>

          {/* TITLE */}

          <h1 className="text-4xl font-bold">
            Password changed
          </h1>

          {/* MESSAGE */}

          <p className="mt-4 text-slate-400">
            Your CampusConnect student password
            has been changed successfully.
          </p>

          {/* LOGIN BUTTON */}

          <button
            type="button"
            onClick={() =>
              router.push("/auth/login")
            }
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-emerald-400 px-7 py-4 font-semibold text-black transition hover:bg-emerald-300"
          >
            Go to Student Login

            <ArrowRight size={20} />
          </button>

        </div>
      </main>
    );
  }

  /*
   * =========================================
   * RESET FORM
   * =========================================
   */

  return (
    <main className="min-h-screen bg-[#071312] text-white flex items-center justify-center p-6">

      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1917] p-8 shadow-2xl sm:p-10">

        {/* =========================================
            BRAND
           ========================================= */}

        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400">
            <GraduationCap
              size={30}
              className="text-black"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              CampusConnect
            </h2>

            <p className="text-sm text-slate-400">
              Smart Campus Management
            </p>
          </div>

        </div>

        {/* DIVIDER */}

        <div className="my-8 border-t border-white/10" />

        {/* =========================================
            HEADER
           ========================================= */}

        <div className="mb-7">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            <ShieldCheck size={16} />

            Secure student password reset
          </div>

          <h1 className="text-4xl font-bold">
            Create a new password
          </h1>

          <p className="mt-3 leading-7 text-slate-400">
            Enter a new password for your
            CampusConnect student account.
          </p>

        </div>

        {/* =========================================
            ERROR
           ========================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
            {error}
          </div>
        )}

        {/* =========================================
            FORM
           ========================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* =========================================
              NEW PASSWORD
             ========================================= */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-300">
              New password
            </label>

            <div className="relative">

              {/* LOCK ICON */}

              <Lock
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              {/* PASSWORD INPUT */}

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                className="w-full rounded-xl border border-white/10 bg-[#111f1d] py-4 pl-12 pr-12 text-white outline-none transition focus:border-emerald-400"
                disabled={loading}
                autoComplete="new-password"
              />

              {/* SHOW PASSWORD */}

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>

            </div>

          </div>

          {/* =========================================
              CONFIRM PASSWORD
             ========================================= */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-300">
              Confirm new password
            </label>

            <div className="relative">

              {/* LOCK ICON */}

              <Lock
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              {/* CONFIRM PASSWORD INPUT */}

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-white/10 bg-[#111f1d] py-4 pl-12 pr-12 text-white outline-none transition focus:border-emerald-400"
                disabled={loading}
                autoComplete="new-password"
              />

              {/* SHOW CONFIRM PASSWORD */}

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>

            </div>

          </div>

          {/* =========================================
              PASSWORD REQUIREMENT
             ========================================= */}

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            Password must contain at least
            8 characters.
          </div>

          {/* =========================================
              CHANGE PASSWORD BUTTON
             ========================================= */}

          <button
            type="submit"
            disabled={loading || !token}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-400 py-4 font-bold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Changing password..."
              : "Change Password"}

            {!loading && (
              <ArrowRight size={20} />
            )}
          </button>

        </form>

        {/* =========================================
            RETURN TO LOGIN
           ========================================= */}

        <div className="mt-8 border-t border-white/10 pt-6 text-center">

          <button
            type="button"
            onClick={() =>
              router.push("/auth/login")
            }
            className="text-sm text-slate-400 hover:text-emerald-300"
          >
            ← Return to Student Portal
          </button>

        </div>

      </div>

    </main>
  );
}