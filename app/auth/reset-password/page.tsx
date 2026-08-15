"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const portal = searchParams.get("portal") || "student";

  const isAdmin = portal === "admin";

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

    if (!token) {
      setError("Invalid or missing password reset link.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

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

      const response = await fetch(
        "/api/auth/reset-password",
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

      const text = await response.text();

      let data: {
        success?: boolean;
        message?: string;
        portal?: string;
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

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(
        "RESET PASSWORD FRONTEND ERROR:",
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

  const loginUrl = isAdmin
    ? "/admin/login"
    : "/auth/login";

  const loginText = isAdmin
    ? "Go to Admin Login →"
    : "Go to Student Login →";

  return (
    <main
      className={
        isAdmin
          ? "relative min-h-screen overflow-hidden bg-[#071126] text-white"
          : "relative min-h-screen overflow-hidden bg-[#071411] text-white"
      }
    >

      {/* =========================================
          ADMIN / STUDENT BACKGROUND
      ========================================= */}

      {isAdmin ? (
        <>
          {/* ADMIN NAVY BACKGROUND */}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(69,103,220,0.30),transparent_34%),radial-gradient(circle_at_82%_75%,rgba(88,68,190,0.25),transparent_38%),linear-gradient(135deg,#071126_0%,#101b42_48%,#0a1028_100%)]" />

          {/* ADMIN GRID */}

          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {/* ADMIN GLOW */}

          <div className="absolute left-[7%] top-[27%] h-3 w-3 rounded-full bg-blue-300/70 shadow-[0_0_22px_rgba(96,165,250,0.9)]" />

          <div className="absolute right-[8%] top-[48%] h-3 w-3 rounded-full bg-blue-400/70 shadow-[0_0_22px_rgba(96,165,250,0.9)]" />

          <div className="absolute left-[45%] bottom-[10%] h-2 w-2 rounded-full bg-purple-400/60 shadow-[0_0_18px_rgba(167,139,250,0.8)]" />
        </>
      ) : (
        <>
          {/* STUDENT BACKGROUND — UNCHANGED */}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(80,80,180,0.18),transparent_40%)]" />

          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

          <div className="absolute left-[12%] top-[30%] h-3 w-3 rounded-full bg-blue-400/70 shadow-[0_0_20px_rgba(59,130,246,0.7)]" />

          <div className="absolute right-[15%] top-[42%] h-3 w-3 rounded-full bg-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.7)]" />
        </>
      )}

      {/* =========================================
          CONTENT
      ========================================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <section
          className={
            isAdmin
              ? "w-full max-w-[520px] rounded-[28px] border border-blue-200/10 bg-[#101a36]/95 p-7 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10"
              : "w-full max-w-[520px] rounded-[28px] border border-white/10 bg-[#081411]/95 p-7 shadow-2xl backdrop-blur-xl sm:p-10"
          }
        >

          {/* =========================================
              BRAND
          ========================================= */}

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">

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

          {/* =========================================
              BADGE
          ========================================= */}

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-3 py-1.5 text-xs font-medium text-blue-300">

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

            {isAdmin
              ? "Secure administrator password reset"
              : "Secure student password reset"}

          </div>

          {/* =========================================
              HEADING
          ========================================= */}

          <h2 className="text-3xl font-bold tracking-tight">
            Create new password
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {isAdmin
              ? "Choose a strong password for your CampusConnect administrator account."
              : "Choose a strong password for your CampusConnect student account."}
          </p>

          {/* =========================================
              ERROR
          ========================================= */}

          {error && (
            <div className="mt-7 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* =========================================
              SUCCESS
          ========================================= */}

          {success && (
            <div className="mt-7 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-4 text-blue-300">

              <div className="font-semibold">
                Password reset successful
              </div>

              <div className="mt-1 text-sm">
                {success}
              </div>

              <Link
                href={loginUrl}
                className="mt-4 inline-flex rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-400"
              >
                {loginText}
              </Link>

            </div>
          )}

          {/* =========================================
              FORM
          ========================================= */}

          {!success && (
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >

              {/* NEW PASSWORD */}

              <div>

                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  New password
                </label>

                <div className="relative">

                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    🔒
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
                    className={
                      isAdmin
                        ? "h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50 focus:bg-white/[0.065]"
                        : "h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>

                </div>

              </div>

              {/* CONFIRM PASSWORD */}

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    🔒
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
                    className={
                      isAdmin
                        ? "h-14 w-full rounded-xl border border-white/10 bg-white/[0.045] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/50 focus:bg-white/[0.065]"
                        : "h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400"
                  >
                    {showConfirmPassword
                      ? "🙈"
                      : "👁"}
                  </button>

                </div>

              </div>

              {/* =========================================
                  REQUIREMENTS
              ========================================= */}

              <div
                className={
                  isAdmin
                    ? "rounded-xl border border-white/10 bg-white/[0.025] p-4"
                    : "rounded-xl border border-white/10 bg-white/[0.025] p-4"
                }
              >

                <p className="text-sm font-medium text-slate-300">
                  Password requirements
                </p>

                <ul className="mt-2 space-y-1 text-xs text-slate-500">

                  <li>
                    • At least 8 characters
                  </li>

                  <li>
                    • Use a strong combination of letters and numbers
                  </li>

                  <li>
                    • Avoid easily guessed information
                  </li>

                </ul>

              </div>

              {/* =========================================
                  SUBMIT
              ========================================= */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-500 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
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

          {/* =========================================
              FOOTER
          ========================================= */}

          <div className="mt-7 border-t border-white/10 pt-7 text-center">

            <Link
              href={loginUrl}
              className="text-sm text-slate-500 transition hover:text-blue-400"
            >
              ← Return to{" "}
              {isAdmin
                ? "Admin Login"
                : "Student Login"}
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
        <div className="flex min-h-screen items-center justify-center bg-[#071126] text-white">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}