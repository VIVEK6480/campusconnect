"use client";

import {
  FormEvent,
  Suspense,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  ShieldCheck,
} from "lucide-react";

function FacultyResetPasswordContent() {
  const searchParams = useSearchParams();

  const token =
    searchParams.get("token") || "";

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!token) {
        setError(
          "Password reset token is missing or invalid."
        );
        return;
      }

      const res = await fetch(
        "/api/auth/faculty/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Unable to reset your password."
        );
        return;
      }

      setSuccess(true);

      setMessage(
        data.message ||
          "Password updated successfully."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(
        "FACULTY RESET PASSWORD ERROR:",
        err
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at 15% 20%,
              rgba(34,211,238,0.18),
              transparent 30%
            ),
            radial-gradient(
              circle at 85% 75%,
              rgba(56,189,248,0.16),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #07111f 0%,
              #0b1729 50%,
              #07111f 100%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(255,255,255,0.8) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.8) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "55px 55px",
        }}
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-md">

          {/* =================================================
              LOGO
          ================================================== */}

          <div className="mb-8 flex items-center justify-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-lg shadow-cyan-500/20">

              <GraduationCap size={26} />

            </div>

            <div>

              <h1 className="text-xl font-bold">
                CampusConnect
              </h1>

              <p className="text-xs text-slate-400">
                Smart Campus Management
              </p>

            </div>

          </div>

          {/* =================================================
              CARD
          ================================================== */}

          <div className="rounded-3xl border border-white/10 bg-[#0d1727]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">

            {!success ? (
              <>

                {/* =========================================
                    HEADER
                ========================================== */}

                <div className="mb-7">

                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">

                    <ShieldCheck size={14} />

                    Faculty Account

                  </div>

                  <h2 className="text-3xl font-bold">
                    Reset password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Create a new password for your
                    CampusConnect faculty account.
                  </p>

                </div>

                {/* =========================================
                    ERROR
                ========================================== */}

                {error && (
                  <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">
                    {error}
                  </div>
                )}

                {/* =========================================
                    FORM
                ========================================== */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* =======================================
                      NEW PASSWORD
                  ======================================== */}

                  <div>

                    <label
                      htmlFor="newPassword"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      New Password
                    </label>

                    <div className="relative">

                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        id="newPassword"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(
                            e.target.value
                          );

                          setError("");
                        }}
                        placeholder="Enter new password"
                        required
                        disabled={loading}
                        className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        disabled={loading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* =======================================
                      CONFIRM PASSWORD
                  ======================================== */}

                  <div>

                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">

                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(
                            e.target.value
                          );

                          setError("");
                        }}
                        placeholder="Confirm new password"
                        required
                        disabled={loading}
                        className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        disabled={loading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* =======================================
                      BUTTON
                  ======================================== */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Updating...
                      </>
                    ) : (
                      <>
                        Update Password

                        <Lock size={18} />
                      </>
                    )}

                  </button>

                </form>

                {/* =========================================
                    BACK TO LOGIN
                ========================================== */}

                <div className="mt-7 text-center">

                  <Link
                    href="/faculty/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                  >

                    <ArrowLeft size={15} />

                    Back to Faculty Login

                  </Link>

                </div>

              </>
            ) : (

              /* ===========================================
                 SUCCESS
              ============================================ */

              <div className="text-center">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400">

                  <CheckCircle2 size={36} />

                </div>

                <h2 className="text-2xl font-bold">
                  Password Reset Successful
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {message}
                </p>

                <Link
                  href="/faculty/login"
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
                >

                  <ArrowLeft size={16} />

                  Go to Faculty Login

                </Link>

              </div>

            )}

          </div>

        </div>

      </div>

    </main>
  );
}

// =========================================================
// PAGE
// =========================================================

export default function FacultyResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">

          <div className="flex items-center gap-3 text-sm text-slate-400">

            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />

            Loading password reset...

          </div>

        </main>
      }
    >
      <FacultyResetPasswordContent />
    </Suspense>
  );
}