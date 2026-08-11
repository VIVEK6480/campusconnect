"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Check reset token
     */
    if (!token) {
      setError(
        "Invalid or missing password reset link."
      );
      return;
    }

    /*
     * Check password
     */
    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    /*
     * Minimum password length
     */
    if (newPassword.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    /*
     * Check confirmation
     */
    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      /*
       * =========================================
       * ADMIN RESET API
       * =========================================
       *
       * This page is the administrator reset page,
       * therefore it uses the admin reset endpoint.
       */
      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token: token,
            newPassword: newPassword,
            confirmPassword: confirmPassword,
          }),
        }
      );

      /*
       * Safely read response
       */
      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to reset password. Please try again."
        );
      }

      setSuccess(
        data.message ||
          "Password updated successfully. You can now log in."
      );

      /*
       * Clear fields after successful reset
       */
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(
        "ADMIN RESET PASSWORD FRONTEND ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#071411] text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(80,80,180,0.18),transparent_40%)]" />

      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Decorative dots */}
      <div className="absolute left-[12%] top-[30%] h-3 w-3 rounded-full bg-blue-400/70 shadow-[0_0_20px_rgba(59,130,246,0.7)]" />

      <div className="absolute right-[15%] top-[42%] h-3 w-3 rounded-full bg-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.7)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <section className="w-full max-w-[520px] rounded-[28px] border border-white/10 bg-[#081411]/95 p-7 shadow-2xl backdrop-blur-xl sm:p-10">

          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-[#071411] shadow-lg shadow-blue-500/20">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5Z" />
                <path d="M6 10v5.5c0 1.7 2.7 3.5 6 3.5s6-1.8 6-3.5V10" />
                <path d="M21 9v6" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                CampusConnect
              </h1>

              <p className="text-sm text-slate-400">
                Smart Campus Management
              </p>
            </div>
          </div>

          <div className="my-8 h-px bg-white/10" />

          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-xs font-medium text-blue-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>

            Secure administrator password reset
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold tracking-tight">
            Create new password
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Choose a strong password for your
            CampusConnect administrator account.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-7 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-7 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-400">
              <div className="font-semibold">
                Password reset successful
              </div>

              <div className="mt-1">
                {success}
              </div>

              {/* ADMIN LOGIN */}
              <Link
                href="/admin/login"
                className="mt-4 inline-flex rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-400"
              >
                Go to Admin Login →
              </Link>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              {/* New password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  New password
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="10"
                        rx="2"
                      />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </div>

                  <input
                    id="newPassword"
                    name="newPassword"
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
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-400"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.3A10.5 10.5 0 0 1 12 4c5.5 0 9 5.8 9 8a8.5 8.5 0 0 1-2.1 3.4" />
                        <path d="M6.1 6.1C3.9 7.7 3 10.1 3 12c0 2.2 3.5 8 9 8 1.2 0 2.4-.3 3.4-.8" />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="10"
                        rx="2"
                      />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </div>

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
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
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-400"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.3A10.5 10.5 0 0 1 12 4c5.5 0 9 5.8 9 8a8.5 8.5 0 0 1-2.1 3.4" />
                        <path d="M6.1 6.1C3.9 7.7 3 10.1 3 12c0 2.2 3.5 8 9 8 1.2 0 2.4-.3 3.4-.8" />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <p className="text-sm font-medium text-slate-300">
                  Password requirements
                </p>

                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  <li>
                    • At least 8 characters
                  </li>

                  <li>
                    • Use a strong combination of
                    letters and numbers
                  </li>

                  <li>
                    • Avoid easily guessed information
                  </li>
                </ul>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-500 font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Updating password...
                  </>
                ) : (
                  <>
                    Update Password

                    <span className="text-lg">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-7 border-t border-white/10 pt-7 text-center">
            <Link
              href="/admin/login"
              className="text-sm text-slate-500 transition hover:text-blue-400"
            >
              ← Return to Admin Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#071411] text-white">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}